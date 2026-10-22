// Verificação rápida: arquivos locais referenciados existem, âncoras e ícones resolvem
// e o JS tem sintaxe válida. Uso: npm run check
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const errors = [];

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const dupes = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]).filter((id, i, all) => all.indexOf(id) !== i);
dupes.forEach((id) => errors.push(`id duplicado: ${id}`));

for (const [, attr, value] of html.matchAll(/\s(src|href)="([^"]+)"/g)) {
  if (/^(https?:|mailto:|tel:)/.test(value)) continue;
  if (value.startsWith('#')) {
    if (!ids.has(value.slice(1))) errors.push(`${attr}="${value}" aponta para id inexistente`);
    continue;
  }
  if (!existsSync(resolve(ROOT, value))) errors.push(`${attr}="${value}" não encontrado`);
}

for (const file of ['js/main.js', 'scripts/serve.mjs']) {
  try {
    execFileSync(process.execPath, ['--check', resolve(ROOT, file)], { stdio: 'pipe' });
  } catch (err) {
    errors.push(`sintaxe inválida em ${file}: ${err.stderr}`);
  }
}

const css = ['css/tokens.css', 'css/base.css', 'css/sections.css', 'css/form.css'];
for (const file of css) {
  const src = readFileSync(resolve(ROOT, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const open = (src.match(/{/g) || []).length;
  const close = (src.match(/}/g) || []).length;
  if (open !== close) errors.push(`chaves desbalanceadas em ${file} (${open} { / ${close} })`);
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log('✓ referências, âncoras, JS e CSS ok');
