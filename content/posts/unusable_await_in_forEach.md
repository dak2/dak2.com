---
title: "JSのforEach内部でawaitが使えない"
date: 2021-07-10
description: "forEach は async ではないので promise の処理結果を待たずにイテレートする"
tags: "JavaScript"
---

### 概要

- JS forEach内部でawaitが使えなかった際に対処した備忘録

### 詳細

- LambdaからSQSにメッセージ送信する際に、[sendMessage](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#sendMessage-property)関数をforEach内部で実行していた。
  - いざLambdaを動かすと、SQSにメッセージが送信されていなくて困った

### 対処法

- stackoverflowに書いてた
  - [https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop](https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop)
  - 代わりに `for...of` 内でawaitを使うと良いとのこと。

### 理由

- [Mozilla](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#polyfill)に書いてあるが、`forEach does not wait for promises.`
- [qiitaの記事](https://qiita.com/frameair/items/e7645066075666a13063)で forEach の polyfill を解説を見た。forEachはasyncではないのか。
- そのため、promise の処理結果を待たずにイテレートする
- Mozilla に載っている forEach で await が使えないコード例

```javascript
let ratings = [5, 4, 5];
let sum = 0;
let sumFunction = async function (a, b) {
  return a + b;
};

ratings.forEach(async function (rating) {
  sum = await sumFunction(sum, rating);
});

console.log(sum);
// Naively expected output: 14
// Actual output: 0
```
