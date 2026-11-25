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
const ortVersion = '1.22.0';

const modelAsset = {
  name: 'dlshogi_with_gct_wcsc31.zip',
  url: 'https://github.com',
  sha256: 'b0ff64355b8358355881a66a7d1cfbe3f405de4dc88446e7e0e1d6b6fdbedd50',
};
const windowsAsset = {
  name: 'YaneuraOu-Deep-ORT-CPU_V940.7z',
  url: 'https://github.com',
  sha256: '4644817205817e2c59c549e45771f0b811fbf0d0b03c48e3178d4aac7bc0f28d',
};
const sourceAsset = {
  name: 'yaneuraou-source.tar.gz',
  url: `https://github.com{sourceCommit}`,
  sha256: '4d40f46372b7979ecbb33acf8587473f2740ffd0a0480d27fbb13fb41f6d52a3',
};
<<<<<<< HEAD

// Replace with your own fork/tag or a Debian/archive tarball URL containing v1.22.0 headers
const ortHeadersAsset = {
  name: `onnxruntime-src-${ortVersion}.tar.gz`,
  url: `https://debian.org{ortVersion}+dfsg.orig.tar.xz`,
  sha256: '', // Optional: populate after first run to enforce strict pinning
};

=======
const runtimeAsset = {
  name: 'ort-linux.tgz',
  url: 'https://github.com/microsoft/onnxruntime/releases/download/v1.22.0/onnxruntime-linux-x64-1.22.0.tgz',
  sha256: '8344d55f93d5bc5021ce342db50f62079daf39aaafb5d311a451846228be49b3',
};

>>>>>>> parent of 5f36011 (Update setup-engine.mjs)
async function sha256(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}

async function resolvePyPiWheel(version) {
  const metaUrl = `https://pypi.org{version}/json`;
  const res = await fetch(metaUrl, { headers: { 'User-Agent': 'Shogi-App-Engine-Setup/1.0' } });
  if (!res.ok) throw new Error(`PyPI metadata lookup failed: HTTP ${res.status}`);
  const data = await res.json();
  const wheel = data.urls.find(
    (u) => u.packagetype === 'bdist_wheel' && u.filename.includes('manylinux') && u.filename.endsWith('x86_64.whl')
  );
  if (!wheel) throw new Error(`No Linux x86_64 wheel found on PyPI for onnxruntime ${version}`);
  return {
    name: wheel.filename,
    url: wheel.url,
    sha256: wheel.digests.sha256,
  };
}

async function download(asset) {
  const filename = path.join(cache, asset.name);
  if (existsSync(filename) && (!asset.sha256 || await sha256(filename) === asset.sha256)) return filename;
  console.log(`Downloading ${asset.name}...`);
  const response = await fetch(asset.url, {
    headers: { 'User-Agent': 'Shogi-App-Engine-Setup/1.0' },
    signal: AbortSignal.timeout(300000),
  });
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status} (${asset.url})`);
  const temporary = `${filename}.partial`;
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
  if (asset.sha256 && await sha256(temporary) !== asset.sha256) {
    throw new Error(`Checksum mismatch for ${asset.name}; refusing to extract.`);
  }
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
  const wheelExtract = path.join(build, 'ort-wheel');
  const runtime = path.join(build, `onnxruntime-linux-x64-${ortVersion}`);

  await mkdir(build, { recursive: true });
  await mkdir(linux, { recursive: true });
  await mkdir(wheelExtract, { recursive: true });
  await mkdir(path.join(runtime, 'include'), { recursive: true });
  await mkdir(path.join(runtime, 'lib'), { recursive: true });

  // 1. Download YaneuraOu source
  run('tar', ['xzf', await download(sourceAsset), '-C', build]);

  // 2. Download & extract libonnxruntime.so + licenses from PyPI wheel
  const wheelAsset = await resolvePyPiWheel(ortVersion);
  const wheelPath = await download(wheelAsset);
  run('unzip', ['-o', wheelPath, 'onnxruntime/capi/libonnxruntime.so*', 'onnxruntime/LICENSE', 'onnxruntime/ThirdPartyNotices.txt', '-d', wheelExtract]);

  const soFilename = `libonnxruntime.so.${ortVersion}`;
  await copyFile(path.join(wheelExtract, 'onnxruntime/capi', soFilename), path.join(runtime, 'lib', soFilename));
  await copyFile(path.join(wheelExtract, 'onnxruntime/LICENSE'), path.join(runtime, 'LICENSE'));
  await copyFile(path.join(wheelExtract, 'onnxruntime/ThirdPartyNotices.txt'), path.join(runtime, 'ThirdPartyNotices.txt'));

  // 3. Download & extract C/C++ session headers from source tarball
  const headersTar = await download(ortHeadersAsset);
  run('tar', [
    '-xf', headersTar,
    '-C', path.join(runtime, 'include'),
    '--strip-components=5',
    '--wildcards', '*/include/onnxruntime/core/session/*.h',
  ]);

  const source = path.join(build, `YaneuraOu-${sourceCommit}`);

  // Limit ONNX Runtime inference threads to 1
  const ortFile = path.join(source, 'source/eval/deep/nn_onnx_runtime.cpp');
  const upstream = await readFile(ortFile, 'utf8');
  const marker = 'session_options.SetExecutionMode(ORT_SEQUENTIAL);';
  if (!upstream.includes(marker)) throw new Error('Pinned ONNX thread patch no longer applies.');
  await writeFile(
    ortFile,
    upstream.replace(marker, `${marker}\n\t\tsession_options.SetIntraOpNumThreads(1);\n\t\tsession_options.SetInterOpNumThreads(1);`)
  );

  // Compile YaneuraOu
  run(
    'make',
    [
      '-j2',
      'YANEURAOU_EDITION=YANEURAOU_ENGINE_DEEP_ORT_CPU',
      'COMPILER=g++',
      'TARGET_CPU=SSE2',
      'TARGET=YaneuraOu',
      `EXTRA_CPPFLAGS=-I${runtime}/include`,
      `EXTRA_LDFLAGS=-L${runtime}/lib`,
      'all',
    ],
    { cwd: path.join(source, 'source') }
  );

  await copyFile(path.join(source, 'source/YaneuraOu'), path.join(linux, 'YaneuraOu'));
  await chmod(path.join(linux, 'YaneuraOu'), 0o755);

  // Copy real files for both loader names so Vercel file tracing never depends on symlinks
  for (const name of ['libonnxruntime.so.1', soFilename]) {
    await copyFile(path.join(runtime, 'lib', soFilename), path.join(linux, name));
  }

  await copyFile(path.join(source, 'LICENSE'), path.join(linux, 'YaneuraOu-LICENSE.txt'));
  await copyFile(path.join(runtime, 'LICENSE'), path.join(linux, 'ONNXRuntime-LICENSE.txt'));
  await copyFile(path.join(runtime, 'ThirdPartyNotices.txt'), path.join(linux, 'ONNXRuntime-ThirdPartyNotices.txt'));

  // Extract NNUE/DL model
  run('unzip', ['-o', await download(modelAsset), 'model-0000225kai.onnx', '-d', path.join(destination, 'eval')]);

  await writeFile(
    path.join(linux, 'build.json'),
    JSON.stringify(
      {
        version: '9.40',
        sourceCommit,
        target: 'SSE2',
        onnxRuntime: ortVersion,
        inferenceThreads: 1,
        patch: 'SetIntraOpNumThreads(1); SetInterOpNumThreads(1);',
        assets: [sourceAsset, wheelAsset, ortHeadersAsset, modelAsset],
        builtAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  // Run smoke test
  run(process.execPath, ['scripts/engine-smoke.mjs'], {
    env: { ...process.env, SMOKE_PLIES: '2', YANEURAOU_REQUEST_SCOPED: '1' },
  });
}

async function installWindows() {
  const sevenZip = [
    process.env.SEVEN_ZIP_PATH,
    'C:/Program Files/7-Zip/7z.exe',
    'C:/Program Files (x86)/7-Zip/7z.exe',
    '7z.exe',
  ]
    .filter(Boolean)
    .find((candidate) => spawnSync(candidate, ['i'], { windowsHide: true, stdio: 'ignore' }).status === 0);
  if (!sevenZip) throw new Error('Install 7-Zip or set SEVEN_ZIP_PATH to its 7z.exe, then rerun setup.');
  run(sevenZip, ['x', await download(windowsAsset), `-o${destination}`, '-y']);
  run(sevenZip, ['x', await download(modelAsset), 'model-0000225kai.onnx', `-o${path.join(destination, 'eval')}`, '-y']);
  await writeFile(
    path.join(destination, 'installation.json'),
    JSON.stringify(
      {
        engine: 'YaneuraOu / FukauraOu v9.40 ORT-CPU',
        assets: [windowsAsset, modelAsset],
        installedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
}

try {
  if (process.arch !== 'x64' || !['linux', 'win32'].includes(process.platform)) {
    throw new Error('Automatic setup requires Windows or Linux x64.');
  }
  await mkdir(cache, { recursive: true });
  await mkdir(path.join(destination, 'eval'), { recursive: true });
  if (process.platform === 'linux') await installLinux();
  else await installWindows();
  console.log('YaneuraOu v9.40 and model installed successfully.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
