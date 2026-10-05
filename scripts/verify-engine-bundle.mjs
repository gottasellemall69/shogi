import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const trace = path.resolve('.next/server/pages/api/engine.js.nft.json');
const { files } = JSON.parse(await readFile(trace, 'utf8'));
const resolved = files.map((file) => path.resolve(path.dirname(trace), file));
for (const file of ['engines/linux/YaneuraOu', 'engines/linux/libonnxruntime.so.1',
  'engines/linux/build.json', 'engines/eval/model-0000225kai.onnx']) {
  if (!resolved.includes(path.resolve(file))) throw new Error(`Engine file missing from function bundle: ${file}`);
}
if (resolved.some((file) => /engines[/\\].*\.(?:exe|dll)$/.test(file))) throw new Error('Windows binary leaked into Linux function.');
let bytes = 0;
for (const file of resolved) bytes += (await stat(file)).size;
if (bytes > 240 * 1024 * 1024) throw new Error(`Engine function exceeds the conservative 240 MiB packaging budget: ${bytes}`);
console.log(`Engine function trace verified: ${(bytes / 1024 / 1024).toFixed(1)} MiB, native engine, shared library and model included.`);
for (const route of ['index', 'login', 'api/engine-session']) {
  const filename = path.resolve(`.next/server/pages/${route}.js.nft.json`);
  const { files: routeFiles } = JSON.parse(await readFile(filename, 'utf8'));
  if (routeFiles.some((file) => path.resolve(path.dirname(filename), file).startsWith(path.resolve('engines') + path.sep))) {
    throw new Error(`Native assets must not be bundled into the ${route} function.`);
  }
}
const credentials = [process.env.SITE_PASSWORD, process.env.ENGINE_ACCESS_SECRET].filter(Boolean);
async function verifyClientDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await verifyClientDirectory(filename);
    else if (/\.(?:js|json|html)$/.test(filename)) {
      const content = await readFile(filename, 'utf8');
      if (credentials.some((value) => content.includes(value))) throw new Error('A credential was found in client assets; refusing to deploy.');
    }
  }
}
if (credentials.length) await verifyClientDirectory('.next/static');
console.log('Private page and sign-in traces verified; credentials remain server-only.');
