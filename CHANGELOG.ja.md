# 変更履歴

## 0.5.2 — 0.5.1 の再リリース、コード変更なし

### 备注

- 0.5.1 と同一コード（strict context クラッシュ修正）。0.5.1 tarball がコミット前にパックされたため changelog エントリ同梱漏れを解消する再カット。0.1.7-rc.2 実機（起動 + キー全体パイプライン）と 0.2.0-rc.2 デスクトップ（起動復旧、↑/↓動作）で検証済み。

## 0.5.1 — 0.5.0 が起こした web boot 致命故障を修正

### 修正

- 現行ホストで 0.5.0 は起動全体を失敗させ得ました（`web boot: 1 entry did not activate — dsh-arrowkey-nav: failed`）: 新しいクライアントランナーのコンテキストプロキシは、fiber が宣言していないサービスの読み取りで**例外を投げ**、0.5.0 は bundle `inject` から外した `uiWorkspace` を（リスナー接続ログ・診断アクセサ・実行器プローブで）読んでいました。最初の effect 内の例外が fiber を FAILED にし、web-boot ゲートは失敗 entry を致命扱いします。0.5.1 は 3 サービスを再び宣言（`uiWorkspace` は 0.1.2 世代以降の全ホストに存在）し、読み取りはすべて例外安全な `probeService` 経由に。0.1.0/0.1.1 世代は `uiWorkspace` を登録しないため、そこでは fiber はペンディングのまま不活性です。その 2 ラインは従来どおり legacy `dsh-arrowkey-nav@0.1.1` を使ってください。

## 0.5.0 — 全サポート対象ホストラインをひとつのバージョンで

### 変更

- **ひとつのバージョンが 6 ライン（0.1.0 / 0.1.1 / 0.1.2 / 0.1.5 / 0.1.7 / 0.2.0）の公開済み全 rc に対応。** ラインごとの `compat/*` ブランチとライン別ビルドは廃止し、単一バンドルに統合。ラインの dist-tag（`dsh-0.1.0` … `dsh-0.2.0`）は残り、すべてこのバージョンを指します。正確なホワイトリストは `scripts/hosts.mjs` にあり、`scripts/sync-hosts.mjs --write` が `engines.dsh`（package.json + dsh.plugin.json）・`peerDependencies`・README へ配布します。手直しは `npm run hosts:check` で失敗します。
- `peerDependencies` は必須になりました（`optional` マークは削除）: 未検証ホストは静かに不足サービスで動く代わりに、インストールが明確に失敗します。2 つのコントローラ peer は存在する 8 バージョンを列挙 — `@deepseek-ai/dsh-api-{session,workspace}-controller` は 0.1.2-rc.1 で初登載なので、0.1.0/0.1.1 世代は `engines.dsh` のみで括ります。`@deepseek-ai/dsh-client-ui-workspace` は全 15 を列挙。
- クライアントバンドルは `uiWorkspace` サービスを待たなくなりました（`inject` は `['sessions', 'workspaces']`）: 0.1.0/0.1.1 世代では登録されないことがあり、待つと永久に PENDING になるためです。押下ごとにプローブします。

### 修正（全ライン共通の設計として）

- ひとつのコードベースがケイパビリティプローブで両世代の切替を処理します（`src/client/apply.ts` の `switchExecutor`）: あれば `uiWorkspace.openSession`（0.1.6+）、なければ旧 `sessions.open`（0.1.0–0.1.5）。どちらもないホストではマウントしたまま不活性。選択中セッションは世代合同（`src/client/navigate.ts` の `toNavState`）で読む: スナップショット自身の `current`（0.1.6 未満）が優先、なければ `retainedBy.mainView` の導出（0.1.7/0.2.0）。ライン間の挙動差異は構造上起こり得ません — 0.3.x/0.4.x で実際に起きたリグレッションの種類です。

### 既知

- キーストローク単位の検証マトリクス（`--serve` + Playwright、rc ごとに 1 セル）が残るリリース関門です。本エントリはユニット + バンドル coverage のみ。0.1.0/0.1.1 セルはさらに、3 エントリのモジュールテーブル `dsh.client.inject` を当該世代が許容するかに依存します（当該世代のプラグインは 3 パッケージのうち 2 つより前の世代です）。

## 0.4.1 — `compat/0.2.0`（DSH 0.2.0 ライン）

### 修正

- DSH 0.2.0-rc.2（および姉妹ライン `compat/0.1.7` の 0.1.7-rc.2、そちらは 0.3.4）で方向キー navigation を復旧。ホストのクライアント API の 2 つの破壊的変更により、プラグインは起動する（コンソールに `listener attached`）ものの全方向キーが無反応（押すたびに `keydown failed`）になっていた：
  - `ISessions.open(id)` が存在しなくなった — 切り替えは `uiWorkspace.openSession(target)` 経由に変更。プラグインは既に `uiWorkspace` を注入し `@deepseek-ai/dsh-client-ui-workspace` peer を宣言済みのため、manifest 変更は不要。
  - `SessionListState.current` が削除された — 選択中セッションは narrow waist（`src/client/navigate.ts` の `deriveCurrent`）で `retainedBy.mainView > 0` から導出（ホスト自身の `mainSessionId` を踏襲）。`planArrow` / `visibleRows` / `session-nav.ts` / `index.ts` と純粋 resolver テストは不変。
- `tests/bundle.test.ts` の fake サービスを実際のホストスナップショット形状（`list.current` の代わりに `retainedBy.mainView`、`sessions.open` の代わりに `uiWorkspace.openSession`）へ作り直し。これによりこの種の退行を bundle スモークテストが検出できる。

### 注記

- 下方の 0.4.0「メタデータのみ … 追加フィールドのみで削除はなし」の記述は誤りだった：`ISessions.open` と `SessionListState.current` は実際には 0.1.5 から 0.1.7 の間で削除されており、0.2.0 への付け替えは挙動面を再検証しないままその破壊を継承した。本リリースで訂正する。

## 未リリース — `compat/0.2.0`（DSH 0.2.0 ライン）

### 変更

- `peerDependencies` と `engines.dsh` を DSH 0.2.0 ラインへ付け替え：`>=0.2.0-rc.1 <0.2.1-0`（package.json + dsh.plugin.json）。本プラグインが読む全サービス面（`sessions.list` スナップショット、`WorkspaceSnapshot`/`WorkspaceView`、`uiWorkspace.connectWorkspace`）を 0.1.7-rc.2 と 0.2.0-rc.1 の宣言で差分確認。（元の「追加フィールドのみで削除はなし」は誤り — `ISessions.open` と `SessionListState.current` は 0.1.7 以前に削除済み。上記 0.4.1 を参照。）
- インストール手順は `github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0` を参照。レジストリは `dsh-0.2.0` dist-tag で `0.4.1` を公開。

## 未リリース — `compat/0.1.7`（DSH 0.1.7 ライン）

### 変更

- `peerDependencies` と `engines.dsh` を DSH 0.1.7 ラインへ付け替え：`>=0.1.7-rc.1 <0.1.8-0`（package.json + dsh.plugin.json）。読み取り専用の 0.1.7 判定スイート（D1–D11）はゼロヒットで、ビルド・テスト時に `@deepseek-ai/*` モジュールを import しない — ただしこのスイートは `sessions.open` / `SessionListState.current` の挙動面をカバーしておらず、そこは実際に壊れており 0.3.4 で修正。
- インストール手順は `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.7` を参照。レジストリは `dsh-0.1.7` dist-tag で `0.3.4` を公開。

### 追加

- ESLint flat config（src は type-checked、tests は recommended ベースライン）と `lint` npm script を追加。`npm run lint` はクリーン。

## 未リリース — `compat/0.1.5-rc`（DSH 0.1.5 ライン）

### 変更

- `engines.dsh` を `>=0.1.5-alpha.1 <0.2.0-0` に絞り込みました — このブランチが実際に実装している範囲です。`dsh.plugin.json` も `master` から引き継いだ古い `>=0.1.2-rc.1` ではなく同じ範囲を持ちます。
- インストール手順は `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.5-rc` を指します。レジストリのパッケージ（`dsh-arrowkey-nav@0.1.1`）は引き続き `master` ~0.1.2 ラインであり、README と対応範囲の記述をマニフェストに揃えました。

### 追加

- 読み取り専用のコンソール証跡アクセサ `globalThis.__dshArrowkeyNav.snapshot()`（`diagnose-console.js`）。ページが実際に読み込んだ `sessions` / `workspaces` のスナップショット形状を報告し、0.1.5 適合を実機で検証できます。

## 0.1.1

### 修正

- `types` と `exports["."].types` が、ビルドで生成されない `lib/types/index.d.ts` を指していました。このファイルはディスク上にも、公開済み 0.1.0 の tarball にも存在しなかったため、TypeScript の利用者は宣言を取得できませんでした。両方を、生成・同梱される `lib/index.d.ts` に向けました。
- `engines` が存在せず、Node と DSH のバージョンがどちらも制限されていませんでした。両方を宣言しました。
- `lib/` は gitignore されており、ビルドするフックもなかったため、クリーンなクローンからの公開ではコンパイル済み出力を含まない tarball が配布される状態でした。`prepublishOnly` フックを追加しました。

### 追加

- `dsh.plugin.json`、表示マニフェスト `screenshots.json`、および `repository` / `homepage` / `keywords`。
- 日本語・韓国語の README と変更履歴、および英語・簡体字中国語・日本語・韓国語のインストールガイド。

## 0.1.0

初回リリース: DSH Web GUI 向けの矢印キーナビゲーション。

### 追加

- `↑` / `↓` は現在のワークスペース内で前 / 次のセッションへ切り替えます。端では折り返し、隣接するワークスペースへまたがることはありません。
- `←` / `→` はすべてのワークスペースをまたいで切り替えます。
- 切り替え後は対象の行がビュー内にスクロールされ、キー入力がそこから始まった場合はフォーカスがコンポーザーへ戻るため、そのまま入力を続けられます。
- セッションの識別情報は 2 つのクライアントコントローラー (`ctx.sessions`、`ctx.workspaces`) から読み取られ、DOM からは決して読み取られません: 行は `data-*` も `id` も持たないため、行にどのセッションなのかを問い合わせることはできません。
- 「次」はサイドバーが描画している順序に従い、コントローラーのメンバーシップと突き合わせられます。サイドバーがマウントされていない場合 (折りたたまれたレール) はコントローラーの順序へフォールバックし、曖昧なセクションや不一致のセクションは推測せずフォールバックします。
- 矢印キーは、イベントを既に所有している相手に譲られます: 何らかの修飾キー、IME 変換中、上流で既に処理済みのイベント、あるいはダイアログ・メニュー・他の編集可能フィールド内のフォーカスです。
- 空のコンポーザーは矢印キーを譲ります。下書きを保持しているコンポーザーはキャレットのためにそれらを保持するため、プロンプトの編集中に横取りされることはありません。
- リスナーはキャプチャフェーズで登録しますが、`preventDefault()` を呼び出すのは実際にナビゲートするときだけです。
- ブラウザ側には React コンポーネントも CSS もプラットフォームモジュール要求もなく、パッケージに実行時依存関係はありません。

### 既知の制限

- 折りたたまれたワークスペースグループはスクロールしません: その行はマウントされておらず、dsh はグループを展開する公開手段を提供していません。切り替え自体は行われます。現在のセッションを含むワークスペースは dsh が展開状態に保つため、`↑`/`↓` は影響を受けません。
- レール折りたたみのサイドバーも、同じ理由でスクロールしません。
- 「1 つのリスト」モードにはワークスペースのセクションがありませんが、`←`/`→` は依然としてコントローラーのワークスペース順をたどるため、リストがセクション間を飛び回るように見えることがあります。
- スクロールはベストエフォートです — 検索の失敗はすべて握りつぶされます。選択は既に移動しており、行が見つからないことが誤った行になることは決してあってはならないからです。
- dsh 0.1.2-rc.1 に固定されています: `sessions` と `workspaces` のスナップショットフィールドは安定前です。dsh のアップグレードでこれらが変わった場合に見直すファイルは `src/client/navigate.ts` と `src/client/apply.ts` だけです。サービスが存在しなくなった場合は、ページを失敗させるのではなくプラグインがペンディングのままになります。
