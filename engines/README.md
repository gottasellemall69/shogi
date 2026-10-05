# Native engine files

Run `npm run engine:setup`. Windows x64 receives the official v9.40 executable/DLLs; Linux x64 builds the pinned v9.40 ORT-CPU source with g++/make and installs its shared libraries, licenses and build manifest under `linux/`. Both use the checksum-verified WCSC31 model under `eval/`.

Vercel performs setup automatically during its build, then checks the native protocol/model and function packaging. See [deployment instructions](../docs/vercel.md). All generated files are ignored by Git and never served from `public/`.
