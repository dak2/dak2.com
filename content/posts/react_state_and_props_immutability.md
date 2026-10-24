---
title: "React基本概念の整理"
date: 2022-07-03
description: "state と props の差分計算のコードなどを見てみた"
tags: "React, JavaScript"
---

## 概要

React18リリースがあった関係でWEB DB PRESS vol.129にReactの深層シリーズが掲載されていたので、改めてReactの思想や設計原則などを見直した。

## Reactの特徴

- 宣言的UI
- コンポーネント志向
- 仮想DOM
- 単方向データフロー

の4つが大まかな特徴と捉えている。

### 宣言的UI

UIとして表示する部品をコンポーネントとしてラップして定義した上で、「この場合はこのdivタグを置いて..」みたいな細かい制御ロジックが書かれる命令的UIではなく、あるべき状態を **宣言** したUIを記述する形式。

命令的UIのように画面描写の変化過程を記述するのではなく、結果のみを記述していく。

### 仮想DOM

WEB+DBPRESSに記載のある「宣言的UIでは **状態(state)** と **UI** が明確に分けられており、ユーザーがアプリケーションを使うということはアプリケーションの状態を操作するということであって、**UIというのは現在の状態をユーザーに知らせるための映写装置である** 」部分が印象に残っている。

つまり、命令的UIで扱っていたロジックを状態管理に持ち込むことで、UIは現在の状態を映写するだけという感じ。

状態が変更されて仮想DOMが生成され、実際のDOMとの差分検出を行い、DOMの更新を行う。jQueryなど実際のDOMをいじるのではなく差分検出してDOM構築して一括更新。

mizhiさんの記事がとても勉強になる。[https://zenn.dev/mizchi/books/0c55c230f5cc754c38b9/viewer/0c36b7de04ca0e4ed766]("https://zenn.dev/mizchi/books/0c55c230f5cc754c38b9/viewer/0c36b7de04ca0e4ed766")

### 単方向データフロー

そして単方向データフロー。
従来のMVCではModelとViewの間に双方向のデータフローが作られる可能性があるので、理解やデバッグが困難。

例えば、Viewが複数Modelのデータ参照/更新を行うことでデータフローが循環する形。これが多くなると複雑度が増す。
そういった背景からFLUXアーキテクチャが登場し、ViewからのイベントがStoreに発行され、Storeが更新されたらViewも更新するという単一のデータフローが構築された。

この記事が参考になる。[https://www.infoq.com/jp/news/2014/05/facebook-mvc-flux/]("https://www.infoq.com/jp/news/2014/05/facebook-mvc-flux/")

## Reactのimmutabilityについて

単方向データフローやコンポーネントのカプセル化なども重要だけど、同じくらい、immutabilityの重要性も重要。

[Reactの公式tutorial]("https://ja.reactjs.org/tutorial/tutorial.html#why-immutability-is-important")にもあるけれど、immutabilityが重要な理由として下記3つ挙げられている。

- 複雑な機能が簡単に実装できる
- React自身がオブジェクトの変更を検知しやすくなる
- コンポーネント再描画のタイミングが決定しやすくなる

このブログ記事が参考になる。
[https://lyohe.github.io/post/2021-03-17-javascript-nanimo-wakaranai/]("https://lyohe.github.io/post/2021-03-17-javascript-nanimo-wakaranai/")

[https://tech.kitchhike.com/entry/react-should-component-update]("https://tech.kitchhike.com/entry/react-should-component-update")

### 内部のロジック

Reactは [shouldComponentUpdate()]("https://ja.reactjs.org/docs/react-component.html#shouldcomponentupdate") という APIを通じてrenderするかを決定している。
その際、コンポーネントに新しいpropsが渡されるもしくは状態(state)が更新されたら呼び出されてbooleanを返す。
trueならばrenderされて、falseならば逆。

内部実装を見てみる。

[https://github.com/facebook/react/blob/v18.2.0/packages/react-devtools-shared/src/node_modules/react-window/src/shouldComponentUpdate.js]("https://github.com/facebook/react/blob/v18.2.0/packages/react-devtools-shared/src/node_modules/react-window/src/shouldComponentUpdate.js")

```javascript
// @flow

import areEqual from './areEqual';
import shallowDiffers from './shallowDiffers';

// Custom shouldComponentUpdate for class components.
// It knows to compare individual style props and ignore the wrapper object.
// See https://reactjs.org/docs/react-component.html#shouldcomponentupdate
export default function shouldComponentUpdate(
  nextProps: Object,
  nextState: Object,
): boolean {
  return (
    !areEqual(this.props, nextProps) || shallowDiffers(this.state, nextState)
  );
}
```

内部的には areEqualもしくはshallowDiffers 関数を呼んでいることがわかる。

areEqual内部でもshallowDiffers関数を呼んでいるので、実質shallowDiffersの中身がstate or propsの変更を検知するロジックになっていそう。
shallowDiffersの中身を見てみる。

[https://github.com/facebook/react/blob/12adaffef7105e2714f82651ea51936c563fe15c/packages/react-devtools-shared/src/node_modules/react-window/src/shallowDiffers.js#L5]("https://github.com/facebook/react/blob/12adaffef7105e2714f82651ea51936c563fe15c/packages/react-devtools-shared/src/node_modules/react-window/src/shallowDiffers.js#L5")

```javascript
// @flow

// Pulled from react-compat
// https://github.com/developit/preact-compat/blob/7c5de00e7c85e2ffd011bf3af02899b63f699d3a/src/index.js#L349
export default function shallowDiffers(prev: Object, next: Object): boolean {
  for (let attribute in prev) {
    if (!(attribute in next)) {
      return true;
    }
  }
  for (let attribute in next) {
    if (prev[attribute] !== next[attribute]) {
      return true;
    }
  }
  return false;
}
```

やっていることはシンプルで

- 1つ目のfor文で変更前と変更後のstate or propsを比較して新しい要素が追加されたのかを確認
- 2つ目のfor文で変更前と変更後のstate or propsで指定されたkeyの値が一致するのかを確認

をやっている。
ここから分かることは、**propsやstateをmutableに変更してしまったら再renderされない可能性がある** ということ。

JSでは、プリミティブではないオブジェクトと配列だけがmutableなので、そういったstateやpropsを更新する時はimmutabilityを担保する必要がある。

[https://developer.mozilla.org/ja/docs/Glossary/Mutable]("https://developer.mozilla.org/ja/docs/Glossary/Mutable")
Object.assign()やスプレッド演算子などを利用してimmutableに更新する。

＊どちらもshallow copyなので1階層しかコピーされないことに注意。ディープコピーを行うには、オブジェクトをJSON.stringify()でJSON文字列化して、それをJSON.parse()でオブジェクトとして復元する方法やloadashなどのライブラリを利用する形になる。

## パフォーマンスチューニングについて

Reactのパフォーマンスはいかに再レンダリングを防ぐかに焦点が置かれている気がする。

あるコンポーネントがレンダリングされると子コンポーネントもレンダリングされるので、コンポーネントの数が多かったりAPIからデータフェッチする関数が多かったりするとかなりコストがかかる処理となる。

この記事がとても参考になる。[https://blog.ojisan.io/react-re-render-history/]("https://blog.ojisan.io/react-re-render-history/")

### shouldComponentUpdate()のオーバーライドとPureComponent

前節で出てきたshouldComponentUpdate()のAPIは再レンダリングを防ぐために利用されていた場合も多かったよう。

クラスコンポーネント時代は、shouldComponentUpdate()を各コンポーネントでオーバーライドしてレンダリングのタイミングを調整することで、不要なレンダリングを防いでいた。

それか、[PureComponent]("https://ja.reactjs.org/docs/react-api.html#reactpurecomponent")を利用して新旧propsとstateを浅く比較して変更がなければレンダリングしないようにするか。

### hooksでのReact.memoとuseMemo useCallback

PureComponentと同じく新旧propsで浅い比較が行われる形。

```tsx
const Component = React.memo((props) => {
  return <div>{props.value}</div>;
});
```

useMemoは変数のメモ化をするhooksAPI。変数を作るコストが高いときに有効。

```tsx
const memo = () =>
  useMemo(() => {
    createVal();
  }, [val]);
```

useCallbackは第二引数の依存配列に渡した要素が更新されたら実行される。

```tsx
const memo = () =>
  useCallback(() => {
    doSomething();
  }, [val]);
```

## まとめ

stateとpropsのimmutableはしっかり意識しようということ。
パフォーマンスチューニングの話はもうちょっと深掘りたい。
