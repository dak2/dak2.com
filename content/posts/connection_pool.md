---
title: "DBコネクションプールサイズについて"
date: 2023-09-24
description: "「pumaのスレッド数 = DBのコネクションプール数」だと大体良さそう"
tags: "Ruby on Rails, Database"
---

## 概要

仕事でDBコネクションプールの適切な数について調査したのでそれの振り返り

## 事象

稼働しているアプリケーションで下記のエラーが発生してしまった。

```plaintext
could not obtain a connection from the pool within 5.000 seconds (waited 5.002 seconds); all pooled connections were in use (ActiveRecord::ConnectionTimeoutError)
```

重いクエリが発行されてコネクションを占有してしまっており、それがコネクションの最大値だったので他のスレッドでコネクションを獲得しようとして、該当エラーが生じてしまった。

## 原因

`pumaのスレッド数 > DBのコネクションプール数` となっていたこと。

明らかにDBのコネクションプールサイズが足りていなかった。

## 最適なコネクションの数について

pumaを利用している場合には、`pumaのスレッド数 = DBのコネクションプール数`であれば良い。

### refs

- https://devcenter.heroku.com/articles/concurrency-and-database-connections
- https://dev.icare.jpn.com/dev_cat/how-do-you-determine-the-number-of-threads-and-connection-pools-for-puma-and-sidekiq-in-rails

ただ、sidekiqのconcurrencyを設定している場合は、DBのコネクションプール数は気をつけた方が良さそう。
Railsのinitializerの中でARを使っていた場合、コネクションが貼られてしまうので `sidekiqのconcurrency = DBのコネクションプール数`だとエラーになるケースもあるとのこと。

ref. https://repl.info/archives/659/
