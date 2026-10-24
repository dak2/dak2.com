---
title: "<書評> type-challengesでeasyからmediumまで81問解いて学んだTSの型プログラミング"
date: 2022-08-04
description: "TypeScript の型パズルをしてみた conditional types が便利"
tags: "TypeScript, Book"
---

## 概要

[type-challenges](https://github.com/type-challenges/type-challenges) というTS文法の練習問題リポジトリがある。

興味本位で解いてみたら楽しくなってきてeasyレベルからmediumレベルまで81問解いてしまった。

その際にTSについての学びが色々あったので共有する。

## 学び一覧

- mapped types
- conditional types
- infer
- minus operator
- union distribution
- never
- template literal types
- length property
- index(numeric) signature
- bottom type

### mapped types

公式doc: [https://www.typescriptlang.org/docs/handbook/2/mapped-types.html](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
型引数が主にユニオン型orオブジェクトの場合に利用することが多い。型引数をイテレーションして結果出力する。

```typescript
type MappedTypes<T extends object> = { [P in keyof T]: T[P] };
type s = MappedTypes<{ key: 'test'; value: 'test' }>;
// type s = {
//   key: 'test';
//   value: 'test';
// }

type MappedTypes2<T extends string> = { [P in T]: string };
type t = MappedTypes2<'test' | 'tt'>;
// type t = {
//   test: string;
//   tt: string;
// }
```

### conditional types

公式doc: [https://www.typescriptlang.org/docs/handbook/2/conditional-types.html](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
型の条件分岐を実現する。

```typescript
TypeA extends TypeB ? true : false
```

公式docによるとこの条件はextendsの左の型が右の型に代入可能かどうかを判定している。

> When the type on the left of the extends is assignable to the one on the right, then you’ll get the type in the first branch (the “true” branch); otherwise you’ll get the type in the latter branch (the “false” branch).

そのためこれはもちろんfalse

```typescript
type test = string extends number ? true : false;
// => false
```

こちらは原則から考えてtrueになる。

```typescript
type test = 't' extends string ? true : false;
// => true
```

bottom typeの節でneverやundefinedをconditional typesで比較検証する。

### infer

[公式doc](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#type-inference-in-conditional-types)
型を割り出してその後利用できる。

conditional typesとセットで利用する。

例えば、type-challengesの[Last of Array](https://github.com/type-challenges/type-challenges/blob/main/questions/00015-medium-last/README.md) の問題では下記のように解ける。

型引数Tをconditional typesで分岐させ、その中でinferを利用して推論した変数L（配列の最後の要素）を利用する。

```typescript
type Last<T extends any[]> = T extends [...infer _, infer L] ? L : never;
type s = Last<[]>;
// => never

type t = Last<[1, 2, 3]>;
// => 3
```

### minus operator

[公式doc](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#improved-control-over-mapped-type-modifiers)
mapped types内のreadonlyや?を削除するための修飾子例えば、type-challengesの[Mutable](https://github.com/type-challenges/type-challenges/blob/main/questions/02793-medium-mutable/README.md) の問題では下記のように解ける。

```typescript
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

type s = Mutable<{ readonly test: 1 }>;
// type s = {
//   test: 1;
// }
```

### union distribution

**conditional types**や**mapped types**にunion型を渡すと1つずつ処理される。

conditional typesでは条件の左部分が型変数である場合にunion型が分配される。

```typescript
type Equal<U> = U extends 1 ? U : never;
type s = Equal<1 | 2>;
// type s = 1
```

例のコードでは型変数Uにunion型が渡っており1だけを返す。つまり下記が行われている。

```typescript
type TypeA = (1 extends 1) ? U : never
type TypeB = (2 extends 1) ? U : never
```

mapped typesでは以下のような形の場合にunion distributionが発生する。

```typescript
{ [P in keyof T]: X}
```

```typescript
type Distribution<T> = { [P in keyof T]: T[P] };
type val = Distribution<{ foo: string } | { bar: number }>;
// type val = Distribution<{
//    foo: string;
// }> | Distribution<{
//    bar: number;
// }>
```

### never

[サバイバルTypeScript](https://typescriptbook.jp/reference/statements/never)より

> TypeScriptのneverは「値を持たない」型。
> 1️⃣特性1: neverへは何も代入できない
> 2️⃣特性2: neverは何にでも代入できる
> 💥常に例外を起こす関数の戻り値に使える

[TypeScript Deep Dive](https://typescript-jp.gitbook.io/deep-dive/type-system/never)より

> プログラミング言語の設計には、bottom型の概念があります。
> それは、データフロー解析を行うと現れるものです。
> TypeScriptはデータフロー解析(😎)を実行するので、決して起こりえないようなものを確実に表現する必要があります。
> never型は、このbottom型を表すためにTypeScriptで使用されます。

[Wikipedia](https://ja.wikipedia.org/wiki/%E3%83%87%E3%83%BC%E3%82%BF%E3%83%95%E3%83%AD%E3%83%BC%E8%A7%A3%E6%9E%90) より

> データフロー解析（英: Data-flow analysis）は、プログラム内の様々な位置で、取りうる値の集合に関する情報を収集する技法である。

制御フローグラフ (CFG)を使って変数の値が伝播するかどうかなどの情報を集め、利用する。

このようにして集められた情報はコンパイラが最適化に利用する。

データフロー解析の基本は到達定義 (reaching definition) である。

### template literal types

JSのテンプレートリテラルを使って展開した値をそのまま型として定義できる。

```typescript
type Join<T extends string, U extends string> = `${T}-${U}`;
type joinedStr = Join<'foo', 'bar'>;
// type joinedStr = "foo-bar"
```

conditional types + inferを利用していこんな風にも書ける。

```typescript
type TemplateLiteral<T extends string> = T extends `${infer F}${infer _L}`
  ? F
  : never;
type str = TemplateLiteral<'foo'>;
// type str = "f"
```

type-challengesで文字列操作するときに初めて知って表現力に驚いたな。

### length property

配列やタプルの要素数をカウントして返す

```typescript
type val = [1, 3]['length'];
// type val = 2
```

Arrayのinterfaceにlengthプロパティが存在する。

```typescript
interface Array<T> {
  /**
   * Gets or sets the length of the array. This is a number one higher than the highest index in the array.
   */
  length: number;
}
```

[https://github.com/microsoft/TypeScript/blob/main/lib/lib.es5.d.ts#L1220-L1402](https://github.com/microsoft/TypeScript/blob/main/lib/lib.es5.d.ts#L1220-L1402)

### index (numeric) signature

配列(orタプル)TにおいてT[number]がunion型で返ることから知った
[公式doc](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) にも記載ある。

[stackoverflow](https://stackoverflow.com/a/59188070) の記事では、Arrayは下記のようなinterfaceになっていて numberを使ってindexをまとめて取得できるよう。

[https://github.com/microsoft/TypeScript/blob/main/lib/lib.es5.d.ts#L388-L392](https://github.com/microsoft/TypeScript/blob/main/lib/lib.es5.d.ts#L388-L392)
かな？

### bottom type

neverは値を持たないということを表す型でありbottom型とも呼ばれる。集合論で表すと空集合。

never型には何も代入できない（値持たないから）が、never型は他の型に代入できる。

他の全ての型のサブタイプ（部分型）となる。

is-aの関係。逆はできない（他の型をnever型に代入）

```typescript
let neverVal: never = 1 as never;
// never 型は bottom type なのでstring型に代入可能

let str: string = neverVal;
```

ちなみにunkhownは全ての型のスーパータイプなのでどんな型でも代入可能

```typescript
let str = 'str';

// unkhown 型は super type なのでstring型を代入可能
let neverVal: unknown = str;
```

[TS型の階層性](https://zenn.dev/estra/articles/typescript-type-set-hierarchy#%E5%9E%8B%E3%81%AE%E9%9A%8E%E5%B1%A4%E6%80%A7) に詳しく説明がある。

## 今後知りたいこと

- type widening
- homomorphic mapped types
- union distributionをキャンセルする
- etc...

## まとめ

[type-challenges](https://github.com/type-challenges/type-challenges) でTSの型プログラミングにどっぷりハマった。

また再帰的に解く問題が多かったので自然と再帰的に考えられたのもとても良かった。

この経験を通じてTSが好きになったのでもっと深掘りたいと思えたのは大きな収穫。
