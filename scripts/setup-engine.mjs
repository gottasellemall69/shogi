import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { chmod, copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = path.join(root, '.cache');
const destination = path.join(root, 'engines');
const sourceCommit = '717da871e7a620702b8b9433bd8f9f181710435a';
const modelAsset = {
  name: 'dlshogi_with_gct_wcsc31.zip',
  url: 'https://github.com/TadaoYamaoka/DeepLearningShogi/releases/download/wcwc31/dlshogi_with_gct_wcsc31.zip',
  sha256: 'b0ff64355b8358355881a66a7d1cfbe3f405de4dc88446e7e0e1d6b6fdbedd50',
};
const windowsAsset = {
  name: 'YaneuraOu-Deep-ORT-CPU_V940.7z',
  url: 'https://github.com/yaneurao/YaneuraOu/releases/download/v9.40/YaneuraOu-Deep-ORT-CPU_V940.7z',
  sha256: '4644817205817e2c59c549e45771f0b811fbf0d0b03c48e3178d4aac7bc0f28d',
};
const sourceAsset = {
  name: 'yaneuraou-source.tar.gz',
  url: `https://codeload.github.com/yaneurao/YaneuraOu/tar.gz/${sourceCommit}`,
  sha256: '4d40f46372b7979ecbb33acf8587473f2740ffd0a0480d27fbb13fb41f6d52a3',
};
const runtimeAsset = {
  name: 'ort-linux.tgz',
  url: 'https://github.com/microsoft/onnxruntime/releases/download/v1.22.0/onnxruntime-linux-x64-1.22.0.tgz',
  sha256: '8344d55f93d5bc5021ce342db50f62079daf39aaafb5d311a451846228be49b3',
};

async function sha256(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}
async function download(asset) {
  const filename = path.join(cache, asset.name);
  if (existsSync(filename) && await sha256(filename) === asset.sha256) return filename;
  console.log(`Downloading ${asset.name} from its official repository...`);
  const response = await fetch(asset.url, { headers: { 'User-Agent': 'Shogi-App-Engine-Setup/1.0' }, signal: AbortSignal.timeout(300000) });
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
  const temporary = `${filename}.partial`;
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
  if (await sha256(temporary) !== asset.sha256) throw new Error(`Checksum mismatch for ${asset.name}; refusing to extract.`);
  await rename(temporary, filename);
  return filename;
}
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, windowsHide: true, stdio: 'inherit', ...options });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message || result.status}`);
}
async function installLinux() {
  const build = path.join(cache, 'engine-build');
  const linux = path.join(destination, 'linux');
  await mkdir(build, { recursive: true });
  await mkdir(linux, { recursive: true });
  run('tar', ['xzf', await download(sourceAsset), '-C', build]);
  run('tar', ['xzf', await download(runtimeAsset), '-C', build]);
  const source = path.join(build, `YaneuraOu-${sourceCommit}`);
  const runtime = path.join(build, 'onnxruntime-linux-x64-1.22.0');
  // Upstream defaults to one ORT worker per physical core. Limit inference as well
  // as USI search threads, to avoid consuming the entire host or Hobby CPU quota.
  const ortFile = path.join(source, 'source/eval/deep/nn_onnx_runtime.cpp');
  const upstream = await readFile(ortFile, 'utf8');
  const marker = 'session_options.SetExecutionMode(ORT_SEQUENTIAL);';
  if (!upstream.includes(marker)) throw new Error('Pinned ONNX thread patch no longer applies.');
  await writeFile(ortFile, upstream.replace(marker, `${marker}\n\t\tsession_options.SetIntraOpNumThreads(1);\n\t\tsession_options.SetInterOpNumThreads(1);`));
  // Compile on the deployment's Linux distribution, avoiding newer local glibc
  // dependencies. SSE2 runs on the x64 baseline; do not use -march=native.
  run('make', ['-j2', 'YANEURAOU_EDITION=YANEURAOU_ENGINE_DEEP_ORT_CPU', 'COMPILER=g++',
    'TARGET_CPU=SSE2', 'TARGET=YaneuraOu', `EXTRA_CPPFLAGS=-I${runtime}/include`,
    `EXTRA_LDFLAGS=-L${runtime}/lib`, 'all'], { cwd: path.join(source, 'source') });
  await copyFile(path.join(source, 'source/YaneuraOu'), path.join(linux, 'YaneuraOu'));
  await chmod(path.join(linux, 'YaneuraOu'), 0o755);
  // Copy real files for both loader names so tracing never depends on symlinks.
  for (const name of ['libonnxruntime.so.1', 'libonnxruntime.so.1.22.0']) {
    await copyFile(path.join(runtime, 'lib/libonnxruntime.so.1.22.0'), path.join(linux, name));
  }
  await copyFile(path.join(source, 'LICENSE'), path.join(linux, 'YaneuraOu-LICENSE.txt'));
  await copyFile(path.join(runtime, 'LICENSE'), path.join(linux, 'ONNXRuntime-LICENSE.txt'));
  await copyFile(path.join(runtime, 'ThirdPartyNotices.txt'), path.join(linux, 'ONNXRuntime-ThirdPartyNotices.txt'));
  // bsdtar is preinstalled on Vercel; unzip is available on common Linux distros.
  run('unzip', ['-o', await download(modelAsset), 'model-0000225kai.onnx', '-d', path.join(destination, 'eval')]);
  await writeFile(path.join(linux, 'build.json'), JSON.stringify({ version: '9.40', sourceCommit,
    target: 'SSE2', onnxRuntime: '1.22.0', inferenceThreads: 1, patch: 'SetIntraOpNumThreads(1); SetInterOpNumThreads(1);',
    assets: [sourceAsset, runtimeAsset, modelAsset], builtAt: new Date().toISOString() }, null, 2));
  // Fail the deployment before publishing if the native loader or model fails.
  run(process.execPath, ['scripts/engine-smoke.mjs'], { env: { ...process.env, SMOKE_PLIES: '2', YANEURAOU_REQUEST_SCOPED: '1' } });
}
async function installWindows() {
  const sevenZip = [process.env.SEVEN_ZIP_PATH, 'C:/Program Files/7-Zip/7z.exe', 'C:/Program Files (x86)/7-Zip/7z.exe', '7z.exe']
    .filter(Boolean).find((candidate) => spawnSync(candidate, ['i'], { windowsHide: true, stdio: 'ignore' }).status === 0);
  if (!sevenZip) throw new Error('Install 7-Zip or set SEVEN_ZIP_PATH to its 7z.exe, then rerun setup.');
  run(sevenZip, ['x', await download(windowsAsset), `-o${destination}`, '-y']);
  run(sevenZip, ['x', await download(modelAsset), 'model-0000225kai.onnx', `-o${path.join(destination, 'eval')}`, '-y']);
  await writeFile(path.join(destination, 'installation.json'), JSON.stringify({
    engine: 'YaneuraOu / FukauraOu v9.40 ORT-CPU', assets: [windowsAsset, modelAsset], installedAt: new Date().toISOString(),
  }, null, 2));
}
try {
  if (process.arch !== 'x64' || !['linux', 'win32'].includes(process.platform)) throw new Error('Automatic setup requires Windows or Linux x64.');
  await mkdir(cache, { recursive: true });
  await mkdir(path.join(destination, 'eval'), { recursive: true });
  if (process.platform === 'linux') await installLinux(); else await installWindows();
  console.log('YaneuraOu v9.40 and model installed successfully.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
