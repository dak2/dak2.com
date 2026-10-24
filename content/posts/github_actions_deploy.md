---
title: "GitHub ActionsでECS自動デプロイのワークフローを構築した"
date: 2023-12-29
description: "デプロイが自動でできるのは楽で嬉しかった"
tags: "AWS, GitHub"
---

## 概要

Cloudformationで社内のインフラを構築した際に、GitHub ActionsでECS自動デプロイのワークフローを構築した際の振り返りを兼ねてまとめる。

## やったこと

GitHubがオフィシャルで出してるECSデプロイのサンプルワークフローをそのまま使った。

https://docs.github.com/en/actions/deployment/deploying-to-your-cloud-provider/deploying-to-amazon-elastic-container-service#prerequisites

1. ECRにログイン
2. イメージビルドしてECRにpush
3. タスク定義を元にECSをデプロイ

環境変数やパスを指定し直すだけだったので本当にすぐできた。

タスク定義のJSONは、`containerDefinitions`配下のものを指定しないとダメなのは注意。

```plaintext
$ aws ecs describe-task-definition --task-definition task-definition-cfn:${number}
```

上記のコマンドでJSONをそのまま出力すると、下記のような構造になり、`taskDefinition`プロパティが邪魔をしてしまう。

```json
{
    "taskDefinition": {
        "taskDefinitionArn": "xxxxx",
        "containerDefinitions": [
            {
                "name": "xxxxx",
                "image": "xxxxx",
                ....
            }
        ]
    }
}
```

なので下記のようにして`taskDefinition`配下のJSONを出力する必要がある。


```plaintext
$ aws ecs describe-task-definition --task-definition task-definition-cfn:${number} | jq '.taskDefinition' > path/task-definition.json
```

## まとめ

GitHubがサンプルテンプレートを出していてありがとうという気持ち。
自動デプロイは本当に楽で良い。
