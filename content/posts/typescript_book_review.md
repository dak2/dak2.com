---
title: "<書評> プロを目指す人のためのTypeScript入門 安全なコードの書き方から高度な型の使い方まで"
date: 2022-04-29
description: "TypeScript を雰囲気で触っていたので書籍を読んだ"
tags: "TypeScript, Book"
---

## 要約

TSの基礎的な内容が割と網羅されている印象。
抜けていた基礎知識を補えたのが良かった。

## 1章

TSバージョンの年表が面白かった印象。
TS 4.1から応用性の高いtemplate literal typesが導入されてお祭り騒ぎになったらしい。元[PR]("https://github.com/microsoft/TypeScript/pull/40336")はこちら。
template literal typesってinferと組み合わせると有用だなと思ったり。

あとはenum使わない方が良いみたいなのは知らなかった。JSには存在しない独自機能だからとのこと。

[LINE社の記事]("https://engineering.linecorp.com/ja/blog/typescript-enum-tree-shaking/")を見ると、
JSに存在しないenumを表現するためにIIFE(即時実行関数)を含んだコードをトランスパイルするらしい。それがバンドルされてしまうからtree-shakingできなくなるよとのこと。なるほど。

## 2章

値がない状況を表すのにundefinedの方が推奨されるとのこと。

[MicrosoftのTSコーディング規約]("https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines#null-and-undefined")にも **Use undefined. Do not use null.
**の記載がある。

[サバイバルTypeScript]("https://typescriptbook.jp/reference/values-types-variables/undefined-vs-null")にはこのような記述がある

- undefinedは「値が代入されていないため、値がない」nullは「代入すべき値が存在しないため、値がない」
- nullは自然発生しない
- undefinedは変数
- undefinedはtypeofの結果がプリミティブ名を表す\"undefined\"になるのに対し、nullは\"null\"ではなく\"object\"になります。

最後のは割とびっくりする挙動。言語仕様的にundefinedが自然発生してくれるのでそれに合わせにいくのが良さそう。

ただ外部APIとのやり取りでnullが渡ってくるのはあると思うので、そこの考慮が必要そう。

[Null 合体演算子 (??)]("https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_operator") と [論理 OR 演算子 (||)]("https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Logical_OR") の違いを知った。 **||** はnullやundefinedだけでなく空文字や0、falseなども \"ない\"と評価して右辺値を返すが、**??** はnull orundefinedの場合のみ右辺値を返す。


ES2021の新機能として [||=(論理和代入)]("https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Logical_OR_assignment")[ \*\*\*\*]("https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Logical_OR_assignment")や[**&&=**]("https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Logical_AND_assignment")[(論理積代入)]("https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Logical_AND_assignment")演算子もある。

論理和代入はrubyの自己代入演算子と同じ。論理積代入は左辺がtruthyなものの場合に右辺の値を左辺に代入。

## 3章

### スプレッド構文とシャローコピー

スプレッド構文はシャローコピーであること。
下記よりスプレッド構文でコピーしてもネストしたオブジェクトは同じアドレスを共有している。

```typescript
const object = { name: 'test', type: { a: 'a' } };
const anotherObject = { ...object };
object.name = 'object';
anotherObject.type.a = 'b';

console.log('object', object);
// object { name: 'object', type: {a: 'b'} }
console.log('anotherObject', anotherObject);
// anotherObject { name: 'test', type: {a: 'b'} }
```

[ディープコピーをする方法]("https://developer.mozilla.org/ja/docs/Glossary/Deep_copy")の1つとして、**JSON.stringify()** でオブジェクトを JSON 文字列に変換し、
**JSON.parse()** で文字列から（完全に新しい） Javascript のオブジェクトに変換する方法がある。
また、ネストしたオブジェクトもスプレッド構文で展開する等々。

### インデックスシグネチャについて

[インデックスシグネチャ]("https://typescript-jp.gitbook.io/deep-dive/type-system/index-signatures")は型安全性を破壊する。
オブジェクトのkeyがstringの場合、obj.key でアクセスできるが、obj.foo /
obj.aなど任意のkeyにもアクセスできてコンパイルエラーにならないので型安全ではない。

```typescript
type Obj = { [key: string]: number };
const obj: Obj = { foo: 1 };

console.log(obj.t);
// => コンパイルエラーにならない
```

### 部分型関係について

型Sが型Tの部分型であるとは、S型の値がT型の値でもあることを指す。
下記の例ではFooBarBaz がFooBar
の部分型である。
FooBarBazはFooBarの要素を全て持つ。FooBarBaz型であればFooBar型でもあるということ。

```typescript
type FooBar = { foo: string; bar: number };
type FooBarBaz = { foo: string; bar: number; baz: boolean };
const obj: FooBarBaz = { foo: 'hi', bar: 1, baz: false };

console.log('obj', obj);
// "obj",{"foo":"hi","bar":1,"baz":false}

const obj2: FooBar = obj;
console.log('obj2', obj2);
// "obj2",{"foo":"hi","bar":1,"baz":false}
```

### タプル型

要素数が固定された配列型。
要素数が固定されている代わりに、それぞれの要素に異なる型を与えられる。

### オブジェクトの分割代入（destructuring assignment）について

型注釈つけられないで型推論していく

### プリミティブのプロパティ

文字列や数値などのプリミティブ型は、プロパティを持ったオブジェクトとして扱える。

プリミティブ型をまるでobjectのように扱えるのはJSの特徴。JSには、プリミティブ型をオブジェクトに自動変換するオートボクシングと呼ばれる機能がある。参考:
https://typescriptbook.jp/reference/values-types-variables/primitive-types

```typescript
'name'.length; // 4
```

## 4章

### contextual typing

逆方向の方推論のことで、型が事前に分かっている場合の推論。
通常の型推論は型注釈は無いけれど値から型を推論できる場合に発動

```typescript
const xRepeat = (arg: number): string => 'x'.repeat(arg);
// xRepeatの型が自動的にconst xRepeat: (arg: number) => string と判定される
```

逆方向の型推論は型を事前に割り当てているから式中の型を省略できる。

```typescript
type F = (arg: number) => string;
const xRepeat: F = (arg) => 'x'.repeat(arg);
// (arg: number): string の指定は不要
```

コールバック関数なども指揮中で引数の型を書かない場合が多い。
例えばfilterなどはレシーバを元に型引数が決まる。

```typescript
const nums = [1, 2, 3];
const ary = nums.filter((x) => x > 2);
// 式中xの変数をnumberとしなくても x>2 でコンパイルエラーが起きない
// (value: number) => unkhown
```

## 5章

protectedはクラス自身だけでなく子クラスからもアクセス可能。rubyと同じだな。

### プライベートプロパティについて

\#プロパティ名 と private修飾子をつけたもの両方で表現可能。

- privateはTS独自機能なのでトランスパイル後のランタイム上では普通のプロパティとして扱う。
- \#プロパティ名はJSの機能なのでランタイム上でもプライベート性が担保される

### this

thisはプロパティを参照することが多く、そのプロパティがundefinedであった場合にランタイムエラーが発生する可能性あり。

- アロー関数は外側のthisを引き継ぐ
- 普通の関数は呼び出し時のレシーバをthisとする

アロー関数への書き換えをするリファクタリングを業務で行ったなあ。

## 6章

### インターセクション型

T型でありかつU型でもある値を意味する型
参考: https://typescriptbook.jp/reference/values-types-variables/intersection
ちなみに string
& numberのプリミティブのインターセクション型は存在しないのでnever返る

### [Optional chaining]("https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Optional_chaining")

レシーバに対する参照が nullish (null または undefined) の場合にエラーとなるのではなく、式が短絡され undefined
が返される。
?.はそれ以降のプロパティアクセス・関数呼び出し・メソッド呼び出しをまとめて飛ばす効果を持つ。

```typescript
const adventurer = { name: 'Alice', cat: { name: 'Dinah' } };
const dogName = adventurer.dog?.name.t;
console.log(dogName);
// expected output: undefined
// dogが存在しないのでそれ以降の .name.t は評価されずにundefinedが返る
```

### リテラル型のwidening

リテラルが自動的に対応するプリミティブ型に変化する（広げられる）特徴。

constの場合はリテラル型なのにletの場合はプリミティブ型に変化している。

letは再代入が期待されるのでプリミティブ型に変化する。

ちなみにconstで宣言したオブジェクトリテラルも再代入可能なのでwideningされる。

```typescript
const test1 = 'test';
// const test1: "test"

let test2 = 'test';
// let test2: string

const test = { a: 'a', b: 1 };
// const test: { a: string; b: number; }
```

wideningを防ぎたい場合は、リテラル型を含む型注釈をつけるか as constを利用して宣言する。

### ユニオン型

型の絞り込みに対応している点が素晴らしいとのこと。なるほど、そういう解釈ができるのか。

関数の引数をユニオン型で取って、式中で型の分岐を行つつ処理をしていけるということに価値があるのか。

### lookup型

**T[K]** のようにオブジェクトプロパティにアクセスする際の型

### as const

asを使った型アサーションは型安全性を破壊しかねないけれど、as constはそれとは異なる。

1.  配列リテラルの型推論結果を配列型ではなくタプル型にする
2.  オブジェクトリテラルから推論されるオブジェクト型は全てreadonlyになる（配列リテラルも）
3.  プリミティブのリテラル型がwideningしない
4.  テンプレート文字列リテラルの方がstringではなくテンプレートリテラル型になる

```typescript
// readonly
const names = ['taro', 'jiro'] as const;
// const names: readonly ["taro", "jiro"]

const obj = { name: 'test', address: { city: 'xxxx' } } as const;
// const obj: {
//  readonly name: "test";
//  readonly address: {
//    readonly city: "xxxx";
//  };
// }
// wideningされない

const name1 = 'name' as const;
let name2 = name1;
let name2: 'name';
// let name2: "name"

let name3 = 'name3';
// let name3: string
// templateliteral type

const n: number = 1;
const value = `${n}px` as const;
// const value: `${number}px`
```

### any型とunkhown型

- any型
  - 型チェックを無効化する型。基本的に何でも代入可能なのでコンパイルエラーにならない。
  - JSからTSへの移行を支援するためや、型をうまく表現できないためのエスケープハッチとしての存在理由あり
  - anyよりasやユーザー定義型ガードの利用を検討した方が良い
- unkhown型
  - なんでも入れられる型。何かは入っているが何かは分からないような状況を表す
  - anyはコンパイルエラーにならないので、val.nameなどにアクセスできるがunkhownはできない。TSコンパイラがunkhownは値がないことを読み取ってできることを制限してくれる。

### **never型**

値を持たないことを表す型
never型には何も代入できない。（never型にnever型は代入可能）

他の型にnever型は代入できる。そのため、[TSではbottom型と呼ばれている]("https://typescript-jp.gitbook.io/deep-dive/type-system/never")。（[取りうる値の集合が一番大きい]("https://ja.wikipedia.org/wiki/%E3%83%9C%E3%83%88%E3%83%A0%E5%9E%8B#:~:text=%E3%83%9C%E3%83%88%E3%83%A0%E5%9E%8B%EF%BC%88%E3%83%9C%E3%83%88%E3%83%A0%E3%81%8C%E3%81%9F,%E3%81%84%E3%81%8B%E3%81%AA%E3%82%8B%E5%80%A4%E3%82%82%E8%BF%94%E3%81%95%E3%81%AA%E3%81%84%E3%80%82") => ボトム型は全ての型の部分型）

#### [voidとneverの違い]("https://typescriptbook.jp/reference/statements/never")

- voidはundefinedを代入できるがneverはできない（値を持たないから）
- どちらも戻り値がないことは同じ
  - voidは関数がreturnされるか、最後まで実行されることを表す
  - neverは中断されるか永遠に実行される

### **ユーザー定義型ガード**

型の絞り込みの一種
**引数名 is 型名** という形で引数を型名で絞り込んで処理する。
下記の関数は戻り値がbooleanであり、trueならば引数がstring or
numberであるということを意味する。

```typescript
function isStringOrNumber(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}

function useUnknown(v: unknown) {
  // v はここでは unknown 型
  if (isStringOrNumber(v)) {
    // v はここでは string | number 型
    console.log(v.toString());
  }
}
```

参考: [https://blog.uhy.ooo/entry/2021-04-09/typescript-is-any-as/]("https://blog.uhy.ooo/entry/2021-04-09/typescript-is-any-as/")
**asserts 引数名 is 型名** という型述語もある。
この場合は戻り値がvoidで「関数が無事に終了すれば引数名は型名である」

### **union distribution**

conditional typesの性質
conditinal typesを利用している型にユニオン型を渡すと分配して処理してくれる
[公式]("https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types") のやつコピペしただけだけどこんな感じになる。

```typescript
type ToArray<Type> = Type extends any ? Type[] : never;

type StrArrOrNumArr = ToArray<string | number>;
//  ToArray<string> | ToArray<number>; と等しいので、string[] | numbe[]が返る
```

## 7章

### commonJS

[nodejsで利用されているソースコードをパッケージ化するモジュール。]("https://nodejs.org/docs/latest/api/modules.html")
最近はECMAScriptのESmodule形式も採用しているよう。
requireを利用してimportする。

```typescript
const circle = require('./circle.js');
console.log(`The area of a circle of radius 4 is ${circle.area(4)}`);
```

## 今後

(本書付録2の更なる学習の道しるべコピペしただけ)

### JS言語機能

- イテレータ・ジェネレータ
- メタプロ系
  - オブジェクトの操作（Object.keys）など
  - プロパティディスクリプタ・プロパティ属性
  - Reflect・Proxy
- シンボル
- prototype

### TSの言語機能

- 標準ライブラリに属する他の型（Record・Parameters・Awaitedなど）
- abstractクラス・abstract new シグネチャ
- 型レベルプログラミング
- mapped types conditionaltypes
  - infer / union distribution / homomophic typesなど
