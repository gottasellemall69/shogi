# Shogi with YaneuraOu v9.40

A Next.js Pages Router app for local Shogi play against YaneuraOu or another person. Both players can move and drop pieces, choose promotion, undo/redo, review and export games. Sente is uppercase, at the bottom, and moves first.

## Run on Windows

Requirements: Windows x64, an AVX2/BMI2-capable CPU, Node.js 22, and [7-Zip](https://www.7-zip.org/). The CPU engine needs no GPU. Use `npm.cmd` in PowerShell if execution policy blocks `npm.ps1`.

```powershell
npm.cmd ci
npm.cmd run engine:setup
npm.cmd run engine:check
npm.cmd run dev
```

Open http://127.0.0.1:3000. The engine and model are already installed in this working copy. On a new checkout, `engine:setup` downloads them from their official releases, checks pinned SHA-256 values, and extracts them under `engines/`. Set `SEVEN_ZIP_PATH` if 7-Zip is installed elsewhere. Downloads are cached in `.cache/`. Binaries and model weights are ignored by Git.

For production mode locally:

```powershell
npm.cmd run build
npm.cmd start
```

## Engine and model

The requested [YaneuraOu v9.40 release](https://github.com/yaneurao/YaneuraOu/releases/tag/v9.40) is FukauraOu, the deep-learning edition. The installed executable identifies itself as `FukauraOu ORT_CPU-DL 9.40git 64AVX2BMI2`. The release supplies the engine and ONNX Runtime DLLs; it does not supply a neural model.

Setup pairs it with `model-0000225kai.onnx` from the official [dlshogi with GCT WCSC31 release](https://github.com/TadaoYamaoka/DeepLearningShogi/releases/tag/wcwc31). This is an older trained model, configured with `dlshogi-WCSC28` architecture. Model age and CPU search speed affect playing strength. Only the model is extracted from that archive; the runtime DLLs and executable always come from v9.40. Downloads stay outside `public/` and are never sent to the browser. See [upstream model notes](https://tadaoyamaoka.hatenablog.com/entry/2021/05/05/121233), [YaneuraOu source/license](https://github.com/yaneurao/YaneuraOu/tree/v9.40), and [engine installation guidance](https://github.com/yaneurao/YaneuraOu/wiki/%E3%81%B5%E3%81%8B%E3%81%86%E3%82%89%E7%8E%8B%E3%81%AE%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB%E6%89%8B%E9%A0%86).

Copy `.env.example` to `.env.local` to use another compatible build/model. Settings are server-only:

| Variable | Default |
| --- | --- |
| `YANEURAOU_ENGINE_PATH` | `engines/YaneuraOu-Deep-ORT-CPU.exe` |
| `YANEURAOU_ENGINE_CWD` | directory containing the executable |
| `YANEURAOU_EVAL_DIR` | `eval` under that working directory |
| `YANEURAOU_MODEL` | `model-0000225kai.onnx` |
| `YANEURAOU_MODEL_ARCHITECTURE` | `dlshogi-WCSC28` |

TensorRT/DirectML builds may be configured with their required runtimes and a compatible model; only the CPU configuration is verified here. Restart Next.js after changing these settings.

## How the integration works

`pages/api/engine.js` validates a complete USI move history by replaying it through `lib/shogi.js` before the server sends `position startpos moves ...`. The shared rules cover movement, pins/check, both promotion variants, mandatory promotion, captures/demotion, nifu, dead-rank drops, pawn-drop mate, defensive drops, fourfold repetition and perpetual check. A 27-point entering-king declaration is available when its conditions are met. Shogi's no-legal-moves condition is a loss, not a chess-style stalemate draw.

`lib/engine.js` manages `usi`/`usiok`, model options, `isready`/`readyok`, `usinewgame`, timed search and `bestmove`. Search results are checked for legality before reaching the client. Local mode reuses an idle process; Vercel mode starts and reaps a child for each search. One process handles one request at a time; concurrent requests receive 429 instead of mixing positions. Abort, crash, timeout and idle cleanup terminate the child, and later requests restart it. Local initialization has a 60-second limit; hosted initialization has a 15-second limit and a shorter bounded search grace period. The search tree is limited to 100,000 nodes, with one search thread and batch size 1 for CPU use.

`hooks/useShogiGame.js` cancels requests on reset, navigation and mode changes. A revision guard also rejects stale replies. Undo/redo advance one ply and pause the AI until Resume; playing a human move starts a new branch. Replay always disables play and AI. The engine never silently falls back to the old browser AI.

HTML is dynamically rendered with a fresh script CSP nonce per response. Images use `unoptimized`. There is no third-party client service or API key.

## Vercel Hobby and Linux hosting

Deploy directly to Vercel Hobby using [the deployment guide](docs/vercel.md). The build compiles the exact v9.40 source for Linux, packages ONNX Runtime and the model, plays two smoke-test moves, and verifies the Next.js function trace. Set a private `ENGINE_ACCESS_SECRET` in Vercel, then unlock AI in the app. No separate engine server is required. Hosted searches are limited to one second and every child is stopped before its request completes.

On Linux x64, `npm run engine:setup` requires g++, make, tar and unzip. The default executable is `engines/linux/YaneuraOu`; the default model directory is `engines/eval`. On Windows, the official prebuilt executable and DLLs remain supported. Local scripts bind to loopback. Public hosting needs the access key and Vercel Firewall rule described in the guide. Tournament clocks, handicap setup, and negotiated impasse/draw adjudication are not implemented.

## Verification

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run engine:check
npm.cmd run engine:compare
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd run test:hosted
```

Browser tests use a production server on port 3100 and require a completed build plus installed engine/model. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can point to an existing Chromium executable. Tests cover real engine play, captures/promotion/drops, undo/redo/replay/export, cancelled replies, API rejection cases and mobile layout. The deterministic rule comparison checks every legal move against YaneuraOu across five games, including captures, drops and promotion.

See [the code review](docs/code-review.md) for original defects and remaining findings.
