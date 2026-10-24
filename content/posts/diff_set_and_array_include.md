---
title: "SetとArrayのinclude?の違い"
date: 2022-11-13
description: "Set#include? の方が O(1) なので早いよ"
tags: "Ruby"
---

## 概要

先日社内のPRコードレビューを受けて、`Array#include?`より`Set#include?`の方が高速だということを知った

その時にソースを追ってみたまとめ

## 要約

- `Array#include?`は計算量が`O(n)`
- `Set#include?`は計算量が`O(1)`

## Array#include?

```c
VALUE
rb_ary_includes(VALUE ary, VALUE item)
{
  long i;
  VALUE e;
  for (i=0; i<RARRAY_LEN(ary); i++) {
    e = RARRAY_AREF(ary, i);
    if (rb_equal(e, item)) {
      return Qtrue;
    }
  }
  return Qfalse;
}
```

refs. [https://github.com/ruby/ruby/blob/master/array.c#L5417-L5430](https://github.com/ruby/ruby/blob/master/array.c#L5417-L5430)

```c
/**
 * This function is an optimised version of calling `#==`. It checks equality
 * between two objects by first doing a fast identity check using using C's
 * `==` (same as `BasicObject#equal?`). If that check fails, it calls `#==`
 * dynamically.  This optimisation actually affects semantics, because when
 * `#==` returns false for the same object obj, `rb_equal(obj, obj)` would
 * still return true.  This happens for `Float::NAN`, where `Float::NAN ==
 * Float::NAN` is `false`, but `rb_equal(Float::NAN, Float::NAN)` is `true`.
 *
 * @param[in] lhs          Comparison LHS.
 * @param[in] rhs          Comparison RHS.
 * @retval     RUBY_Qtrue   They are the same.
 * @retval     RUBY_Qfalse  They are different.
 */

VALUE rb_equal(VALUE lhs, VALUE rhs);
```

refs. [https://github.com/ruby/ruby/blob/master/include/ruby/ruby.h#L164-L178](https://github.com/ruby/ruby/blob/master/include/ruby/ruby.h#L164-L178)

説明によるとオブジェクト同士の比較ということ

```ruby
describe "rb_equal" do
  it "returns true if the arguments are the same exact object" do
    s = "hello"
    @o.rb_equal(s, s).should be_true
  end
  it "calls == to check equality and coerces to true/false" do
    m = mock("string")
    m.should_receive(:==).and_return(8)
    @o.rb_equal(m, "hello").should be_true
    m2 = mock("string")
    m2.should_receive(:==).and_return(nil)
    @o.rb_equal(m2, "hello").should be_false
  end
end
```

refs. [https://github.com/ruby/ruby/blob/master/spec/ruby/optional/capi/object_spec.rb#L764-L779](https://github.com/ruby/ruby/blob/master/spec/ruby/optional/capi/object_spec.rb#L764-L779)

念の為テストも確認して同値比較メソッドであることを確認

つまり`Array#include?`は1つずつ同値比較をしているので計算量が`O(n)`

## Set#include?

```ruby
# Returns true if the set contains the given object.
#
# Note that <code>include?</code> and <code>member?</code> do not test member
# equality using <code>==</code> as do other Enumerables.
#
# See also Enumerable#include?

def include?(o)
  @hash[o]
end
alias member? include?
```

refs. [https://github.com/ruby/ruby/blob/master/lib/set.rb#L397-L406](https://github.com/ruby/ruby/blob/master/lib/set.rb#L397-L406)

hashでのアクセスにより `O(1)`の計算量を実現していることが分かった

ちなみにSetはイニシャライズでhashとして扱われている

```ruby
def initialize(enum = nil, &block) # :yields: o
  @hash ||= Hash.new(false)
  enum.nil? and return
  if block
    do_with_enum(enum) { |o| add(block[o]) }
  else
    merge(enum)
  end
end
```

refs. [https://github.com/ruby/ruby/blob/master/lib/set.rb#L245-L255](https://github.com/ruby/ruby/blob/master/lib/set.rb#L245-L255)
