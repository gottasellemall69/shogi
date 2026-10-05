import { readFile, stat } from 'node:fs/promises';
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
