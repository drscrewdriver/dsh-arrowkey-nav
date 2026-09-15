# dsh-arrowkey-nav

DSH Web GUI 的方向键导航。不必离开键盘即可切换会话：

| 按键 | 动作 | 范围 |
| --- | --- | --- |
| `↑` | 上一个会话 | 当前工作区内 |
| `↓` | 下一个会话 | 当前工作区内 |
| `←` | 上一个工作区 | 全部工作区 |
| `→` | 下一个工作区 | 全部工作区 |

`↑`/`↓` 在工作区两端回绕，且绝不会跨入相邻工作区；跨区是 `←`/`→` 的职责。切换后目标行会滚动进入视野；若按键时焦点在输入框，焦点会回到输入框，可立即继续输入。

## 安装

```sh
dsh plugin --profile web add dsh-arrowkey-nav -w
```

安装后需重启 profile —— 运行中的实例不会热加载新的 bundle 层。随后刷新 `http://127.0.0.1:3080`。

确认装配行已进入组合树：

```sh
dsh web --dump-config | Select-String dsh-arrowkey-nav
```

也可以改为注册本地检出：
`dsh plugin --profile web add <absolute path to the checkout> -w`；完整指南（升级、校验、卸载）见
[INSTALL.md](./INSTALL.md)。

### 卸载

```sh
dsh plugin --profile web remove dsh-arrowkey-nav
```

重启后，按键行为与安装前完全一致：监听器由插件的 Cordis effect 持有，随之一起移除。

## 实现方式

会话身份来自两个客户端控制器，绝不来自 DOM：会话行不携带 `data-*`，也没有 `id`，因此无法向某一行询问它是哪个会话。

- `ctx.sessions.open(id)` 执行每一次切换。详情面板无需处理：官方框架在会话变化时已经会关闭它。
- `ctx.workspaces.list.getSnapshot()` 提供工作区顺序 —— 即 `←`/`→` 的遍历顺序，以及各工作区成员列表的来源。

**「下一个」会话跟随侧边栏正在绘制的顺序**，而不是控制器的成员顺序。二者恰好会在你能察觉到的场景下不一致：侧边栏会将其自身持久化的顺序与成员关系做协调，并把最近活跃的会话提升到顶部，因此你打开一个旧会话的瞬间，它就会跳到第一行。为此本插件从侧边栏读取渲染后的行顺序，并在侧边栏未挂载时（收窄为侧栏导轨）回退到控制器顺序。仅当一个分区的行能覆盖控制器为该工作区报告的全部会话时，该分区才被接受；含糊或不匹配的分区会选择回退，而不是猜测。

当事件已属于他人时，本插件不碰这些按键：任意修饰键、输入法组词、已被上游处理过的事件，以及焦点位于对话框、菜单或其他可编辑字段（侧边栏的会话搜索框、重命名框）内的情形。监听器注册在捕获阶段，但仅在实际发生导航时才调用 `preventDefault()`。

输入框是唯一有条件的情形。**空输入框会交出方向键** —— 没有光标可移动，按键即空闲 —— 这正是你在刚发出消息、焦点仍在输入框时也能导航的原因。一旦输入框**存在草稿，其方向键就重新归光标所有**，因此编辑提示词永远不会被劫持。

浏览器半身没有 React 组件、没有 CSS，也不请求任何平台模块；本包没有运行时依赖 —— `lib/client.js` 由 `scripts/build-client.mjs` 生成页面所期望的 module-loader 契约。

## 开发

```sh
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

`npm run build` 需要 `typescript`；若本包内未安装，可用 `DSH_TYPESCRIPT` 指向一个已有的 `typescript` 模块目录。

## 已知限制

- **折叠的工作区分组不会滚动。** 其行未被挂载，且 dsh 未公开任何展开分组的方式，因此切换会发生，但目标行留在视野之外。当前会话所在的工作区由 dsh 自身保持展开，所以 `↑`/`↓` 不受影响。
- **收窄为导轨的侧边栏同样不会滚动**，原因相同：树未被挂载。切换仍然会发生。
- **「单一列表」模式**没有工作区分区，但 `←`/`→` 仍按控制器的工作区顺序遍历，因此列表看起来可能在各分区之间跳动。
- **滚动是尽力而为。** 任何查找失败都被吞掉：选中项已经移动，而缺失的行绝不能变成错误的行。
- **钉在 dsh 0.1.2-rc.1。** `sessions` 与 `workspaces` 快照字段属于 pre-stable。若 dsh 升级改变了它们，只需回看 `src/client/navigate.ts` 与 `src/client/apply.ts`；某个服务消失时，本插件会保持 pending，而不会让页面报错。

## 目录结构

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

## 许可

MIT
