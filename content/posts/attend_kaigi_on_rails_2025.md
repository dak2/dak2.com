---
title: "Kaigi on Rails 2025 に参加した"
date: 2025-10-04
description: "学びと出会いがあった素敵なカンファレンスだった"
tags: "Conference"
---

2025/09/26, 27 の2日間で行われた Kaigi on Rails に参加してきました。

https://kaigionrails.org/2025/

何気にオフライン参加は初めてでした。学びと出会いがあった素敵なカンファレンスだったので、振り返っていきたいと思います。

## 印象に残ったセッション

### Keynote: dynamic!

https://speakerdeck.com/moro/dynamic

morohashi さんの keynote、継続して変化に向き合い続けること、動的であることの良さを改めて感じました。ソフトウェアは、動的/dynamic な関わる人たち皆の、現在の理解の表現であると。刻一刻と変化する事象に対して dynamic に向き合い続けていく必要があるし、それは楽しい営みであると。

Ruby を使って開発をしていると、IRB やオープンクラスなど動的な側面を感じる場面があります。また、Rails がレールを用意してくれているので、レールに乗った上で変化への向き合い方を時々で取捨選択しやすいとも思います。

イメージとしてはレールに乗った上で、ドメインの知識をどう表現していくのかという変化へ対応しやすい側面があるなと。Ruby / Rails を使った開発の良い側面を自分の中でまた一つ咀嚼できた気がします。

印象に残った言葉

- "外的環境や自分のやりたいことも変化する、カンファレンスなどに参加して変化への勇気を貯める"
- "IRB はソフトウェアの仮説検証の最小単位"
- "集中するもの以外は保留する"
- "設計はその日に必要なユースケースを満たすこと"

パタン・ランゲージのフォース、アジャイルソフトウェア開発宣言など存在は知っているが、ちゃんと理解してなかったなと思ったので見てみよう。

https://amzn.asia/d/74EZUFK

https://agilemanifesto.org/iso/ja/manifesto.html

### 入門 FormObject

https://speakerdeck.com/expajp/an-introduction-to-formobject

今年の Kaigi on Rails は FormObject と Service クラス に思いのあるセッションが多かったですね。

個人的にはどちらもあまり好みではなく、集約を見つけてモデルとして表現したい派ではありますし、まずはそこに向き合うべきだという理解をしました。

使い分けのマトリクスはある一定理解できるし、初めて向き合うのであれば、参考になるなとは思いました。

- 2個以上のモデルを操作する
- アクションごとに固有のライフサイクル処理を分ける
  - Create と Edit みたいな

あとは、SPA 化に伴う複雑なパラメータハンドリングとかもありそうですね。

ただ、人によってこれも判断軸が分かれてくるところだと思っていて、共通認識がぶれやすいところですよね。こういう側面があるから、Service クラス や FormObject の扱いが難しいと思うんですよね。Scaffold に生成されたコードには存在しないですからね。

個人的には、モデルと FormObject のどっちにロジックを書くべきなのか判断に迷うケースがあるなと感じます。ビジネスロジックはもちろんモデルに書くんですが、特定の画面やリクエストなどで必要なロジックは FormObject 側に寄せるかなと。

とはいえ、モデリングをサボるなという話ではあると思っていて、ActiveRecord を継承したクラスだけがモデルじゃないぞというのは大事なポイント。ActiveModel もあるよ！

ohbarye さんのポストは確かになと思いました。

https://x.com/ohbarye/status/1971446495552692599

> モデリング側のstaticさに対してviewのユースケースがdynamicすぎるのでその調停役という役割を担わされるのよな
その意図で作られるform objectについてはinteractorの方が役割を的確に表現する語彙だと思う

ONCE のコードではこのあたりどう表現しているのだろうか。読んでみよう。

### Railsによる人工的「設計」入門

https://speakerdeck.com/nay3/kaigi-on-rails-2025-she-ji

"初学者は要件をまずコードでどう落とし込むかを考える" これ新卒の頃の自分もしていたんですよね。

自分の場合も、要件を抽象的に理解し、図式化をして要件を俯瞰的に見て、具体を調整して、抽象を見てということを繰り返していくと少しずつできるようになっていた気がします。

この文脈における図式化のメリットって、要素間の関係性が分かって全体像を掴みやすいことや、要素間で必要な関係性・機能がないか見つけやすくなることだと思います。

それをしていくと、要件に対して FB をかけられるので設計もソリッドになっていくんですよね。

人間は自然言語を使えるが、自然言語で理解を促すのは限界があるなという意識も大きいかもしれません。

### 今改めてServiceクラスについて考える 〜あるRails開発者の10年〜

https://speakerdeck.com/joker1007/jin-gai-meteservicekurasunituitekao-eru-arurailskai-fa-zhe-no10nian

joker さんのセッション、控えめに言って最高でした。とてもパンチラインが効いていて、1エンジニアとして身が引き締まりましたね。

一言で言うと、「ドメインモデリングサボるなよ」という話だと理解しました。

Service クラスを使わない方が良いのは「開発統制の困難さを上回るメリットが得られない」から。

エリック・エヴァンスの DDD 本におけるサービスは「ビジネスドメインから生まれる概念の中で、エンティティや値オブジェクトに責務を持たせるとそれらの適宜を歪めたり不自然なオブジェクトが生まれる場合がある。そう言ったときに振る舞いに着目して何が実行できるかという観点から命名し責務を定義するもの。その命名と操作名はユビキタス言語に由来してなければならない」

チーム開発において、共通認識を合わせることが重要。そのために大事になのは「ちゃんと想像が付く」こと。Service クラスで扱うロジックの適切さ、境界の切り方などなど、人によってかなり基準が分かれる。Rails の基本レイヤー MVC を守るだけで共通認識が作れるし、それが FW を使う利点。

Service クラスの責務の曖昧さはその通りですよね。FormObject の話にも戻りますが、MVC から外れるとやっぱり認識がぶれるよなと。

余談ですが、Fat Model に対してモデル分割を考えるタイミング、igaiga さんのスライドも参考になります。

https://speakerdeck.com/igaiga/kaigionrails2024/

また、モジュラモノリスでコンポーネントの境界が明確になったとき、Web と言う I/F に限定されないコンポーネントレベルでの公開エントリポイントに Service クラスを利用するのは意味があるという主張は興味深かったです。公開 I/F として扱うから、DDD 本で表されたサービスに近い意味合いがあるのかな。

型検査をやるならこう言ったコンポーネントの境界をまたぐ公開エントリポイントが最も重要度が高いなども、なるほど確かにそうかもなと思いました。今の会社でモジュラモノリスを扱っているので、実装と反復しながら勘所を掴みたいですね。

### 2重リクエスト完全攻略HANDBOOK

https://speakerdeck.com/shoheimitani/double-request-handbook

スマートバンク の mitani さんのセッション、とても参考になりました。

個人的には最初に DB の制約で防ぐことを考えます。

Idempotency-Key Header は知らなかったので参考になりました。HTTP リクエストを冪等にする仕組み。

要は、リクエストヘッダに渡された key をキャッシュしておいて、2回目以降のリクエストはキャッシュがあれば処理せず 200 系を返し、違う key であればそのまま処理して返す。

リクエストして NetworkError 返ってきてリトライしたら、二重リクエストになってしまった...などは外部サービス利用時のあるあるだなと。

スマートバンクでは、入金/引き落としの処理で利用されているとのこと。ここは二重リクエストになると大きな問題になりますよね。

ohbarye さんのスライドも合わせて非常に勉強になりました。

https://speakerdeck.com/ohbarye/my-favorite-protocol-idempotency-key-header

### 履歴 on Rails : Bitemporal Data Modelで実現する履歴管理

https://speakerdeck.com/hypermkt/history-on-rails-with-bitemporal-data-model

直近で履歴管理に頭を悩ませたこともあり参考になればと思って聞いていました。2つの時間軸を持つ履歴管理、Bitemporal Data Model

会社のテックブログでも書いたんですが、かなり複雑ですよね。有効期間 x システム登録期間、これだけでも扱う状態が増えるので運用は難しそうだなという印象は持っています。

履歴を考える際には、初手では一休さんのブログの内容を参考にできると良さそうだなとは思っています。

https://user-first.ikyu.co.jp/entry/history-table

### Range on Rails ― 「多重範囲型」という新たな選択肢が、複雑ロジックを劇的にシンプルにしたワケ

https://kaigionrails.org/2025/talks/umeda-rizap/#day2

PostgreSQL で多重範囲型(multirange)というデータ型が使えるのは知らなかったので勉強になりました。1レコードに対して複数の範囲型を持てると。

https://www.postgresql.org/docs/current/rangetypes.html#RANGETYPES

UNIQUE 制約もつけられるので、range が重複しないようにできるみたいですね。

https://www.postgresql.org/docs/current/rangetypes.html#RANGETYPES-CONSTRAINT

予約時にダブルブッキングを防ぐとかもできそう。soudai さんのブログにも記述がありますね。

https://soudai.hatenablog.com/entry/postgresql-schedule-design

複数の範囲を扱って計算、例えば"時間枠"などのケースには有効な手だと思いました。勉強になりました。PostgreSQL に限定されるけど。

### Keynote: Building and Deploying Interactive Rails Applications with Falcon

Falcon が多機能なことに驚きましたし、それを作りきっている Samuel すごい...という気持ちでした。

各 Gem の AGENTS.md を集めるリポジトリ、便利そう。

https://github.com/ioquatix/agent-context

セッションの最後で Live Coding が始まったのも面白かったです。作るというところに

## 聞けてないが内容に興味があったセッション

### 5年間のFintech × Rails実践に学ぶ - 基本に忠実な運用で築く高信頼性システム

https://speakerdeck.com/ohbarye/5-years-fintech-rails-retrospective

事業の性質を踏まえたアーキテクチャ設計は参考になるなと思いました。1開発者としてはモジュール周りの話はちょっと気になるな。

Vanilla Rails is plenty 読んでみよう。

https://dev.37signals.com/vanilla-rails-is-plenty/ 

### Rails アプリケーション開発者のためのブックガイド

https://speakerdeck.com/takahashim/a-guide-to-japanese-books-for-rails-application-developers

とても良いセッションだったらしく、聞きたかったなと。どんどん積読しようとは思いました。

こちらも合わせて参照したい。

https://docs.google.com/spreadsheets/d/1i9IMedBrNQ6J_wY9Gz0YO_2FCaaMB3wlouBTnQqUih0/edit

### 階層構造を表現するデータ構造とリファクタリング 〜1年で10倍成長したプロダクトの変化と課題〜

https://speakerdeck.com/yuhisatoxxx/jie-ceng-gou-zao-wobiao-xian-surudetagou-zao-torihuakutaringu-1nian-de10bei-cheng-chang-sitapurodakutonobian-hua-toke-ti

階層構造を表現するデータ構造、参考になりました。

特に、隣接リスト、閉包テーブル、再帰 CTE ごとにパフォーマンス比較されたマトリクスがあるのは助かりますね。設計する際の参考にしたいです。

### 「技術負債にならない・間違えない」権限管理の設計と実装

https://speakerdeck.com/naro143/ji-shu-fu-zhai-ninaranaijian-wei-enai-quan-xian-guan-li-noshe-ji-toshi-zhuang

後から見たんですが、とても良い資料だなと思いました。

「対象の、操作は、役割か条件ならできる」=>「Modelの、CRUDは、RoleかScopeならできる」

CRUD の権限判定メソッドに admin? など条件と役割が一緒に置かれがち問題はとても分かります。

役割をクラスに、条件をメソッド内に表現するように切り出すのは見通し良いなと思いました。参考になります。

## その他

### ソーダストリームを獲得した

https://twitter.com/mov_developers/status/1971836921103131087

mov さんブースのゲームが面白くてやりこんでしまいました。

とにかく高得点を出したかったので、合間にお邪魔して奮闘していました。お邪魔しました。

3位になったんですが、2位の方と景品を交換してソーダストリームを獲得しました。

### 懇親会

morohashi さんに直接セッション良かったですと伝えられたのが良かったです。

shimada さんと ledsun さんとコードコメントの話になり、コミットメッセージと比較してどうだろうかという話ができたのも面白かったです。

コメント、コミットメッセージ、ADR、徐々に接触距離が離れていくよねと。この距離を意識して情報を残したいですね。

1日目は2次会で、koic さんや joker さんたちとお酒を飲みました。

https://x.com/koic/status/1971566671212187856

joker さんにセッション良かったですと伝えられたことや、koic さんに mcp の ruby-sdk に関する話ができて良かったです。

https://x.com/masaya_dev/status/1971939062237089983

2日目は、kudou さんの座標を見つけて、90分でビール飲み放題の箱に行きました。

その際に marco から直接 Herb の話を聞けたのは良かったです。セッション聞きに行ってなかったんですが、2次会の場で聞けるとは思ってなかったです。

控えめに言っても Herb 最高ですね。なんで Herb 作ろうと思ったのかというと、ActionView のエラーがどこで起きてるか分からないのにイラついたことがきっかけみたいです。

いろんな方とお話しできて楽しかったです。

## まとめ

カンファレンスは学びも出会いもあってとても良い場だなと。

オフラインで参加できて良かったな。セッションも良かったですし、廊下も良かった。自社のブースにも参加していろんな人とお話しできました。

今年は CFP 出したんですが、来年も出そうと思います。また来年も参加したいですね。
