---
title: "<書評> Java言語で学ぶデザインパターン入門第3版 第1弾"
date: 2023-08-11
description: "デザインパターンが何かを知りたくて読んだ"
tags: "Book"
---

## 概要

半年前とかに読んだ[Java言語で学ぶデザインパターン入門第3版](https://www.hyuki.com/dp/) 感想まとめ

サンプルコードは書き慣れたTSで記述している(Javaは書き慣れていないので)

参考: [https://github.com/torokmark/design_patterns_in_typescript](https://github.com/torokmark/design_patterns_in_typescript)

## Adapterパターン

クラスのインターフェイスを、クライアントが期待する別のインターフェイスへ変換を実現するパターン

互換性のないインターフェースのためにできなかったクラス同士の連携が可能になる

## Singletonパターン

インスタンスが1つしか存在しないことを保証するパターン

### サンプルコード

[https://github.com/torokmark/design_patterns_in_typescript/tree/main/singleton](https://github.com/torokmark/design_patterns_in_typescript/tree/main/singleton)

#### Singletonパターンの定義

- コンストラクタは外部に公開しない
  - `new Singleton`が外部から不可能になる
- インタンス取得用のメソッドのみ外部公開する
  - 内部実装的にはFactory Methodのようになっている
  - インスタンスがすでに作成済み確認する

```typescript
namespace SingletonPattern {
  export class Singleton {
    private static singleton: Singleton;
    private constructor() {}
    public static getInstance(): Singleton {
      if (!Singleton.singleton) {
        Singleton.singleton = new Singleton();
      }
      return Singleton.singleton;
    }
  }
}
```

#### 呼び出し

```typescript
namespace SingletonPattern {
  export namespace Demo {
    export function show(): void {
      const singleton1 = SingletonPattern.Singleton.getInstance();
      const singleton2 = SingletonPattern.Singleton.getInstance();
      if (singleton1 === singleton2) {
        console.log('two singletons are equivalent');
      } else {
        console.log('two singletons are not equivalent');
      }
    }
  }
}
```

## Prototypeパターン

新しいインスタンスを作る際にクラスではなく既存のインスタンスから複製するパターン

### サンプルコード

[https://github.com/torokmark/design_patterns_in_typescript/tree/main/prototype](https://github.com/torokmark/design_patterns_in_typescript/tree/main/prototype)

#### Prototypeパターンの定義

- 複製対象クラスは自身を複製できるcloneメソッドをインターフェースとして持っている
- Builderクラスに複製対象クラスを表す文字列(ex. c1)を渡すと透過的に複製できる

```typescript
namespace PrototypePattern {
  export interface Prototype {
    clone(): Prototype;
    toString(): string;
  }

  export class Concrete1 implements Prototype {
    clone(): Prototype {
      return new Concrete1();
    }

    toString(): string {
      return 'This is Concrete1';
    }
  }

  export class Concrete2 implements Prototype {
    clone(): Prototype {
      return new Concrete2();
    }

    toString(): string {
      return 'This is Concrete2';
    }
  }

  export class Builder {
    private prototypeMap: { [s: string]: Prototype } = {};

    constructor() {
      this.prototypeMap['c1'] = new Concrete1();
      this.prototypeMap['c2'] = new Concrete2();
    }
    createOne(s: string): Prototype {
      console.log(s);
      return this.prototypeMap[s].clone();
    }
  }
}
```

### 呼び出し

```typescript
namespace PrototypePattern {
  export namespace Demo {
    export function show(): void {
      var builder: PrototypePattern.Builder = new PrototypePattern.Builder();
      var i = 0;
      for (i = 1; i <= 2; i += 1) {
        console.log(builder.createOne('c' + i).toString());
      }
    }
  }
}
```

### 所感

このコードでは複製時に`new`キーワード使っているので、生成コストは同じだと思った。

要件次第ではディープコピーを採用することになるので、そこのロジックは考えないといけないと思う。

また、生成時に複数のパラメータが必要な場合、生成コストはそこまで変わらないし、むしろ上がるのではと思う。

ただ、APIレスポンスをパラメータとしている場合は、複製する方がコスト低い(APIリクエストが発生しない)ので複製した方が良さそう。

## Abstract Factoryパターン

関連したオブジェクトの集まりを具象クラスを指定することなく生成できるようにしたパターン

### サンプルコード

[https://github.com/torokmark/design_patterns_in_typescript/tree/main/abstract_factory](https://github.com/torokmark/design_patterns_in_typescript/tree/main/abstract_factory)

### Abstract Factoryパターンの定義

基本的に`Abstract.*`はインターフェースとして定義されており、メンバの集合体となっている

`Concreate.*`_は_`Abstract.*`のインターフェースの中身を定義している

`Abstract.*`では最終的に生成するオブジェクトの形式だけを決めておいて*、*`Concreate.*`でオブジェクトの実際の中身を返している

```typescript
namespace AbstractFactoryPattern {
  export interface AbstractProductA {
    methodA(): string;
  }
  export interface AbstractProductB {
    methodB(): number;
  }

  export interface AbstractFactory {
    createProductA(param?: any): AbstractProductA;
    createProductB(): AbstractProductB;
  }

  export class ProductA1 implements AbstractProductA {
    methodA = () => {
      return 'This is methodA of ProductA1';
    };
  }
  export class ProductB1 implements AbstractProductB {
    methodB = () => {
      return 1;
    };
  }

  export class ProductA2 implements AbstractProductA {
    methodA = () => {
      return 'This is methodA of ProductA2';
    };
  }
  export class ProductB2 implements AbstractProductB {
    methodB = () => {
      return 2;
    };
  }

  export class ConcreteFactory1 implements AbstractFactory {
    createProductA(param?: any): AbstractProductA {
      return new ProductA1();
    }

    createProductB(param?: any): AbstractProductB {
      return new ProductB1();
    }
  }
  export class ConcreteFactory2 implements AbstractFactory {
    createProductA(param?: any): AbstractProductA {
      return new ProductA2();
    }

    createProductB(param?: any): AbstractProductB {
      return new ProductB2();
    }
  }

  export class Tester {
    private abstractProductA: AbstractProductA;
    private abstractProductB: AbstractProductB;

    constructor(factory: AbstractFactory) {
      this.abstractProductA = factory.createProductA();
      this.abstractProductB = factory.createProductB();
    }
    public test(): void {
      console.log(this.abstractProductA.methodA());
      console.log(this.abstractProductB.methodB());
    }
  }
}
```

#### 呼び出し

- `ConcreteFactory1`や`ConcreteFactory2`はどちらも`AbstractFactory`型なので、結局どのFactoryなのかクライアント側で気にする必要はない
- 気にする必要があるのは、生成されたオブジェクトが`test`メソッドを持つということだけ
- 生成ロジックは隠蔽されている

```typescript
namespace AbstractFactoryPattern {
  export namespace Demo {
    export function show() {
      // Abstract factory1
      var factory1: AbstractFactoryPattern.AbstractFactory =
        new AbstractFactoryPattern.ConcreteFactory1();
      var tester1: AbstractFactoryPattern.Tester =
        new AbstractFactoryPattern.Tester(factory1);
      tester1.test();

      // Abstract factory2
      var factory2: AbstractFactoryPattern.AbstractFactory =
        new AbstractFactoryPattern.ConcreteFactory2();
      var tester2: AbstractFactoryPattern.Tester =
        new AbstractFactoryPattern.Tester(factory2);
      tester2.test();
    }
  }
}
```

### 所感

単一責任の原則に従っているし、クライアントと生成ロジックが密結合しないのはメリットだと感じた

ただ、関連するオブジェクトの集まりが少ない場合は、普通に`Factory Method`パターンで良いと思った

似たUIが複数生成する必要がある場合は、このパターンを採用しても良さそう

仮にこのパターンを採用する場合、コードが複雑になるのは避けられないので、トレードオフを丁寧に評価する必要がある

## Bridgeパターン

抽象部分と実装部分を切り離し、両者を独立して変更できるようにしたパターン

### サンプルコード

[https://github.com/torokmark/design_patterns_in_typescript/blob/main/bridge/bridge.ts](https://github.com/torokmark/design_patterns_in_typescript/blob/main/bridge/bridge.ts)

### Bridgeパターンの定義

![image of bridge pattern](https://images.microcms-assets.io/assets/29c265a7cc5e4ed284faac0e218d88e8/44f2a99ed7a84cd0b44c1a37ccf0d420/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202023-05-21%209.47.35.png?w=1000&h=348)

- `Abstraction`は実装から独立した操作を定義したクラス
  - `Implementator`への参照を保持し、メソッドを定義
- `RefinedAbstraction.*`は`Abstraction`クラスの具体的なサブクラス
  - `Abstraction`クラスで定義したメソッドの具体的な動作を定義
- `Implementor`は抽象化から独立した操作を定義したクラス
- `ConcreteImplementor.*`は`Implementor`クラスの具体的なサブクラス
  - `Implementor`クラスで定義したメソッドの具体的な動作を定義

```typescript
namespace BridgePattern {
  export class Abstraction {
    implementor: Implementor;
    constructor(imp: Implementor) {
      this.implementor = imp;
    }
    public callIt(s: String): void {
      throw new Error('This method is abstract!');
    }
  }

  // ... 以下のコードは省略 ...
}
```

### 呼び出し

```typescript
namespace BridgePattern {
  export namespace Demo {
    export function show(): void {
      var abstractionA: BridgePattern.Abstraction =
        new BridgePattern.RefinedAbstractionA(
          new BridgePattern.ConcreteImplementorA(),
        );
      var abstractionB: BridgePattern.Abstraction =
        new BridgePattern.RefinedAbstractionB(
          new BridgePattern.ConcreteImplementorB(),
        );

      abstractionA.callIt('abstractionA');
      abstractionB.callIt('abstractionB');
    }
  }
}
```

### 所感

ここまでやるかは別として、抽象と実装を切り分けることで、コアロジックと詳細なロジックを分離できる点はメリットだと思う
それにより変更容易性がある程度担保されている
デザインパターンは単一責任の原則が色濃く出ているなと思う

## Strategyパターン

同じインターフェースだが振る舞い(アルゴリズム)をユースケースごとに分離して実行できるようにしたパターン

### サンプルコード

[https://github.com/torokmark/design_patterns_in_typescript/tree/main/strategy](https://github.com/torokmark/design_patterns_in_typescript/tree/main/strategy)

### Strategyパターンの定義

- それぞれの振る舞い(アルゴリズム)を`Strategy.*`クラスに分離する
- `Strategy.*`クラスは`Strategy`インターフェースを持つ
- `Context`クラスは渡された`Strategy.*`クラスを呼び出す

```typescript
namespace StrategyPattern {
  export interface Strategy {
    execute(): void;
  }

  export class ConcreteStrategy1 implements Strategy {
    public execute(): void {
      console.log('`execute` method of ConcreteStrategy1 is being called');
    }
  }

  export class ConcreteStrategy2 implements Strategy {
    public execute(): void {
      console.log('`execute` method of ConcreteStrategy2 is being called');
    }
  }

  export class ConcreteStrategy3 implements Strategy {
    public execute(): void {
      console.log('`execute` method of ConcreteStrategy3 is being called');
    }
  }

  export class Context {
    private strategy: Strategy;

    constructor(strategy: Strategy) {
      this.strategy = strategy;
    }
    public executeStrategy(): void {
      this.strategy.execute();
    }
  }
}
```

### 呼び出し

```typescript
namespace StrategyPattern {
  export namespace Demo {
    export function show(): void {
      var context: StrategyPattern.Context = new StrategyPattern.Context(
        new StrategyPattern.ConcreteStrategy1(),
      );

      context.executeStrategy();

      context = new StrategyPattern.Context(
        new StrategyPattern.ConcreteStrategy2(),
      );
      context.executeStrategy();

      context = new StrategyPattern.Context(
        new StrategyPattern.ConcreteStrategy3(),
      );
      context.executeStrategy();
    }
  }
}
```

### 所感

個人的にはかなり現実的なパターンだと考えている。

生成ロジックの分離に重きを置いたPrototypeやFactory、Bridgeパターンより、Strategyパターンのような振る舞いを分離する方がコスパよく変更の影響範囲を最小化できそうな気がしている。

最初からPrototypeやFactoryパターンなどを実装しているプロジェクトは少ないと思っていて、そうなるとStrategyパターンで振る舞いを分離して置いた上で他のデザインパターンを適用していくという考え方もあるのでは。

## まとめ

デザインパターンを愚直に適用するのは良くないけれど、考え方自体を知っておくのはとても有用だと思う。

残りのデザインパターンは別記事にまとめる。

- Compositeパターン
- Visitorパターン
- Facadeパターン
- Mediatorパターン
- Proxyパターン
- Commandパターン
- Interpreterパターン
