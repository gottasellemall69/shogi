# Code review and integration findings

Reviewed the original tracked application at `e06f05f` and implemented the integration in the working tree. Original line references below refer to that commit, because the affected files have been replaced or reduced.

## Fixed

| Severity | Original location | Reproduction / impact | Resolution |
| --- | --- | --- | --- |
| High | `lib/engine.js:5-34` | Constructor uses comma expressions instead of spawning a process/creating a reader; `_init` references undefined `line`; the initial `usi` command is queued behind readiness; writes target `stdio` rather than `stdin`. No functioning engine connection existed, nor an API route. | Real server-side USI child process, handshake, model configuration, bounded exclusive searches, restart/error handling and API. |
| High | `pages/index.js:1308-1410` | Recursive minimax returns a number but callers read `.score`, yielding undefined/NaN evaluations. The minimizing leaf evaluates from the opposite perspective. Search drops use live hands/current-player state rather than simulated state. | Replaced browser minimax with the requested native engine. |
| High | `pages/index.js:628-685, 886-903` | Capture/drop setters run before king-safety validation, so rejected actions can gain or lose pieces. Quiet-move history adds `" "` to the hand; captured promoted pieces remain promoted in snapshots. | Pure legal move application creates the next board and hands atomically; exactly one captured/dropped piece is updated. |
| High | `pages/index.js:1597-1636` | Undo jumps back three entries and cannot undo early moves. Redo adds `1` to an object, then accesses `boardAfter`, causing a crash; it also restores the wrong hand snapshot. | One-ply cursor over immutable snapshots, exact undo/redo and branch truncation. |
| High | `pages/index.js:1527-1594` | AI work, idle callbacks and delayed move timers are not cancelled. Dependencies contain freshly created functions, rescheduling searches. Thinking clears before the move is committed. Reset/replay/mode switching can receive stale moves. | AbortController cleanup, stable state, revision guards, paused AI during navigation and replay, accurate thinking/error state. |
| High | `pages/index.js:785-826, 954-970` | Checkmate tests only board moves and misses defensive drops. Pawn-drop validation passes a simulated board to a function that ignores it and mutates game-over state during validation. | Pure adjudication considers moves and drops; pawn-drop mate is checked against the resulting position without UI side effects. |
| Medium | `pages/index.js:646-653, 928-970` | Knights are not forced to promote on the penultimate rank. Lance/knight dead-rank drops are accepted. King capture is allowed instead of ending at mate. | Shared promotion/drop restrictions for both sides; kings are never capturable. |
| Medium | `pages/index.js:203, 265-303, 829-852` | Sente/Gote labels and case ownership are reversed. No-legal-moves is treated as a chess stalemate draw. | Standard Sente-first representation and SFEN/USI conversion; no legal moves loses in Shogi. |
| Medium | `pages/index.js:1725-1745, 2307-2347` | Replay at index zero shows the first post-move position; Back displays a position that disagrees with its index. AI can run while reviewing. | Replay uses the same position cursor as undo/redo, including the true initial position. |
| Medium | `lib/game.js`, `lib/openingBook.js`, `lib/generateBoardHash.js` | Unused DOM implementation references missing functions/elements, inconsistent move tables and wrong capture ownership. Opening entries have wrong piece case/coordinates. Board hash omits hands and turn. | Removed dead opening/hash implementations; `lib/game.js` now contains the reducer and `lib/shogi.js` is the sole rules implementation. Position identity includes board, hands and turn. |
| Medium | `package.json`, installed dependencies | Declared Next 15.3.8 differed from installed 15.5.15; lint config was 15.0.2. Dependency audit found vulnerable packages. | Updated Next to 15.5.27 and React; migrated Tailwind to 4.3.3 and ESLint to a flat React/hooks configuration, removing the vulnerable Next lint plugin chain. PostCSS is pinned to 8.5.29. Full and runtime audits now report zero vulnerabilities. |
| Low | `pages/index.js:1747-1780`, repeated desktop/mobile JSX, `styles/globals.css` | CSV uses pipe delimiters and leaks object URLs; UI copies diverge; global image/button rules override component sizing. | Real CSV and structured JSON exports with URL cleanup; one responsive board/hands UI and scoped sizing. |

Development and production now use separate output directories (`.next-dev` / `.next`) after browser testing caught a live dev server overwriting production manifests.

New integration checks cover command injection, illegal histories and returned moves, malformed/method/cross-origin requests, bounded thinking time, process failures, concurrency and cancellation. Native binaries remain server-only. Per-response script nonces protect the dynamically rendered page.

## Remaining findings / scope limits

- **Dependency maintenance:** all seven high audit entries are resolved. The Next ESLint plugin is intentionally omitted because even its current release still depends on the vulnerable `fast-glob` chain. ESLint retains standard JavaScript, React and hooks checks; Next builds emit an informational missing-plugin warning. ESLint 9 is used for React-plugin compatibility and currently emits an upstream support/deprecation notice during installation. No vulnerabilities are reported by the current audit.
- **Hosting and quotas:** the application now builds the pinned Linux engine automatically for Vercel, requires a site password before serving the board or allowing engine API access, caps search time, and reaps each child before returning. See [Vercel setup](vercel.md) for the required environment variables and per-IP Firewall rule. In-process limits do not enforce a global monthly quota. Vercel account deployment remains with the owner.
- **Playing strength and tournament features:** CPU inference with the older WCSC31 model is verified; GPU builds and newer models are configurable but untested. Tournament clocks, handicap setup and negotiated impasse adjudication are absent. This is not a certified tournament rules implementation.

## Verification evidence

Validation completed on Windows x64 with Node 25.9.0/Chromium and on Linux x64 with Node 22.23.3. The hosted browser suite was also run against the clean Linux production server. These are focused regressions plus a native-engine comparison, not an exhaustive proof for every possible Shogi position.


| Check | Result |
| --- | --- |
| `npm run engine:setup` | Passed; pinned archive checksums verified, v9.40 executable/DLLs and WCSC31 model installed. |
| `npm run engine:check` | Passed; six native engine moves validated, engine identified as `FukauraOu ORT_CPU-DL 9.40git 64AVX2BMI2`. |
| `npm run engine:compare` | Passed; identical complete legal-move sets in 881 positions across five games; 178 drops and 69 promotions played. |
| `npm test` | 26 passing rule, history, protocol and process-lifecycle regression tests. |
| `npm run lint` | Passed without warnings or errors. |
| `npm run build` | Passed; dynamic home page and server API built successfully. |
| `npm run test:e2e` | Six passing production-browser/API tests, including real engine play as both sides, captures/promotion/drops, replay/history/export, cancellation, mobile layout and unique CSP nonces. |
| `npm audit` and `npm audit --omit=dev` | Zero vulnerabilities in both the full and runtime dependency trees. |
| `npm run vercel-build` (Linux clean install) | Passed: exact v9.40 source compiled, two real moves validated, Next production build succeeded, native assets verified in a 70.2 MiB function trace. ONNX Runtime requires GLIBC 2.27 / GLIBCXX 3.4.22, below the AL2023 toolchain baseline. |
| `npm run test:hosted` | Three passing hosted browser/API tests on Windows and against the Linux production server: access cookies, native play, short search limits, malformed requests, repeated requests and concurrency. |
| `npm run engine:benchmark` (Linux) | Fresh one-second search: 2,791 ms wall time, 173.5 MiB peak engine RSS, 49.4 MiB Node parent RSS, four total engine threads, child reaped before completion. Local measurements, not Vercel performance guarantees. |
| `npm ls --depth=0` and `git diff --check` | Passed; consistent top-level dependency tree and no whitespace errors. |

Browser artifacts (ignored by Git) are in `test-results/shogi-desktop.png` and `test-results/shogi-mobile.png`; the mobile screenshot intentionally shows the unavailable-engine test case. Production browser checks used an existing local Chromium through `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

The original high-severity code and logic defects listed above are fixed. The previous seven high dependency entries are also resolved. This is a focused review and regression suite, not a claim that every possible defect has been eliminated.

## Private page sign-in

The page now checks the same signed session as the engine API before rendering. Anonymous HTML and Next.js data requests redirect to `/login`; engine GET and POST requests return 401. One shared-password sign-in authorizes the page and automatic engine play. Logout clears the root-scoped HttpOnly cookie; missing production credentials fail closed. `SITE_PASSWORD` is separate from the random `ENGINE_ACCESS_SECRET`; sessions are bound to both, so rotating either invalidates existing cookies. The original engine-only unlock component was removed. Current regressions cover wrong passwords, cookie flags, page/data/API protection, automatic play, logout, expiry, rotation and login throttling.
