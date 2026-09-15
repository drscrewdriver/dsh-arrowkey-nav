# インストールガイド (公式 DSH CLI)

このガイドは公式 DSH の `dsh plugin` コマンドのみを使用します。このコマンドは
依存関係をプロファイルへインストールし、`dsh.profile.bundles` を同期します。
これを素の `npm install`、プロファイル内での直接の `pnpm add`、あるいはプロファイル
マニフェストの手動編集で置き換えないでください。

- [English installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [English README](./README.md)
- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

このガイドにおけるプレースホルダーは次のとおりです:

- `<profile>`: 変更対象の DSH プロファイル。通常は `web`。
- `dsh-arrowkey-nav`: npm パッケージ名であり、実行時プラグイン ID。

> **対応 DSH 範囲: `>=0.1.2-rc.1 <0.2.0-0`。**
>
> README はこのプラグインを `dsh 0.1.2-rc.1` に固定しています: 読み取る `sessions` と
> `workspaces` のスナップショットフィールドが安定前だからです。インストール前に
> `dsh --version` で実行中のバージョンを確認してください。

## 0. 前提条件とプロファイルの検出

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

実行中の DSH プロセスが指定しているプロファイルを使用してください。`web` が一般的
ですが、実際に有効な `--profile` 引数が優先されます。

## 1. 公式インストール

```bash
dsh plugin --profile <profile> add dsh-arrowkey-nav -w
```

(プロファイルが pnpm ワークスペースルートである場合 — `web` がそうですが — `-w`
フラグが必要です。)

特定のバージョンを明示的にインストールする場合:

```bash
dsh plugin --profile <profile> add dsh-arrowkey-nav@0.1.0 -w
```

公式 CLI はプロファイルの依存関係、ロックファイル、`dsh.profile.bundles` を自動的に
更新します。手動で YAML 行を追加しないでください。

### サプライチェーンのクーリング期間

DSH ランタイムは pnpm 11 を使用しており、その `minimumReleaseAge` ポリシーが
公開直後のバージョンを `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` でブロックする
ことがあります。`~/.dsh/profiles/<profile>/pnpm-workspace.yaml` の
`minimumReleaseAgeExclude` にそのバージョンを追加してください:

```yaml
minimumReleaseAgeExclude:
  - dsh-arrowkey-nav@0.1.0
```

## 2. プロファイルを再起動してページをリロードする

このプラグインは両方のハーフを同梱しており、キーボードリスナーが存在するのは
ブラウザ側のハーフです。**プロファイルを再起動してください** — 実行中のインスタンスは
新しいバンドルレイヤーをホットロードしません — その後 **`http://127.0.0.1:3080` を
リロードしてください**。リロードせずに再起動しただけでは、ページは以前のクライアント
バンドルを実行し続けます。

## 3. アップグレード

```bash
dsh plugin --profile <profile> update dsh-arrowkey-nav -w
```

その後にプロファイルを再起動し、ページをリロードしてください。

## 4. ローカルパス登録 (代替手段)

開発やオフラインインストールでは、ローカルのチェックアウトからプラグインを
登録します:

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-arrowkey-nav -w
```

ソースのチェックアウトは登録前にビルドする必要があります: `npm run build` が
`src/client` から `lib/client.js` を再生成します。ビルドには `typescript` が必要です。
そのパッケージにインストールされていない場合は、`DSH_TYPESCRIPT` を既存の
`typescript` モジュールディレクトリに向けてください。公開時は `prepublishOnly`
フックを通じて自動的にビルドされます。

```bash
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

## 5. インストールの検証

```bash
grep -n "dsh-arrowkey-nav" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-arrowkey-nav/package.json').version"
```

公式の合成を確認します:

```bash
dsh --profile <profile> --dump-default-config
```

次の内容が含まれている必要があります:

```yaml
- id: dsh-arrowkey-nav
  name: dsh-arrowkey-nav
```

## 6. プラグインの検証

ページをリロードしてから、次を確認してください:

1. `↑` / `↓` は現在のワークスペース内で前 / 次のセッションへ移動し、端で折り返して隣接するワークスペースへは入りません。
2. `←` / `→` はワークスペース間を移動します。
3. 切り替え後、対象の行がビュー内にスクロールされます。
4. コンポーザーが空のときに矢印を押すとナビゲートし、フォーカスはコンポーザーに残るため、そのまま入力が続けられます。
5. コンポーザーが下書きを保持していると、その矢印キーはナビゲートせずキャレットを移動します。
6. ダイアログやメニューが開いている間、IME 変換中、修飾キーを押している間は、矢印は何もしません。

## 7. トラブルシューティング

| 症状 | 対処 |
| --- | --- |
| `dsh` が見つからない | 公式 DSH CLI をインストールするか有効化してください。 |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | そのバージョンをプロファイルの `pnpm-workspace.yaml` の `minimumReleaseAgeExclude` に追加してください。 |
| 矢印キーが何もしない | 行が合成されていることを確認してからページをリロードしてください — リスナーはブラウザ側のハーフにあります。 |
| キーの動作がインストール前と同じ | プロファイルが再起動されていないか、ページがリロードされていません。 |
| 切り替え後に何もスクロールしない | 折りたたまれたワークスペースグループやレール折りたたみのサイドバーでは想定どおりです。README の既知の制限を参照してください。 |
| 矢印が動かなくなった | プラグインを削除してください (`dsh plugin --profile <profile> remove dsh-arrowkey-nav`)。リスナーはプラグインの Cordis エフェクトが所有しており、それとともに削除されます。 |

## 8. 削除

```bash
dsh plugin --profile <profile> remove dsh-arrowkey-nav
```

プロファイルを再起動すれば、キーはインストール前とまったく同じ動作になります。

## ライセンス

MIT
