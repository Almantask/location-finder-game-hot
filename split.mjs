import { readFileSync, writeFileSync } from 'fs';

const s = readFileSync('locations.js', 'utf8');
const a = s.indexOf('[');
const b = s.lastIndexOf(']');
const arr = JSON.parse(s.slice(a, b + 1));

const ranges = [
  [301, 400], [401, 500], [501, 600], [601, 700], [701, 800],
  [801, 900], [901, 1000], [1001, 1100], [1101, 1200], [1201, 1300],
];

ranges.forEach(([lo, hi], i) => {
  const sub = arr.filter(x => x.id >= lo && x.id <= hi);
  writeFileSync(`chunk${i + 1}.js`, 'export const chunk' + (i + 1) + ' = ' + JSON.stringify(sub, null, 2) + ';\n');
});
console.log('split done');
