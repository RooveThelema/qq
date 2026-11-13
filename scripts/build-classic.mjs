import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC_ROOT = path.join(ROOT, 'src');
const memeDir = path.join(ROOT, 'memes');
const memeFiles = fs.existsSync(memeDir) ? fs.readdirSync(memeDir, { withFileTypes: true }).filter(entry => entry.isFile() && /\.(mp4|webm|mov|m4v|ogv|jpg|jpeg|png|gif|webp|avif)$/i.test(entry.name)).map(entry => ({ type: /\.(mp4|webm|mov|m4v|ogv)$/i.test(entry.name) ? 'video' : 'image', src: './memes/' + encodeURIComponent(entry.name) })) : [];
fs.writeFileSync(path.join(ROOT, 'memes.json'), JSON.stringify({ memes: memeFiles }, null, 2));
const ENTRY = path.join(SRC_ROOT, 'main.js');
const OUT_FILE = path.join(SRC_ROOT, 'bundle.classic.js');

const ordered = [];
const visited = new Set();

function toModId(absPath) {
  return path.relative(ROOT, absPath).replace(/\\/g, '/');
}

function collect(filePath) {
  const norm = path.resolve(filePath);
  if (visited.has(norm)) return;
  visited.add(norm);

  const code = fs.readFileSync(norm, 'utf8');
  const importRe = /^import\s+\{[^}]+\}\s+from\s+['"]([^'"]+)['"];?\s*$/gm;
  let m;
  while ((m = importRe.exec(code)) !== null) {
    const target = path.resolve(path.dirname(norm), m[1]);
    collect(target);
  }
  ordered.push({ id: toModId(norm), path: norm, code });
}

collect(ENTRY);

function transformModule(mod) {
  const dir = path.dirname(mod.path);
  let body = mod.code;

  body = body.replace(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?\s*$/gm, (_, specifiers, rel) => {
    const depId = toModId(path.resolve(dir, rel));
    const fixed = specifiers.replace(/\s+as\s+/g, ': ');
    return `const {${fixed}} = __require('${depId}');`;
  });

  const exportNames = [];
  body = body.replace(/^export\s+const\s+([A-Za-z0-9_$]+)/gm, (_, name) => {
    exportNames.push(name);
    return `const ${name}`;
  });
  body = body.replace(/^export\s+function\s+([A-Za-z0-9_$]+)/gm, (_, name) => {
    exportNames.push(name);
    return `function ${name}`;
  });
  body = body.replace(/^export\s+class\s+([A-Za-z0-9_$]+)/gm, (_, name) => {
    exportNames.push(name);
    return `class ${name}`;
  });

  const exportFooter = exportNames.map((n) => `__exports.${n} = ${n};`).join(' ');
  return `  __modules['${mod.id}'] = function(__exports, __require) {\n${body}\n${exportFooter}\n  };`;
}

const chunks = ordered.map(transformModule).join('\n\n');
const bundle = `/* Автоматически сгенерированный classic-бандл для file:// fallback */\n(function() {\n  if (window.__BLINOV_BOOTED__) return;\n  const __modules = Object.create(null);\n  const __cache = Object.create(null);\n  function __require(id) {\n    if (__cache[id]) return __cache[id].exports;\n    const mod = { exports: {} };\n    __cache[id] = mod;\n    if (!__modules[id]) throw new Error('Classic bundle missing module: ' + id);\n    __modules[id](mod.exports, __require);\n    return mod.exports;\n  }\n\n${chunks}\n\n  __require('src/main.js');\n})();\n`;

fs.writeFileSync(OUT_FILE, bundle, 'utf8');
console.log(`Built ${path.relative(ROOT, OUT_FILE)} (${ordered.length} modules, ${bundle.length} bytes)`);
