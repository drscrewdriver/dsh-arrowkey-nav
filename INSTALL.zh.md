# 安装指南（官方 DSH CLI）

本指南只使用官方 `dsh plugin` 命令。该命令会把依赖装入 profile 并同步 `dsh.profile.bundles`。请勿改用裸 `npm install`、在 profile 里直接 `pnpm add`，或手工编辑 profile 清单。

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

本指南中的占位符：

- `<profile>`：要改动的 DSH profile，通常是 `web`；
- `dsh-arrowkey-nav`：npm 包名，同时也是运行时插件 ID。

> **支持的 DSH 范围：`>=0.1.2-rc.1 <0.2.0-0`。**
>
> README 将本插件钉在 `dsh 0.1.2-rc.1`：它读取的 `sessions` 与 `workspaces` 快照字段属于 pre-stable。安装前先用 `dsh --version` 确认当前版本。

## 0. 前置条件与 profile 探查

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

请使用正在运行的 DSH 进程所使用的那个 profile。`web` 很常见，但以实际生效的 `--profile` 参数为准。

## 1. 官方安装

```bash
dsh plugin --profile <profile> add dsh-arrowkey-nav -w
```

（当 profile 是 pnpm workspace 根时，如 `web`，`-w` 是必需的。）

显式安装指定版本：

```bash
dsh plugin --profile <profile> add dsh-arrowkey-nav@0.1.0 -w
```

官方 CLI 会自动更新 profile 依赖、锁文件与 `dsh.profile.bundles`。不要手工添加 YAML 行。

### 供应链冷却期

DSH 运行时使用 pnpm 11，其 `minimumReleaseAge` 策略可能拦截刚发布的版本并报 `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`。把该版本加入 `~/.dsh/profiles/<profile>/pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude`：

```yaml
minimumReleaseAgeExclude:
  - dsh-arrowkey-nav@0.1.0
```

## 2. 重启 profile 并刷新页面

本插件同时提供宿主与浏览器两个半身，而键盘监听器位于浏览器半身。**必须重启 profile**——运行中的实例不会热加载新的 bundle 层——**随后刷新 `http://127.0.0.1:3080`**。只重启不刷新，页面仍在运行旧的客户端包。

## 3. 升级

```bash
dsh plugin --profile <profile> update dsh-arrowkey-nav -w
```

升级后重启 profile 并刷新页面。

## 4. 本地路径注册（备选）

用于开发或离线安装，可从本地检出注册：

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-arrowkey-nav -w
```

源码检出必须先构建才能注册：`npm run build` 会由 `src/client` 重新生成 `lib/client.js`。构建需要 `typescript`；若该包内未安装，可用 `DSH_TYPESCRIPT` 指向一个已有的 `typescript` 模块目录。发布时由 `prepublishOnly` 钩子自动构建。

```bash
npm run typecheck   # 两个编译面
npm test            # resolver 单测 + 已构建产物的冒烟测试
npm run build       # 改动 src/client 后重新生成 lib/client.js
```

## 5. 校验安装

```bash
grep -n "dsh-arrowkey-nav" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-arrowkey-nav/package.json').version"
```

检查官方装配：

```bash
dsh --profile <profile> --dump-default-config
```

其中必须包含：

```yaml
- id: dsh-arrowkey-nav
  name: dsh-arrowkey-nav
```

## 6. 验证插件

刷新页面后确认：

1. `↑` / `↓` 在当前工作区内切换到上/下一个会话，到两端会回绕且不会跨入相邻工作区。
2. `←` / `→` 在工作区之间切换。
3. 切换后目标行会滚动进入视野。
4. 输入框为空时按方向键会导航，且焦点仍留在输入框，可立即继续输入。
5. 输入框已有草稿时，方向键用于移动光标，不再导航。
6. 对话框或菜单打开时、输入法组词期间、或按住修饰键时，方向键不生效。

## 7. 故障排查

| 现象 | 处理 |
| --- | --- |
| 找不到 `dsh` | 安装或启用官方 DSH CLI。 |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | 把该版本加入该 profile 的 `pnpm-workspace.yaml` 中的 `minimumReleaseAgeExclude`。 |
| 方向键无反应 | 先确认装配行存在，再刷新页面——监听器在浏览器半身。 |
| 按键行为与安装前一样 | profile 未重启，或页面未刷新。 |
| 切换后没有滚动 | 折叠的工作区分组或收窄的侧边栏属预期；见 README 的「已知限制」。 |
| 想彻底恢复原状 | 卸载插件（`dsh plugin --profile <profile> remove dsh-arrowkey-nav`）；监听器由插件的 Cordis effect 持有，会随之移除。 |

## 8. 卸载

```bash
dsh plugin --profile <profile> remove dsh-arrowkey-nav
```

重启 profile 后，按键行为与安装前完全一致。

## 许可

MIT
