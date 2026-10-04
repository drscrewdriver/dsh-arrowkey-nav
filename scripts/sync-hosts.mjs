// 默认只校验；--write 从 hosts.mjs 单一事实源同步发布元数据与 README。
// 历史 CHANGELOG 不参与生成。受管写入点：package.json（peerDependencies /
// engines.dsh）、dsh.plugin.json（engines.dsh + 版本镜像）、九份 README 的
// `engines.dsh: …` 令牌。键集合属于手工面，值一律由本脚本下发，禁止手改。
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { peerRange, peerRanges, assertHostPeers } from './hosts.mjs';

const write = process.argv.includes('--write');

async function managed(url, transform, repair) {
  const original = await readFile(url, 'utf8');
  const expected = transform(original);
  if (write) {
    if (original !== expected) await writeFile(url, expected);
  } else {
    assert.equal(original, expected, repair);
  }
}

// package.json：peer 值 + engines.dsh，且 peer 一律必需（optional 会把漏线从
// “拒装”退化成“静默缺服务”）。
const manifestUrl = new URL('../package.json', import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
assertHostPeers(manifest.peerDependencies);
assert.equal(manifest.peerDependenciesMeta, undefined, 'peerDependenciesMeta 必须删除：peer 一律必需');
await managed(
  manifestUrl,
  (original) => {
    const expected = JSON.parse(original);
    for (const [name, range] of Object.entries(peerRanges)) expected.peerDependencies[name] = range;
    expected.engines.dsh = peerRange;
    return `${JSON.stringify(expected, null, 2)}\n`;
  },
  'package.json 与 hosts.mjs 不一致；运行 node scripts/sync-hosts.mjs --write',
);

// dsh.plugin.json：engines.dsh + 版本镜像（manifest 版本漂移的历史教训）。
const dshPluginUrl = new URL('../dsh.plugin.json', import.meta.url);
await managed(
  dshPluginUrl,
  (original) => {
    const expected = JSON.parse(original);
    expected.engines.dsh = peerRange;
    expected.version = manifest.version;
    return `${JSON.stringify(expected, null, 2)}\n`;
  },
  'dsh.plugin.json 与 hosts.mjs/package.json 不一致；运行 node scripts/sync-hosts.mjs --write',
);

// 九份 README 各含一个反引号包裹的 engines.dsh 令牌（“快照字段 pre-stable”注）。
const readmeLanguages = ['', '.zh', '.ja', '.ko', '.fr', '.de', '.it', '.ru', '.es'];
for (const language of readmeLanguages) {
  const url = new URL(`../README${language}.md`, import.meta.url);
  await managed(
    url,
    (original) => {
      const pattern = /`engines\.dsh: [^`]+`/g;
      const matches = original.match(pattern);
      assert(matches !== null && matches.length === 1, `README${language}.md 缺少或含多个 engines.dsh 令牌`);
      return original.replace(pattern, `\`engines.dsh: ${peerRange}\``);
    },
    `README${language}.md 的 engines.dsh 令牌需要同步；运行 node scripts/sync-hosts.mjs --write`,
  );
}
