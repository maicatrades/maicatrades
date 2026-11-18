// Keeps the copied review project read-only even with ordinary npm build/start/dev.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const name of ['.env.production.local', '.env.development.local']) {
  const file = path.join(root, name);
  let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const key = /^\s*(?:export\s+)?MAICATRADES_READ_ONLY_PREVIEW\s*=.*$/gm;
  text = key.test(text) ? text.replace(key, 'MAICATRADES_READ_ONLY_PREVIEW=true') : text.trimEnd() + '\nMAICATRADES_READ_ONLY_PREVIEW=true\n';
  fs.writeFileSync(file, text, 'utf8');
}
console.log('Read-only preview enabled for production-build and development commands. Existing environment values were preserved.');
