// 在 http://127.0.0.1:3080 的 DevTools Console 里粘这一段（只读，不改任何状态）
(async () => {
  const ID = 'dsh-arrowkey-nav';
  const boot = window.__DSH_BOOT__;

  // 1) 我的三个 inject 目标是否也进了 boot 表？缺任何一个 → 我的插件会永远 PENDING
  const wanted = [
    '@deepseek-ai/dsh-api-session-controller',
    '@deepseek-ai/dsh-api-workspace-controller',
    '@deepseek-ai/dsh-client-ui-workspace',
  ];
  const ids = new Set(boot.entries.map(e => e.id));
  console.log('inject 目标是否都在 boot 表:',
    Object.fromEntries(wanted.map(w => [w, ids.has(w)])));

  // 2) 脚本能否真的取回来（404/500 会在这里暴露）
  const row = boot.entries.find(e => e.id === ID);
  try {
    const res = await fetch(row.url.replace('/plugins/??', '/plugins/').replace('&rev=', '?rev='));
    const text = await res.text();
    console.log('bundle 取回:', res.status, text.length, 'chars',
      '| 含 __ModuleLoader__:', text.includes('__ModuleLoader__'),
      '| 含 exports.apply:', text.includes('exports.apply'));
  } catch (err) {
    console.log('bundle 取回失败:', err);
  }

  // 3) 监听器到底有没有挂上：在 document 上探一次按键
  const seen = [];
  const probe = (e) => { if (String(e.key).startsWith('Arrow')) seen.push(e.key); };
  document.addEventListener('keydown', probe, true);
  console.log('已装探针：接下来 5 秒内按几下方向键…');
  await new Promise(r => setTimeout(r, 5000));
  document.removeEventListener('keydown', probe, true);
  console.log('按键是否到达 document:', seen.length ? seen.join(',') : '（一个都没到 → 按键被上层吞了）');

  // 4) DOM 锚点取证（只读）：插件 constants.ts 里每个选择器在当前版本的命中数
  const anchors = {
    'sidebar.workspaces slot': '[data-slot="sidebar.workspaces"]',
    'any data-slot（列前 10 个值）': '[data-slot]',
    'tree 容器': '[role="tree"]',
    '工作区组头（aria-expanded）': 'div[role="treeitem"][aria-expanded]',
    '会话行（aria-selected）': 'div[role="treeitem"][aria-selected]',
    'composer 输入面': '[data-composer-input]',
    'contenteditable（任意）': '[contenteditable="true"], [contenteditable=""]',
    '会话滚动容器': '[data-conversation-scroll]',
  };
  const anchorReport = Object.fromEntries(Object.entries(anchors).map(([label, sel]) => {
    try {
      const hits = document.querySelectorAll(sel);
      if (label.includes('data-slot（')) {
        return [label, [...new Set([...hits].map(n => n.getAttribute('data-slot')))].slice(0, 10)];
      }
      return [label, hits.length];
    } catch { return [label, '选择器错误']; }
  }));
  console.log('DOM 锚点命中情况:', anchorReport);

  // 5) 服务快照取证：需要插件已加载（listener attached 日志出现后）。
  //    插件会在 window 上挂只读访问器：
  console.log('服务快照取证: 在控制台执行 __dshArrowkeyNav.snapshot()');
  try {
    console.log('（当前结果）', window.__dshArrowkeyNav?.snapshot?.() ?? '访问器不存在 → 插件未激活或旧版 bundle');
  } catch (err) {
    console.log('snapshot() 抛错:', err);
  }
})();
