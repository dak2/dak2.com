---
title: "InnoDBのギャップロックとネクストキーロックについておさらい"
date: 2023-09-18
description: "ギャップロックとネクストキーロックについてまとめ直した"
tags: "Database, MySQL"
---

## 概要
失敗から学ぶRDBの正しい歩き方を再度読み直したら、MySQLのギャップロックとネクストキーロックの理解が曖昧になっていたので、復習がてらまとめてみた


## ギャップロック
ギャップロックとは

> ギャップロックは、インデックスレコード間のギャップのロック、または最初のインデックスレコードの前または最後のインデックスレコードの後のギャップのロックです。 たとえば、SELECT c1 FROM t WHERE c1 BETWEEN 10 and 20 FOR UPDATE;では、範囲内の既存のすべての値間のギャップがロックされているため、カラムにそのような値がすでに存在するかどうかにかかわらず、他のトランザクションが 15 の値をカラム t.c1 に挿入できなくなります。

https://dev.mysql.com/doc/refman/8.0/ja/innodb-locking.html#innodb-gap-locks


存在しない単一レコードの取得や削除、範囲指定でレコード取得などを行う場合に発生する。

### 具体例
下記のようなテーブルを考える。

```plaintext
mysql> desc test;
+-------+--------------+------+-----+---------+----------------+
| Field | Type         | Null | Key | Default | Extra          |
+-------+--------------+------+-----+---------+----------------+
| id    | int          | NO   | PRI | NULL    | auto_increment |
| value | varchar(256) | NO   |     | NULL    |                |
+-------+--------------+------+-----+---------+----------------+
2 rows in set (0.01 sec)

mysql> select * from test;
+----+-------+
| id | value |
+----+-------+
|  1 | foo   |
|  5 | test  |
|  6 | test  |
|  8 | baz   |
|  9 | baz   |
+----+-------+
```

#### 存在しない単一レコードの取得/削除

トランザクションAで存在しないレコードを取得(空振り)すると、id=2..4にギャップロックが発生する。

id=3を中心にして、存在するレコードのid=1,5の間は全てギャップロックされる。

削除の場合も同じ事象。

##### トランザクションA

```plaintext
mysql> begin;
Query OK, 0 rows affected (0.00 sec)

mysql> select test from a where id = 3 for update;
Empty set (0.00 sec)
```

##### トランザクションB

```plaintext
mysql> begin;
Query OK, 0 rows affected (0.00 sec)

# トランザクションAのギャップロックによって待機が発生
mysql> insert into test values (2,"test");
mysql> insert into test values (3,"test");
mysql> insert into test values (4,"test");
```

#### 範囲指定でレコード取得

範囲指定でレコードを取得した場合、存在しないレコード列までギャップロックするので、先ほどと同じようにINSERTするとロック待ちが発生。

トランザクションAでid=5..9を範囲指定して取得すると、id=6,7もギャップロックされる。

そのため、トランザクションBでロック待ちが発生する。

また、ギャップロックは競合しないのでレコード取得は可能。

##### トランザクションA

```plaintext
mysql> begin;
Query OK, 0 rows affected (0.00 sec)

mysql> select * from test where id between 5 and 9 for update;
+----+-------+
| id | value |
+----+-------+
|  5 | bar   |
|  8 | baz   |
|  9 | baz   |
+----+-------+
3 rows in set (0.00 sec)
```

##### トランザクションB

```plaintext
mysql> begin;
Query OK, 0 rows affected (0.00 sec)

# トランザクションAのギャップロックによって待機が発生
mysql> insert into test values (6,"test");

# ギャップロックは競合しないので取得は可能
select * from a where id = 6 for update;
```

### ネクストキーロック

ネクストキーロック = レコードロック + ギャップロック

> インデックスレコードのレコードロックと、インデックスレコードの前のギャップのギャップロックの組み合わせです。

https://dev.mysql.com/doc/refman/8.0/ja/innodb-locking.html#innodb-next-key-locks

ギャップロックでロックした後、次の実レコードが存在する行をレコードロックしたものがネクストキーロックになる。

```plaintext
mysql> begin;
Query OK, 0 rows affected (0.00 sec)

mysql> select * from test where id < 4 for update;
+----+-------+
| id | value |
+----+-------+
|  1 | foo   |
+----+-------+
1 row in set (0.00 sec)
```

```plaintext
mysql> begin;
Query OK, 0 rows affected (0.00 sec)

# id=1はレコードロックがかかっているのでロック待ち
mysql>　select * from test where id = 2 for update;

# id=2 はギャップなのでギャップロックがかかるが、ギャップロックは競合しないので取得可能
mysql> select * from test where id = 2 for update;
Empty set (0.00 sec)

# id=3はギャップロックがかかっているのでロック待ち
mysql> insert into test values (3,"test");

# id=5はid=2-4の次に存在するレコードなので、ネクストキーロックがかかっているのでロック待ち
mysql>　select * from test where id = 5 for update;

# id=6は今回ロックされたギャップではないのでinsert可能
mysql> insert into test values (6,"test");
Query OK, 1 row affected (0.00 sec)
```

## ロックの存在理由
ファントムリード(他のトランザクションで挿入してコミットしたレコードを読み込めてしまう)の発生を防ぐため。

InnoDBのデフォルトのトランザクション分離レベルは、`REPEATABLE-READ`なのでそれが発生しないようにするためのロック。

`READ COMMITTED`場合は、ギャップロックを無効にできる。

https://dev.mysql.com/doc/refman/8.0/ja/innodb-locking.html#innodb-gap-locks


## 所感

Railsアプリケーションでギャップロックを発生させるようなコードを書いて、指摘をもらったことを思い出した。

不要なレコードを定期的に削除して3ヶ月分だけ残すためのworkerを実装していて、下記のようなクエリを書いていた。

```ruby
Model.where(created_at: ..Time.zone.now.ago(3.month)).limit(1000).delete_all
```

これがslow queryになっていたので、id直指定で取ってきてdelete_allするように修正した。

これにより存在するレコードだけを取得してギャップロックを発生させないようにしたのを思い出した。

```ruby
ids = Model.where(created_at: ..Time.zone.now.ago(3.month)).limit(1000)
return if ids.blank?
Model.where(id: ids).delete_all
```
