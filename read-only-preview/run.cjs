const {spawnSync} = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const command = process.argv[2];
if (!['build', 'start'].includes(command)) throw Error('Use: node .\\read-only-preview\\run.cjs build (or start)');
const root = path.resolve(__dirname, '..');
const adminFile = fs.readFileSync(path.join(root, 'src/lib/supabase.ts'), 'utf8');
if (!adminFile.includes('createPreviewProtectedFetch')) throw Error('Read-only guard is not installed. Stop before adding database credentials.');
const next = require.resolve('next/dist/bin/next', {paths: [root]});
console.log('READ-ONLY PREVIEW: market-record writes blocked; no market records will be captured or updated by this website.');
const args = command === 'build' ? ['build', '--webpack'] : ['start', '--hostname', '127.0.0.1'];
const result = spawnSync(process.execPath, [next, ...args], {cwd: root, stdio: 'inherit', env: {...process.env, MAICATRADES_READ_ONLY_PREVIEW: 'true'}});
if (result.error) {console.error(result.error.message);process.exit(1);}
process.exit(result.status ?? 1);
