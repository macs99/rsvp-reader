// 青空文庫の外字注記（第3水準1-87-71 など）を Unicode の文字に置き換えるための表 gaiji.json を作る。
// 元の表：Project X0213「JIS X 0213:2004 vs Unicode mapping table」（自由に使用・改変・再配布してよいとの条件）
//   http://x0213.org/codetable/jisx0213-2004-std.txt
// 使い方: node build-gaiji.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SRC = 'http://x0213.org/codetable/jisx0213-2004-std.txt';
const here = dirname(fileURLToPath(import.meta.url));
const text = await (await fetch(SRC)).text();

const map = {};
for (const line of text.split('\n')) {
  // 例: 3-7767	U+728D	# <cjk>	[2000]
  const m = line.match(/^([34])-([0-9A-F]{2})([0-9A-F]{2})\s+(U\+[0-9A-F+U]+)\s.*\[(2000|2004)\]/);
  if (!m) continue;
  const plane = m[1] === '3' ? 1 : 2;
  const row = parseInt(m[2], 16) - 0x20, cell = parseInt(m[3], 16) - 0x20;
  const ch = m[4].split('+').filter((x) => x && x !== 'U').map((h) => String.fromCodePoint(parseInt(h, 16))).join('');
  map[`${plane}-${row}-${cell}`] = ch;
}
const out = join(here, '..', 'gaiji.json');
writeFileSync(out, JSON.stringify({ source: SRC, license: 'Copyright (C) 2001 earthian@tama.or.jp / I\'O, (C) 2006, 2009 Project X0213. You can use, modify, distribute this table freely.', map }));
console.log(`${Object.keys(map).length}字 → ${out}`);
console.log('1-87-71 =', map['1-87-71']);
