# dsh-arrowkey-nav

[English](./README.md) | [简体中文](./README.zh.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Français](./README.fr.md) | [Deutsch](./README.de.md) | [Italiano](./README.it.md) | [Русский](./README.ru.md) | [Español](./README.es.md)

DSH Web GUI 向けの矢印キーナビゲーション。キーボードから手を離さずにセッションを
切り替えられます:

| キー | 動作 | 範囲 |
| --- | --- | --- |
| `↑` | 前のセッション | 現在のワークスペース内 |
| `↓` | 次のセッション | 現在のワークスペース内 |
| `←` | 前のワークスペース | すべてのワークスペース |
| `→` | 次のワークスペース | すべてのワークスペース |

`↑`/`↓` はワークスペースの端で折り返し、隣接するワークスペースへは決して
またがりません。またがるためのキーが `←`/`→` です。切り替え後は対象の行が
ビュー内にスクロールされ、キー入力がコンポーザーから始まった場合はフォーカスが
そこへ戻るため、そのまま入力を続けられます。

## バージョンと DSH ホストライン

ひとつのバージョンがサポート対象のすべてのホストラインに対応します。`0.5.0` は DSH 0.1.0–0.2.0 の 6 ラインの全 rc を検証対象にしています —— 正確なホワイトリストは `engines.dsh` で、単一の事実源 `scripts/hosts.mjs` から `scripts/sync-hosts.mjs` が配布します（手直しすると `npm run hosts:check` が失敗します）：

| DSH ライン | 検証済み rc |
| --- | --- |
| 0.1.0 | rc.2, rc.3, rc.6, rc.7, rc.8 |
| 0.1.1 | rc.1, rc.2 |
| 0.1.2 | rc.1 |
| 0.1.5 | rc.1, rc.2, rc.3 |
| 0.1.7 | rc.1, rc.2 |
| 0.2.0 | rc.1, rc.2 |

- ライン別のビルドはありません：2 世代の切替 API はケイパビリティプローブが同一バンドル内で振り分けます（0.1.6+ 世代は `uiWorkspace.openSession`、それ以前は `sessions.open`）。全ホストラインが同一コードで動きます。
- 0.1.0/0.1.1 ライン（`dsh-client-runtime` 世代）は宣言面とユニットテストは整っていますが、実機でのキーストローク検証は未実施です。それまでこの 2 セルはベストエフォートとして扱ってください。

## インストール

```sh
dsh plugin --profile web add dsh-arrowkey-nav -w
```

レジストリの `latest` が全ライン共通の唯一のバージョンです。各ラインには同じビルドを指す dist-tag もあります（`dsh-arrowkey-nav@dsh-0.2.0`、`dsh-arrowkey-nav@dsh-0.1.5` など）—— ラインを名指ししてもインストール先は同一です。表外のホストリリースは `engines.dsh` ホワイトリストがインストールを拒否します。

その後にプロファイルを再起動してください。実行中のインスタンスは新しい
バンドルレイヤーをホットロードしません。その後 `http://127.0.0.1:3080` を
リロードします。

行が合成ツリーに含まれていることを確認します:

```sh
dsh web --dump-config | Select-String dsh-arrowkey-nav
```

代わりにローカルのチェックアウトを登録することもできます:
`dsh plugin --profile web add <absolute path to the checkout> -w`。アップグレード、
検証、削除を含む完全なガイドは [INSTALL.md](./INSTALL.md) を参照してください。

### 削除

```sh
dsh plugin --profile web remove dsh-arrowkey-nav
```

再起動すれば、キーはインストール前とまったく同じ動作になります。リスナーは
プラグインの Cordis エフェクトが所有しており、それとともに削除されます。

## 仕組み

識別情報は 2 つのクライアントコントローラーから取得し、DOM からは決して取得しません:
行は `data-*` も `id` も持たないため、行にどのセッションなのかを問い合わせることは
できません。

- 切り替えは毎回、ケイパビリティプローブが選んだ実行器を通ります：DSH 0.1.6+ 世代では `ctx.uiWorkspace.openSession(id)`、それ以前のラインでは `ctx.sessions.open(id)` —— バンドルはひとつ、ライン別のビルドはありません。詳細パネルに特別な処理は不要です: 同梱のフレームが、現在のセッションが変わった時点で既にそれを閉じます。

**どのセッションが「次」かは、サイドバーが描画している順序に従います**。コントローラーの
メンバー順ではありません。両者が食い違うのは、まさに気づく場面です: サイドバーは
自身が永続化した順序とメンバーシップを突き合わせ、最近アクティブだったセッションを
先頭へ昇格させるため、古いセッションも開いた瞬間に最初の行へ移動します。そこで
プラグインは、サイドバーから描画済みの行順を読み取り、サイドバーがマウントされて
いない場合 (折りたたまれたレール) はコントローラーの順序へフォールバックします。
セクションが受け入れられるのは、その行がコントローラーから報告されたそのワーク
スペースのすべてのセッションを説明できる場合だけです。曖昧なセクションや不一致の
セクションは、推測せずフォールバックします。

イベントが既に他者のものである場合、キーには手を出しません: 何らかの修飾キー、
IME 変換中、上流で既に処理済みのイベント、あるいはダイアログ・メニュー・他の
編集可能フィールド (サイドバーのセッション検索、名前変更ボックス) 内のフォーカス
です。リスナーはキャプチャフェーズで登録しますが、実際にナビゲートするときだけ
`preventDefault()` を呼び出します。

コンポーザーが唯一の条件付きケースです。**空のコンポーザーは矢印キーを譲ります**
— 移動すべきキャレットがなく、キーが空いているからです。これにより、メッセージ送信
直後でコンポーザーがまだフォーカスを保持していても、すぐにナビゲートできます。
コンポーザーが**下書きを保持しているときは、その矢印キーは再びキャレットのものに
なります**ので、プロンプトの編集中に横取りされることはありません。

ブラウザ側には React コンポーネントも CSS もプラットフォームモジュール要求もなく、
パッケージに実行時依存関係はありません — `lib/client.js` は
`scripts/build-client.mjs` によって、ページが期待するモジュールローダー契約へ
生成されます。

## 開発

```sh
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

`npm run build` には `typescript` が必要です。このパッケージにインストールされて
いない場合は、`DSH_TYPESCRIPT` を既存の `typescript` モジュールディレクトリに
向けてください。

## 既知の制限

- **折りたたまれたワークスペースグループはスクロールしません。** その行はマウント
  されておらず、dsh はグループを展開する公開手段を提供していないため、切り替えは
  行われますが対象の行は画面外に留まります。現在のセッションを含むワークスペースは
  dsh 自身が展開状態に保つため、`↑`/`↓` は影響を受けません。
- **レール折りたたみのサイドバーもスクロールしません**。理由は同じで、ツリーが
  マウントされていないためです。切り替え自体は行われます。
- **「1 つのリスト」モード**にはワークスペースのセクションがありませんが、
  `←`/`→` は依然としてコントローラーのワークスペース順をたどるため、リストが
  セクション間を飛び回るように見えることがあります。
- **スクロールはベストエフォートです。** 検索の失敗はすべて握りつぶされます:
  選択は既に移動しており、行が見つからないことが誤った行になることは決して
  あってはならないからです。
- **スナップショットフィールドは安定前です。** `sessions` と `workspaces` のスナップショット形状は安定前であり、検証済みホストバージョンは `engines.dsh` ホワイトリストのとおり（`engines.dsh: 0.1.0-rc.2 || 0.1.0-rc.3 || 0.1.0-rc.6 || 0.1.0-rc.7 || 0.1.0-rc.8 || 0.1.1-rc.1 || 0.1.1-rc.2 || 0.1.2-rc.1 || 0.1.5-rc.1 || 0.1.5-rc.2 || 0.1.5-rc.3 || 0.1.7-rc.1 || 0.1.7-rc.2 || 0.2.0-rc.1 || 0.2.0-rc.2 || 0.2.1-rc.1 || 0.2.1-rc.2 || 0.2.1-rc.3 || 0.2.1-rc.4`）。dsh のアップグレードでこれらが変わった場合に見直すファイルは `src/client/navigate.ts` と `src/client/apply.ts` だけです。どちらの切替 API も持たないホストでは、ページを失敗させる代わりにプラグインは不活性のままです。

## レイアウト

```
src/index.ts                node half: loader entry, installs nothing
src/client/constants.ts     keys owned, DOM anchors read
src/client/navigate.ts      narrow waist: snapshot types + arrow resolver
src/client/apply.ts         execution: open / blank-first / connectWorkspace
src/client/dom.ts           read-only DOM: scroller, section binding, scroll, focus
src/client/session-nav.ts   key guards + one arrow press end to end
src/client/index.ts         Cordis entry: inject + one capturing listener
scripts/build-client.mjs    generates lib/client.js
tests/                      resolver unit tests + bundle smoke tests
```

## ライセンス

MIT
