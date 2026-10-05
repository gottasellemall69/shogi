# Deploy on Vercel Hobby

This app runs its own Linux YaneuraOu v9.40 CPU engine inside a Node.js function. No separate engine server, GPU, database, paid integration, or browser engine is required. The repository builds the native engine during deployment; do not upload the Windows executable.

## Deploy

1. Import the repository into a Vercel project with **Next.js** as the framework and **Node.js 22.x**. Keep Fluid Compute enabled. `vercel.json` supplies `npm ci` and `npm run vercel-build`; remove any old dashboard build override. Do not choose static export or Edge runtime.
2. Add **ENGINE_ACCESS_SECRET** to both Preview and Production environment variables. Use a random value of at least 32 characters. Generate one locally with:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Save it in your password manager. Enter this same value into **Engine access key** in the app. The server exchanges it for an eight-hour HttpOnly, Secure, SameSite=Strict cookie. It never enters local storage or the JavaScript bundle. Rotating the environment variable and redeploying invalidates existing sessions. Missing or weak configuration disables hosted AI; local two-player play still works.
3. In the project's **Firewall**, add its Hobby rate-limit rule: path starts with `/api/engine`, method `POST`, fixed window **20 requests per 60 seconds**, count by **IP**, action **Rate Limit / HTTP 429**. Publish the rule. It covers both searches and the unlock endpoint before they reach compute. This is account configuration; it cannot be created by committing `vercel.json`. The app additionally throttles each running instance, but that alone does not cover all scaled instances.
4. Deploy a preview. Open it, unlock AI, move a pawn, and confirm the reply. Choose Gote to check that AI makes the first move. Promote the verified preview when ready.

Do **not** carry Windows `YANEURAOU_*` path overrides into Vercel. Only `ENGINE_ACCESS_SECRET` is required; `YANEURAOU_REQUEST_SCOPED=1` is supplied by `vercel.json`. The build itself does not need or print the access key. Files in `engines/` and `.cache/` are generated and ignored; include all application/configuration/scripts changes in your commit.

## What the build verifies

`npm run vercel-build` performs these steps on Linux x64:

1. Download and SHA-256 verify YaneuraOu commit `717da871e7a620702b8b9433bd8f9f181710435a` (v9.40), Microsoft ONNX Runtime 1.22.0, and the WCSC31 `model-0000225kai.onnx` archive.
2. Build the ORT-CPU edition using `g++` and `make`, targeting the SSE2 build rather than the build machine's native CPU. Compilation on Vercel uses its own glibc/toolchain. Vercel's Amazon Linux 2023 build image supplies the compiler, tar, and unzip.
3. Apply one documented source adjustment: ONNX intra-op and inter-op threads are both set to one. USI also uses one search thread, batch size one, a 100,000-node tree cap, and no pondering or opening book.
4. Load the Linux executable and model and play two legal moves, starting/stopping a fresh child for each operation. A loader, model, or protocol failure fails the deployment build.
5. Run the Next.js production build. Trace only the Linux executable, runtime libraries, model and notices into `/api/engine`. Check that every required artifact is present, Windows binaries are absent, and the traced function stays below a conservative 240 MiB budget.

The native engine and model stay outside `public/`. Their licenses/notices and a source/build manifest accompany the function. The reproducible build script records the precise source adjustment. Model provenance and strength limitations are described in the main README.

## Runtime limits

- Hosted searches allow 100–1,000 ms of thinking time; the UI offers 0.25 and 1 second. Cold model initialization, validation, and teardown add wall time. Local persistent play retains the longer choices.
- Every request contains the complete validated game history. Correctness does not depend on a warm function, process, or local disk state.
- One native operation runs per function instance. Overlap returns 429 with `Retry-After`. Scaling creates independent instances, never shared game positions.
- The native child is killed and reaped before a search response completes. Model initialization and search have separate timeouts; the API has a 30-second cancellation deadline and Vercel a 60-second function limit. Disconnects cancel active native work when delivered by the runtime; the deadlines still bound work if cancellation is not forwarded.
- Health checks verify installed files without starting the engine. Only authenticated searches perform inference. Hosted access is required even if Vercel's system environment variables are disabled.
- The app's throttle is **per instance**, and the WAF rule is **per IP**. Neither is a global monthly compute quota. Keep the key private and monitor project usage; do not advertise this as an unrestricted public analysis API.

Hobby is for personal, non-commercial projects. Its documented allowance currently includes 4 active CPU hours and 360 GB-hours of provisioned memory per month. This engine uses that allowance; cold starts and Next.js work also count. One second of search is not a promise of one billable CPU second. Usage exhaustion can pause the project until its allowance resets.

## Local checks

On Windows, `npm run test:hosted` starts the production app with hosted limits and a test-only access key. It checks anonymous rejection, actual browser unlock/cookies, native moves, time validation and overlapping requests. Build the app first. The normal `npm run test:e2e` retains local persistent-engine coverage.

For a Linux clean-room check, copy the sources into an isolated directory, use Node 22, install `g++`, `make`, `tar`, and `unzip`, then run:

```sh
npm ci
npm run vercel-build
npm test
```

Use `HOSTED_TEST_URL` and `HOSTED_TEST_SECRET` to run the hosted browser suite against a separately running test server. A protected Vercel preview may require your account's automation bypass separately. Never use production credentials in committed test files.

A clean Linux Node 22 install completed the exact Vercel build command and all 26 unit tests. The function trace was 70.2 MiB. All three hosted browser tests also passed against the Linux server. A fresh one-second search took 2,791 ms including startup, with 173.5 MiB peak engine RSS plus 49.4 MiB for the Node benchmark parent. Use `npm run engine:benchmark` on Linux to repeat that local measurement; it is not a guarantee of cloud latency or billed CPU.

This repository has been checked locally on Windows and Linux. It has not been deployed into your Vercel account; your preview is the final check of account settings and Vercel-specific cold-start performance.

References: [Vercel build image](https://vercel.com/docs/builds/build-image), [function limits](https://vercel.com/docs/functions/limitations), [Hobby allowances](https://vercel.com/docs/plans/hobby), [WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).
