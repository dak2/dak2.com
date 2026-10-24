---
title: "Cloudformationを使って0から社内アプリケーションのAWSインフラを構築した"
date: 2023-11-04
description: "IaC は良いぞ"
tags: "AWS"
---

## 概要

仕事で新しい社内アプリケーションを作る機会があり、`Cloudformation`を使って0から`AWS`インフラを構築したので、振り返りも兼ねてやってきたことや苦労したことをまとめる。

## 技術スタック

- `Rails` 7系
- `Ruby` 3系

社内の技術ナレッジ的に`Rails`がベストなのでそちらを採用していた。

## やったこと

大まかにやったことは下記の通り。

1. `AWS`リソース構成図を書く
2. `Cloudformation`でざっくりとリソースを定義
3. `Cloudformation`をデプロイしてスタックを作りながら微調整
4. `Dockerfile`を本番用にビルドして`ECR`にpush
5. スタックを更新してアプリケーションが動くように微調整
6. ドメインの取得と`SSL`化

### 1. AWSリソース構成図を書く

`Fargate`でWebアプリケーションを動作させて、DBは`RDS`を利用するシンプルな構成。

`Gateway`があって、`LoadBalancer`を挟んでトラフィックを受け入れる形。

ひとまず下図のような形になった。

![AWS構成図](./images/aws_resouce_image.png)

### 2. Cloudformationでざっくりとリソースを定義

`Cloudformation`で大まかにリソースを定義していった。

`ChatGPT`やサンプルテンプレートを参照してリソースを定義し、公式docを見ながら正しいこと確認する流れで進めた。



`ChatGPT`が出力したリソース例だと割とエラーになるケースが多く、公式docをベースにしつつエラーが起きた場合だけ、`ChatGPT`に聞きつつ進めるという形に落ち着いた。

特にAWS公式が出している下記の`ECS`テンプレートスニペットはかなり重宝した。

refs. [https://docs.aws.amazon.com/ja_jp/AWSCloudformation/latest/UserGuide/quickref-ecs.html](https://docs.aws.amazon.com/ja_jp/AWSCloudformation/latest/UserGuide/quickref-ecs.html)

### 3. Cloudformationで作成したリソース定義をもとにスタックを作りながら微調整

作成したリソース定義をもとにスタックを作りながら動作等を微調整していった。

スタック作る過程で`RDS`のリソース作成はかなり時間がかかるということが分かってきた。（それはそう）

そのため、`RDS`と`ECS`は別々でリソース作成するように進め方を変更した。



まず、`RDS`単体のリソース単体で作成できることを確認し、その後`ECS`単体のリソース作成を確認。

最後に両者を紐づけていく流れにしていった。

#### 3-1. RDS周り

今回のアプリケーションは`I/O`負荷等が高くないので、`RDS`は小さめの構成を選択した。

`RDS`インスタンスのクラスも小さめだし、ストレージタイプも小さいものを選んだ。マルチAZもなし。

refs. [https://docs.aws.amazon.com/ja_jp/AmazonRDS/latest/UserGuide/CHAP_Storage.html#Concepts.Storage](https://docs.aws.amazon.com/ja_jp/AmazonRDS/latest/UserGuide/CHAP_Storage.html#Concepts.Storage)

#### 3-2. ECS周り

`ECS`のリソースを定義する過程で下記のようなエラーに遭遇し、`CloudTrail`や`CloudWatch Logs`等を確認しつつ対応していった。

- `ECS`のタスク実行ロールにポリシーが足りないためスタック作成時にエラー
- ゲートウェイがデタッチできないエラー

### ECSのタスク実行ロールにポリシーが足りないためスタック作成時にエラー

`ECS`タスク実行ロール権限を付与したロールを作成し、`ECS`のタスクから各AWSリソースにアクセスするためにポリシーを付与。

最初は、AWS管理の `AmazonECSTaskExecutionRolePolicy`を付与すればすんなりいけるのかなと思っていたが、中身を見てみると `CloudWatch Logs` のWrite、`ECR` のReadしか許可されていなかった。



そのため、追加で`RDS`や`S3`、`Systems Manager`などのリソースにアクセスできるようにポリシーを付与した。

今回は利用しなかったが、`CloudTrail`イベントに基づいてポリシーを生成できる機能が便利そう。

### ゲートウェイがデタッチできないエラー

```plaintext
Network vpc-xxxxxxxx has some mapped public address(es). Please unmap those public address(es) before detaching the gateway.
```

大幅なスタック変更を反映しようとすると、`Internet Gateway`がデタッチできず`Cloudtrail`で上記のエラーが出ていた。

どうやら、スタックを作り替える際に`VPC`からパブリックIPをアンマッピングする前に`Internet Gateway`をデタッチしようとしているよう。



下記の記事でも同じエラーに遭遇していた。

記事によると、一度リソースを削除してみるしかないようで、削除したら解決した。

refs. [https://hyp0th3rmi4.medium.com/aws-Cloudformation-adventures-part1-build-your-own-vpc-d3f6d990d1fd](https://hyp0th3rmi4.medium.com/aws-Cloudformation-adventures-part1-build-your-own-vpc-d3f6d990d1fd)



この作業を通じて `NAT Gateway`の存在を知った。

`NAT Gateway` は `Private Subnet`内のインスタンスからネットワーク接続するためのアドレス変換サービスのよう。

### 4. Dockerfileを本番用にビルドしてECRにpush

`Dockerfile`は事前にビルドして`ECR`に格納した上で利用していたが、そのイメージが正しくなかったので修正した。

`docker-compose.yml`側に寄せていたため、`Dockerfile`単体のイメージにリポジトリのファイルがマウントされておらず、そのまま`ECS`にあげても `rails Command not found`となってしまっていた。

そのため、本番環境用に`Dockerfile`を作り直してビルドした上で利用した。



その際にやったことをリストにまとめると下記のようになる。

- `Systems Manager`で環境変数を渡すようにする
- イメージビルドと同時に`precompile`しておく
- `AWS_ACCESS_KEY`などの秘匿情報は渡さずにECSタスク実行ロールにポリシーを付与
- `SECRET_KEY_BASE`の渡し方を工夫する
- `Dockerfile`で`x86_64`のプラットフォームを指定
- `ENTRYPOINT`を追加し`shell`スクリプトでサーバー起動

#### 4-1. Systems Managerで環境変数を渡すようにする

元々`docker-compose.yml`に環境変数をベタ書きしていた。

プライベートリポジトリだから漏洩リスクが低いことと、スピード感を優先した結果、そういう構成になっていた。



ただ、`Dockerfile`のイメージに環境変数を含めるのはリスクなので、`Systems Manager`のパラメータストアに格納した環境変数を利用するようにした。

#### 4-2. イメージビルドと同時にprecompileしておく

当初はコンテナ起動時にサーバー起動と一緒に`precompile`をしていた。

ただ、それだと後々起動に時間がかかってしまうというレビューをいただき、イメージビルド時に`precompile`することにした。

#### 4-3.AWS_ACCESS_KEYなどの秘匿情報は渡さずにECSタスク実行ロールにポリシーを付与

ローカルで`S3`と接続する際に `AWS_ACCESS_KEY_ID`などを環境変数で渡していた。

環境変数をパラメータストアから注入する形にすると、事前にローカルでイメージビルドする際に`precompile`でこける。(`AWS_ACCESS_KEY_ID`がないため)



そもそも本番環境で`S3`にアクセスさせるために、`AWS_ACCESS_KEY_ID`など必要ではなく、ECSタスク実行ロールに`S3`へのアクセスポリシーを付与すれば良いというレビューをいただいた。



そのため、ローカル環境なら`AWS_ACCESS_KEY_ID`を環境変数として利用し、本番環境ではポリシー付与することで該当の環境変数を不要にした。

#### 4-4. SECRET_KEY_BASEの渡し方を工夫する

`precompile`を成功させるには`SECRET_KEY_BASE`の環境変数が必要になる。

当初は`RUN --mount=type=secret`を使って`SECRET_KEY_BASE`の秘匿情報を渡していた。

refs. [https://docs.docker.com/engine/reference/builder/#run---mounttypesecret](https://docs.docker.com/engine/reference/builder/#run---mounttypesecret)



しかし、`RoR`の下記issueを確認したところ、そもそもビルドステップ時において本物の`SECRET_KEY_BASE`を渡す必要がないとのことで、`dummy`の値を渡すように変更した。（buildのコマンドも短くなってスッキリする）

refs. [https://github.com/rails/rails/issues/32947#issuecomment-470380517](https://github.com/rails/rails/issues/32947#issuecomment-470380517)



また、ビルド時に`production`という変数を渡せば`precompile`するし、そうでなければしないようにすることで、ローカル環境と本番環境で`Dockerfile`を併用できるようにした。

#### 4-5. Dockerfileでx86_64のプラットフォームを指定

`M1 Mac`だとビルドすると`arm`のイメージが作成されてしまい、`ECS`タスク起動時に下記エラーが吐かれる。

```plaintext
[FATAL tini (8)] exec /bin/sh failed: Exec format error
```

ECSタスクのデフォルトアーキテクチャは`x86_64`なので、そちらに合わせて`Dockerfile`内でプラットフォームを`x86_64`に指定した。

#### 4-6. ENTRYPOINTを追加しshellスクリプトでサーバー起動

当初は`Cloudformation`のECSタスク定義の`Command`オプションにサーバー起動のコマンドを記述していた。

ただ、`ECS`タスク起動時に`Dockerfile`の`ENTRYPOINT`が実行されると公式ドキュメントに記載されていたのでそちらに変更。

`ECS`タスク起動時に`docker run`するから実行されるとのこと。

refs. [https://docs.aws.amazon.com/ja_jp/AmazonECS/latest/userguide/task_definition_parameters.html](https://docs.aws.amazon.com/ja_jp/AmazonECS/latest/userguide/task_definition_parameters.html)

### 5. スタックを更新してアプリケーションが動くように微調整

ここまできたらアプリケーションが動くかなと思っていたが、タスク起動時にヘルスチェックに失敗し続けていた。

ヘルスチェックのエンドポイントがなかったのでコケ続けていたため、`ELB`のタイムアウト設定を追加(`HealthCheckIntervalSeconds`など)して、専用のエンドポイントを設定したところ、ヘルスチェックに成功した。



また、`ActionView::Template::Error (The asset "application.css" is not present in the asset pipeline.)`エラーが出たので、`RAILS_SERVE_STATIC_FILES`の環境変数を正しく設定した。



さらに、コンテナ側では80番ポートを開けているのに、`Rails`サーバー起動時に3000番ポートで動かしてしまいエラーが出たので、ポートを80番で起動させるように修正した。(ローカルのやつそのままコピペしてた)



加えて、`RDS`起動後に`ECS`を立ち上げるように`DependsOn`で立ち上げ順序の指定を行うなどした。

### 6. ドメインの取得とSSL化

- ドメインの取得
- ドメインに`LB`を割り当て
- `SSL`化

基本的に下記の記事を参考にして行った。

refs. [https://qiita.com/NaokiIshimura/items/654f1f82adb039f1ad47](https://qiita.com/NaokiIshimura/items/654f1f82adb039f1ad47)

#### 6-1. ドメインの取得

`Route53`でドメイン名を取得した。円安....

#### 6-2. ドメインにLBを割り当て

`ECS`と紐づいている`LB`にドメインを割り当てることで、ドメイン名を入力してアクセスできるようになる。

#### 6-3. SSL化

`ACM`にて証明書の発行リクエストを行い、`LB`に紐づいている`Security Group`のインバウンドルールに`HTTPS`での通信を許可し、`LB`のリスナーに`HTTPS`を追加すればOK。

## デバッグについて

基本的には記述した`Cloudformation`で`stack`を作成しイベントログや`CloudTrail`を参照してリソース作成時のエラーを確認。

アプリケーション立ち上げ時には、`CloudWatch Logs`を確認していた。

また、必要に応じて下記コマンドで`ECS`タスク内部に入ってファイル等を確認することを行った。

```plaintext
$ aws ecs update-service --region region-name --cluster cluster-name --service service-name --enable-execute-command
```



上記のコマンドで`ECS`クラスター内のサービスでコマンド実行を可能にする。

```plaintext
$ aws ecs describe-services --cluster cluster-name --services service-name | jq '.services[].enableExecuteCommand'
```



上記のコマンドでクラスター内のサービスでコマンド実行が可能状態かどうか確認。

```plaintext
$ aws ecs update-service --force-new-deployment --service service-name --cluster cluster-name
```



上記のコマンドでクラスター内のサービスで強制デプロイをかけることで、コマンド実行可能なタスクが作成される。

```plaintext
$ aws ecs execute-command --region region-name --cluster cluster-name --task task-name --container container-name --interactive --command "/bin/sh"
```

その上で新規作成したタスク名を指定して。コマンドを実行することでコンテナに入る。

`RDS`に接続して`DB`が作成されているかどうかなど確認した。

## デプロイについて

1. イメージをビルド
2. `ECR`にpush
3. タスクの新規登録
4. `ECS`サービスの更新

### 1. イメージをビルド

```plaintext
$ docker build -t image-name:version -f Dockerfile . --build-arg RAILS_ENV=production
```

`RAILS_ENV`の引数を渡したら`precompile`が走るようになっている。



```plaintext
$ docker tag image-name:version *******.dkr.ecr.ap-northeast-1.amazonaws.com/repository-name:version
```

イメージにタグを付与する。

### 2. ECRにpush

```plaintext
$ aws ecr get-login-password --region resion-name | docker login --username user-name --password-stdin ********.dkr.ecr.resion-name.amazonaws.com
```

`ECR`にログイン



```plaintext
$ docker push **********.dkr.ecr.resion-name.amazonaws.com/repository-name:version
```

`ECR`にイメージpushする。

### 3. タスクの新規登録

```plaintext
$ aws ecs register-task-definition --family family_name --cli-input-json "$(aws ecs describe-task-definition --task-definition task_definition_name:{$number} | jq '.taskDefinition' | jq 'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredBy, .registeredAt)')"
```

`jq`を使って`describe-task-definition`で取得したタスク定義から不要なものを取り除いた上で新規のタスクを登録している。



下記の記事にもあるように、`describe-task-definition`で取得したタスク定義の`JSON`はそのままだと登録できず、不要な項目を省いて登録する必要がある。

refs. [https://dev.classmethod.jp/articles/describe-task-definition-to-register-task-definition/](https://dev.classmethod.jp/articles/describe-task-definition-to-register-task-definition/)

### 4. ECSサービスの更新

```plaintext
$ aws ecs update-service --cluster cluster-name --service service-name --task-definition task_definition_name:{$number}
```

3のコマンドを実行すると、`JSON`が返却されてタスク定義名が返却されるので、そちらを指定して`ECS`を更新する。

そうすることで、新しいタスクが実行されてデプロイが完了する。

## まとめ

0から`AWS`リソースを構築することができたのはとても良い経験になった。

社内の既存アプリケーションのインフラはコード化されておらず、今回のアプリケーション作成を通じて`IaC`の基盤を構築できたということも一つ成果として挙げられる。



インフラ構築は経験したことがなかったので、最初はリソースの調査をしつつ、1つ1つ定義していった。

`stack`の作成・更新を通じてエラーが出てそれを直すという繰り返しで、エラー駆動で進めていた。



エラーの原因がよく分からないとなった時は、どこのリソースまで定義したらエラーになるんだっけ等、問題の分割ができるのも新しい発見だった。

`AWS`コンソール画面で手動作成するのではなく、`Cloudformation`を使ったからそれがやりやすかったのではないかという印象を受けている。

社内でインフラに精通しているエンジニアの方にアドバイスももらいつつ進められた。この場を借りて改めて感謝したい。
