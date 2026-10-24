---
title: "Railsアップグレードをした際の知見"
date: 2022-12-20
description: "6.1 にあげて DelegatedType を使った"
tags: "Ruby, Ruby on Rails"
---

## 概要

自分の会社でproduction運用しているアプリケーションのRailsバージョンをアップグレードした際の振り返り

## 背景

新機能追加にあたってCTIでテーブル設計をして、[ActiveRecord::DelegatedType](https://api.rubyonrails.org/classes/ActiveRecord/DelegatedType.html)（以下DelegatedType）を利用したかった

ただ、DelegatedTypeはRails6.1.0からしか利用できないので、アップグレードが必要だった

## 詰まったこと

- `GLIBC_2.29`以上が必要だった
  - それに伴いRubyのバージョンをアップグレード
- PostgreSQLのバージョンが見当たらなかった

## GLIBC_2.29以上が必要だった

Railsを6.0.2から6.1.0にアップグレードした際、`nokogiri`インストール時に`GLIBC_2.29`がないと怒られた

```plaintext
ERROR: It looks like you're trying to use Nokogiri as a precompiled native gem on a system with glibc < 2.17:
  /lib/aarch64-linux-gnu/libm.so.6: version `GLIBC_2.29' not found (required by /bundle/ruby/2.6.0/gems/nokogiri-1.13.8-aarch64-linux/lib/nokogiri/2.6/nokogiri.so) - /bundle/ruby/2.6.0/gems/nokogiri-1.13.8-aarch64-linux/lib/nokogiri/2.6/nokogiri.so
  If that's the case, then please install Nokogiri via the `ruby` platform gem:
    gem install nokogiri --platform=ruby
  or:
    bundle config set force_ruby_platform true
```

アプリケーションのRubyイメージ（`2.6.7-slim`）では、GLIBCが2.28であることから、GLIBC2.29以上が同梱されたイメージを利用する必要があった

そのため、Rubyのアップグレードも同時に行いイメージを`2.7.6-slim`にして、GLIBCを2.31にしたらinstallに成功

```plaintext
# ldd --version
ldd (Debian GLIBC 2.31-13+deb11u4) 2.31
Copyright (C) 2020 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
Written by Roland McGrath and Ulrich Drepper.
```

良い機会だからRubyのアップグレードまで行ったが、GLIBCの指定バージョンをインストールするだけでも良かった

## PostgreSQLのバージョンが見当たらなかった

修正前は`deb http://apt.postgresql.org/pub/repos/apt/ stretch-pgdg main`で探していたが見つからないと怒られる

```plaintext
#5 33.87 Warning: apt-key is deprecated. Manage keyring files in trusted.gpg.d instead (see apt-key(8)).
#5 34.28 OK
#5 35.11 cat: /tmp/Aptfile: No such file or directory
#5 35.11 Reading package lists...
#5 35.42 Building dependency tree...
#5 35.52 Reading state information...
#5 35.57 E: Unable to locate package postgresql-client-11
```

Rubyのimageを変えたのでDebianバージョンが変わったから見つからないのではと考えたらその通りだった

```plaintext
$ docker run --rm ruby:2.7.6-slim sh -c "cat /etc/*-release"
Unable to find image 'ruby:2.7.6-slim' locally
2.7.6-slim: Pulling from library/ruby
3d898485473e: Already exists
755e58a55855: Already exists
68a9083723f3: Already exists
b8edf3cdc5de: Already exists
93fc5708079e: Already exists
Digest: sha256:86f0a40ff15ddb9fbdc0a64bcf9ad4e048fec31a3e538a79a526b0461fca9bf8
Status: Downloaded newer image for ruby:2.7.6-slim
PRETTY_NAME="Debian GNU/Linux 11 (bullseye)"
NAME="Debian GNU/Linux"
VERSION_ID="11"
VERSION="11 (bullseye)"
VERSION_CODENAME=bullseye
ID=debian
HOME_URL="https://www.debian.org/"
SUPPORT_URL="https://www.debian.org/support"
BUGREPORTURL="https://bugs.debian.org/"
```

`bullseye`だったので、`deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main`で探すと見つかった

## まとめ

本番稼働しているアプリケーションのFWバージョンを上げるのは中々できないと思うのでとても良い経験になった
色々と詰まってしまったが、自分で一つ一つ調査して解決できた経験を次に活かしたい
