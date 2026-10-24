import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'artifacts/api-server/package.json'));
const { build } = require('esbuild');

for (const filename of ['radar-model.test.ts', 'radar-render.test.ts']) {
  const result = await build({
    entryPoints: [path.join(root, 'artifacts/faraway/src/lib', filename)],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    jsx: 'automatic',
    write: false,
    define: { 'import.meta.env': '{}' },
    loader: { '.css': 'empty' },
    alias: { '@': path.join(root, 'artifacts/faraway/src') },
    logLevel: 'silent',
  });
  // Execute the bundled node:test suite without emitting generated files.
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(
    require, { exports: {} }, {},
  );
}
