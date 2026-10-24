---
title: "STIとポリモーフィック関連の整理"
date: 2022-12-11
description: "ポリモーフィック関連によって異なるクラスから一つのクラスを参照できる"
tags: "Ruby"
---

## 概要

STIとポリモーフィック関連の理解が混同していたので改めて整理した記事。

## STIとは

1つのテーブルを継承して複数のモデルを表現する形式。

### 具体例

carsテーブルとtrainsテーブルがvehiclesテーブルを継承すると仮定する。

クラス間の関係性は下図のようになる。

![STI Models](./images/sti_models.png)

STIはテーブル一つで表現するため、DBに存在するテーブルはvehiclesテーブルのみ。

![STI Table](./images/sti_table.png)

vehiclesテーブルのtypeカラムを使って、trains or carsの判別をする。

### メリット

- テーブルが増えない
- Railsの場合だと[STIをサポートしている](https://api.rubyonrails.org/classes/ActiveRecord/Inheritance.html)ので実装容易性がある
- サブクラスのレコードを取得するためにJOINする必要が無い

### デメリット

- カラム数が多くなる
- 別のサブクラスで利用しなければnull値が増える
- 特定のサブクラスのみを参照すべき他テーブルの外部キー制約が、誤ったサブクラスを参照することを防げない

### 参考

[https://qiita.com/yebihara/items/9ecb838893ad99be0561](https://qiita.com/yebihara/items/9ecb838893ad99be0561)

## ポリモーフィック関連とは

複数のモデルから同じモデルを参照する際の関連付けの仕組み。

多態性という言葉より複数のモデルに対して共通のインターフェースを設けられる。

[https://guides.rubyonrails.org/association_basics.html#polymorphic-associations](https://guides.rubyonrails.org/association_basics.html#polymorphic-associations)

### 具体例

ProductモデルとEmployeeモデルはPictureモデルを参照すると仮定（railsガイドそのまま）

```ruby
class Picture < ApplicationRecord
  belongs_to :imageable, polymorphic: true
end

class Employee < ApplicationRecord
  has_many :pictures, as: :imageable
end

class Product < ApplicationRecord
  has_many :pictures, as: :imageable
end
```

picturesテーブルには参照元の親テーブルを表すカラム（`imageable_id` / `imageable_type`）を持たせる。

```ruby
class CreatePictures < ActiveRecord::Migration[7.0]
  def change
    create_table :pictures do |t|
      t.string  :name
      t.bigint  :imageable_id
      t.string  :imageable_type
      t.timestamps
    end
    add_index :pictures, [:imageable_type, :imageable_id]
  end
end
```

`@picture.imageable`を介して親テーブルにアクセスできる。

`@picture`がどの親に紐づいているかどうかの分岐が必要ない。（typeによる分岐等）

### メリット

- DRYに書ける
  - 中間テーブルを省いて相互に関連付けが可能
  - 共通インターフェースで関連付けが可能

### デメリット

- 外部キーを貼れないので参照整合性制約が担保されない

## まとめ

ポリモーフィックとSTIの言語の意味を考えると自然とどちらか分かる。

言語の意味をしっかり抑えようと思った。
