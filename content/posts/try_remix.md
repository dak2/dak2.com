---
title: "Remix触ってみた"
date: 2022-08-13
description: "Nested Routes の体験がかなり良さそう"
tags: "React, Remix"
---

## 概要

ReactベースのフルスタックフレームワークのRemixが前から気になっており、公式のチュートリアルを触ってみた感想やその思想を深ぼっていく。

## Remixの思想

[Remix公式](https://remix.run/docs/en/v1/pages/philosophy#philosophy)によるとこのFWは4つの思想をベースとしている。

- サーバー/クライアントモデルを利用（データとコンテンツの分離）
- ブラウザやHTMLなどの基礎技術と協調してく
- JavaScriptを使用してブラウザの動作をエミュレートすることでUX向上
- 基盤技術を過度に抽象化しないこと

[zennで他の方が書かれている](https://zenn.dev/kaa_a_zu/articles/fbd06ca2cc3b86#0.-%E3%81%AF%E3%81%98%E3%82%81%E3%81%AB%E3%80%81remix%E3%81%AE%E6%80%9D%E6%83%B3)ように「サーバー/クライアントモデルを利用」に対する説明が他の3つに比べて厚く書かれている印象を受けた。

### 公式doc

[公式doc](https://remix.run/docs/en/v1/pages/philosophy#serverclient-model)の記載によると下記の記載がある。

> With today's web infrastructure you don't need static files to make your server fast. We leveraged distributed systems at the edge instead of static builds. We can fix a typo and the site reflects it within seconds: no rebuilds, no redeploys, not even HTTP caching.

サーバーを早くするために静的ファイルは必要ない。

静的ビルドの代わりにエッジを使って分散システムを構築した。

タイポ修正しても再ビルドや再デプロイ、HTTPキャッシュいらずで数秒のうちにサイトに反映される。とのこと。

つまりSSGの機能は持っておらず、毎度SSRしてコンテンツを返している。

エッジを使った分散システムによりSSRを高速に返すことを実現している。

[Remix公式ブログ](https://remix.run/blog/remix-and-the-edge)に詳細に記載があり、以前のエッジは静的コンテンツの配信だけだったが、最近はDeno deployやCloudflare Workersなど動的コンテンツも返せるようになっている。

Remixはそのエッジコンピューティング技術を利用して任意の場所で高速でコンテンツを返せるようにしているよう。

## QuickStartを触ってみる

Remix公式で紹介されている[QuickStart](https://remix.run/docs/en/v1/tutorials/blog#quickstart)を触ってみる。

[Gitpod](https://www.gitpod.io/)で動作環境を構築したのでローカルで作らなくて済んだ。

便利すぎる。Gitpodは後日記事にしたい。触ってみて分かったことを色々とまとめる。

- routesディレクトリ配下のファイルがroutingになる
- [API routes](https://remix.run/docs/en/v1/guides/api-routes)を作成可能
- Dynamic routes
- ErrorBoundary
- Nested Routes

特に印象深かったのが下記3点

1. API routes
2. Nested Routes
3. ErrorBoundary

### API routes

`.t(j)sx`ファイルでDBからの値取得やfetchなどを行って値を取ってこれる。
特にDBと直接連携して値を簡単に取得できるのは驚いた。
ORMはprismaだった。（prismaをしっかり使ってみたい欲が湧いた。）

### Nested Routes

[Remix公式](https://remix.run/docs/en/v1/guides/routing#what-is-nested-routing)の説明だと、URLのセグメントをUIのコンポーネント階層に一致させる考え方。

下記のgif分かりやすい。

![Nested Routing](./images/nested_routing.gif)

つまりURLのセグメントとコンポーネントが対応しておりそれを1ページで表している形

下記のディレクトリ階層で言うと、`app/root.jsx`をトップとしてその中にroutesディレクトリ配下のコンポーネントがそれぞれ表示されている。

```plaintext
app
├── root.jsx
└── routes
    ├── accounts.jsx
    ├── dashboard.jsx
    ├── expenses.jsx
    ├── index.jsx
    ├── reports.jsx
    ├── sales
    │   ├── customers.jsx
    │   ├── deposits.jsx
    │   ├── index.jsx
    │   ├── invoices
    │   │   ├── $invoiceId.jsx
    │   │   └── index.jsx
    │   ├── invoices.jsx
    │   └── subscriptions.jsx
    └── sales.jsx
```

また`ErrorBoundary`を併用することで1つのコンポーネントがエラーで表示できなくなったとしてもページ全体が表示できないということを防げる。

### ErrorBoundary

コンポーネントのクライアントサイドでのレンダリング時にエラーがあった場合の表示を設定するエラーハンドリング。
＊`CatchBoundary`はレンダリング時にAPIからのfetchやDB更新などでエラーがあった場合にキャッチする。

```javascript
export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="bg-rose-500">
      <div>
        {error.message}
      </div>
    </div>
  );
}
```

QuickStartで使ったソースコードを使って実際にNested Routesと`ErrorBoundary`の動作を確認してみた。

`posts/admin/new`のNested Routesでそれぞれコンポーネントを表示させている。

`Create a New Post`を押すとadminディレクトリ配下の`new.tsx`コンポーネントがレンダリングされる。

その`new.tsx`コンポーネントでエラーが起きた想定で`ErrorBoundary`を利用している。

#### 通常

![Normal](./images/nested_routes_normal.gif)

#### ErrorBoundaryなし

![Without ErrorBoundary](./images/not_boundary.gif)

#### ErrorBoundaryあり

![With ErrorBoundary](./images/boundary.gif)

## まとめ

Nested Routesという概念によりまた一つUX体験を向上させる手段を知れたのでよかった。

Next.jsと違いSSGやISRといった静的ビルドはないけれど、エッジを使ってSSRを高速化しているというところのアーキテクチャの違いが興味深かった。

ちなみこのブログはNext.jsを使って作っておりSSGには日々お世話になっている。

エッジらへんもっと知りたいなと思う。
