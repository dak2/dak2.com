---
title: "Delegated typesを利用した際の知見"
date: 2022-12-25
description: "Delegated types で STI を回避しつつも透過的にサブクラスを扱えるようにした"
tags: "Ruby, Ruby on Rails"
---

## 概要

CTIで設計したテーブルをアプリケーションに落とし込むために[Delegated types](https://api.rubyonrails.org/classes/ActiveRecord/DelegatedType.html)を利用したのでその振り返り

## 背景

- サブクラスごとに異なるカラムを使う前提があった
- 今後の拡張時に既存処理の影響を与えずにロジックを記述できるようにしたかった
- そのため、STIよりかはCTI（MTI）的にサブクラスごとにテーブルを分けてその状態を実現したかった
- STIのような共通インターフェースでサブクラスにアクセスしたかった

要は、サブクラスごとにテーブルを分けたいけれど、STIのように共通インターフェースでサブクラスにアクセスしたかった。

最初は[https://max.engineer/mti#multiple-table-inheritance-simulated](https://max.engineer/mti#multiple-table-inheritance-simulated)などを見て、メタプロで実現しようと考えていた。

ただ、納期が迫っていたのでメタプロでやり切れるのか不明瞭だったのと、今後の保守性 / 拡張性まで考えると懸念があった。

調査した結果、[https://stackoverflow.com/a/63273663](https://stackoverflow.com/a/63273663) でどうやらMTIがRails6.1.0からネイティブサポートされたという情報を見つけた。それが[Delegated types](https://api.rubyonrails.org/classes/ActiveRecord/DelegatedType.html)。

メタプロよりネイティブサポートされた機能を使う方がベターだと考え、これを使って実装をしていこうと決断。（そのためにRailsのバージョンまで上げた）

## 詳細

[Delegated types](https://api.rubyonrails.org/classes/ActiveRecord/DelegatedType.html)は委譲（Delegate）を使って、スーパークラスから具象サブクラスへアクセスできるようにしている。

クラス設計は下記のようになる。

まず、スーパークラスとしてEntryが存在しており、具象サブクラスとして`Message` / `Comment`が存在している。

スーパークラスには`delegated_type`の宣言をしており、サブクラスには`Entryable`モジュールをincludeしている。

```ruby
# Schema: entries[ id, account_id, creator_id, created_at, updated_at, entryable_type, entryable_id ]
class Entry < ApplicationRecord
  belongs_to :account
  belongs_to :creator
  delegated_type :entryable, types: %w[ Message Comment ]
end

module Entryable
  extend ActiveSupport::Concern
  included do
  has_one :entry, as: :entryable, touch: true
  end
end
```

```ruby
# Schema: messages[ id, subject, body ]
class Message < ApplicationRecord
  include Entryable
end

# Schema: comments[ id, content ]
class Comment < ApplicationRecord
  include Entryable
end
```

スーパークラスの`entryable_id`に具象サブクラスのプライマリID、`entryable_type`にサブクラスのtypeが格納される。

スーパークラス側の`delegated_type`メソッドの`types`オプションで許可するtypeを定義できる。

上記例では、`Message`と`Comment`typeのみ許可することになっている。

この時、スーパークラスとサブクラスのレコードは下記のようになっている。

```plaintext
[1] pry(main)> Entry.first
=> #<Entry:0x0000ffff7c3996b8
    id: 1,
    account_id: 1,
    creator_id: 1,
    entryable_id: 1,
    entryable_type: "Comment"
    created_at: Wed, 26 Oct 2022 07:04:34 UTC +00:00,
    updated_at: Mon, 28 Nov 2022 05:42:32 UTC +00:00,
    >
    [1] pry(main)> Comment.first
=> #<Comment:0x0000ffff7c3996b8
    id: 1,
    content: "content"
    >
```

これにより、下記のようにスーパークラスから`entryable`インターフェースを経由して具象サブクラスにアクセスできる。（ifによるtype分岐などは必要としない。尋ねるな命じよ(Tell, Don't Ask!)）

```ruby
Entry.first.entryable
# => Comment.first

Entry.first.entryable.id
# => Comment.first.id

Entry.first.entryable.content
# => Comment.first.content
```

## まとめ

[Delegated types](https://api.rubyonrails.org/classes/ActiveRecord/DelegatedType.html) を選定することで新たな知見を得られたのが良かった。

STIとCTIの違いを抑えられただけでなく、Railsのアップグレード（[こちら](/posts/upgrade_rails)の記事）についても知見を得られたのもGood。
