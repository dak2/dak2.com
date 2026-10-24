---
title: "マルチテナント対応のGemに触れた話"
date: 2023-01-07
description: "Row Level Security という概念を初めて知った"
tags: "Ruby, Ruby on Rails"
---

## 概要

社内の新規アプリケーション開発時にマルチテナント対応をしたいという話になり、Railsでそれを実現するGemを選定して実装した際の振り返り

## 背景

PostgresqlのRLS([Row Level Security](https://www.postgresql.jp/document/9.6/html/ddl-rowsecurity.html))も考慮してテナントごとのデータを安全に扱いたかったため、それを前提にGemを探した

RLSのGemは [https://github.com/suus-io/rls_rails](https://github.com/suus-io/rls_rails) も候補としてあったが、DSLみが強くconfigが複雑になりそうだったので不採用。

色々探した結果、SmartHRさんがRLSのGemを公開したという[記事](https://tech.smarthr.jp/entry/2022/02/15/202241)を読んで、結果的にそのGem ([https://github.com/kufu/activerecord-tenant-level-security](https://github.com/kufu/activerecord-tenant-level-security)) を採用。

採用したGemが [https://github.com/citusdata/activerecord-multi-tenant](https://github.com/citusdata/activerecord-multi-tenant) でのマルチテナント実装を推奨していたため、それを元に進めた。

## 詳細

まず[usage](https://github.com/kufu/activerecord-tenant-level-security#usage)に書かれているようにconfigでテナント分離できる設定を追記。

```ruby
TenantLevelSecurity.current_tenant_id { MultiTenant.current_tenant_id }
```

その後下記手順で動作確認を行なった。

- テスト用のテーブルをマイグレーション（tenant_idをカラムにもたせる）
- テストレコードのINSERT
- Postgresql側でテストテーブルに参照権限を持ったテストユーザーを作成
- テストユーザーでのコネクション確立
- テナント分離動作確認

### 手順1: テスト用のテーブルをマイグレーション

usageに従いpolicyをテーブルに付与（tenant_idのカラムも持たせる）してマイグレーション

```ruby
class CreateEmployee < ActiveRecord::Migration[6.0]
  def change
    create_table :employees do |t|
      t.integer :tenant_id
      t.string :name
    end
    create_policy :employees
  end
end
```

DB側でもpolicyが付与されていることを確認

```plaintext
development=# d employees
                  Table "public.employees"
  Column   |         Type          | Collation | Nullable |               Default
-----------+-------------------+-----------+----------+---------------------------------------
  id       | bigint           |           | not null | nextval('employees_id_seq'::regclass)
  tenant_id | integer         |           |          |
  name      | character varying |           |          |
Indexes:
  "employees_pkey" PRIMARY KEY, btree (id)
Policies (forced row security enabled):
  POLICY "tenant_policy"
    USING (((tenant_id)::text = current_setting('tenant_level_security.tenant_id'::text)))
    WITH CHECK (((tenantid)::text = currentsetting('tenant_level_security.tenant_id'::text)))
```

### 手順2: テストレコードのINSERT

```ruby
2.times do |i|
  Employee.create(tenant_id: i+1, name: "e#{i+1}")
end;nil
```

この段階ではテナント分離されておらず全レコード取得できる

```plaintext
irb(main):003:0> Employee.all
  (0.2ms) SET tenant_level_security.tenant_id TO DEFAULT
  Employee Load (0.6ms)  SELECT "employees".* FROM "employees"
=> [#<Employee:0x0000ffffb2ef9770 id: 1, tenant_id: 1, name: "e1">, #<Employee:0x0000ffffb2c8acf0 id: 2, tenant_id: 2, name: "e2">]
```

### 手順3: Postgresql側でテストテーブルに参照権限を持ったテストユーザーを作成

テストユーザーにはSELECTだけ付与

```plaintext
$ CREATE USER user WITH PASSWORD 'password';
$ c development;
$ GRANT SELECT ON employees To user;
```

### 手順4: テストユーザーでのコネクション確立

ActiveRecordの[establish_connection](https://api.rubyonrails.org/classes/ActiveRecord/ConnectionHandling.html#method-i-establish_connection)を利用してテストユーザーでコネクション確立

```plaintext
irb(main):017:1* app_user_config = {
irb(main):018:1*   adapter: "postgresql",
irb(main):019:1*   encoding: "UTF8",
irb(main):020:1*   database: "development",
irb(main):021:1*   username: "user",
irb(main):022:1*   password: "password",
irb(main):023:1*   host: "db",
irb(main):024:1*   port: 5432,
irb(main):025:0> }
=> {:adapter=>"postgresql", :encoding=>"UTF8", :database=>"development", :username=>"user", :password=>"password", :host=>"db", :port=>5432}
irb(main):026:0> ActiveRecord::Base.establish_connection(app_user_config)
```

### 手順5: テナント分離動作確認

tenant_idが1のレコードのみ返却される

```plaintext
irb(main):016:1* TenantLevelSecurity.with(1) do
irb(main):017:1*   Employee.pluck(:name)
irb(main):018:0> end
  (0.9ms) SHOW tenant_level_security.tenant_id
  (0.5ms) SET tenant_level_security.tenant_id TO DEFAULT
=> ["e1"]
```

これだけではまだ使い物にならないので、実装時に裏側でコネクション確立するような実装や明示的にコネクション抜ける方法も考えないといけない。

## まとめ

RLSという単語を初めて知ったので新しい知見を得られた。Gemの選定も運用を考えた現実的なラインで判断できたので良い経験になった。
