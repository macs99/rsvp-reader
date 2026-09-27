// 合格条件3・4を数える。index.html の <script id="core"> をそのまま読み込んで使う。
// 使い方: cd tools && npm install && node check.mjs [txt または zip のパス] [最小文字数] [最大文字数]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { loadDefaultJapaneseParser } from 'budoux';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, '..', 'index.html'), 'utf8');
const core = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const ctx = { module: {}, TextDecoder };
vm.runInNewContext(core, ctx);
const Core = ctx.module.exports;

const file = process.argv[2] || join(here, '..', 'texts', 'kumo_no_ito.txt');
const minLen = Number(process.argv[3] || 3), maxLen = Number(process.argv[4] || 12);
const text = Core.decode(readFileSync(file));
const gaiji = JSON.parse(readFileSync(join(here, '..', 'gaiji.json'), 'utf8')).map;
const paragraphs = Core.cleanAozora(text, gaiji);
const body = paragraphs.join('\n');

console.log(`対象: ${file}`);
console.log(`\n[合格条件3] 変換後の本文に残った記号の件数`);
let ok3 = true;
for (const s of ['《', '》', '｜', '［＃', '※']) {
  const n = body.split(s).length - 1;
  if (n) ok3 = false;
  console.log(`  ${s}: ${n}件`);
}
console.log(`  → ${ok3 ? '合格（すべて0件）' : '不合格'}`);
const gaijiIn = (text.match(/※［＃[^］]*］/g) || []).length;
const named = (body.match(/犍陀多/g) || []).length;
console.log(`  外字注記 ${gaijiIn}件 → 「犍陀多」として表示 ${named}件`);

for (const [name, segment] of [['BudouX', ((p) => (x) => p.parse(x))(loadDefaultJapaneseParser())], ['簡易分割', Core.fallbackSplit]]) {
  const units = Core.buildUnits(paragraphs, { minLen, maxLen, segment });
  const counted = units.filter((u) => !Core.isPunctOnly(u.text));
  const short = counted.filter((u) => u.len <= 2);
  const long = units.filter((u) => u.len > maxLen);
  const pct = (short.length / counted.length * 100).toFixed(2);
  const lost = units.map((u) => u.text).join('') !== paragraphs.join('');
  console.log(`\n[合格条件4] ${name}（最小${minLen}字・最大${maxLen}字）`);
  console.log(`  表示単位 ${units.length}個（句読点のみの単位 ${units.length - counted.length}個は除外）`);
  console.log(`  2字以下 ${short.length}個 = ${pct}%  → ${pct <= 5 ? '合格（5%以下）' : '不合格'}`);
  console.log(`  最大文字数超え ${long.length}個、最長 ${Math.max(...units.map((u) => u.len))}字、本文の欠落 ${lost ? 'あり' : 'なし'}`);
  if (short.length) console.log(`  2字以下の例: ${short.slice(0, 15).map((u) => u.text).join(' / ')}`);
  console.log(`  冒頭30単位:`);
  units.slice(0, 30).forEach((u, i) => console.log(`    ${String(i + 1).padStart(2)} ${u.text}`));
}
