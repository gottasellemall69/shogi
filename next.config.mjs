import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    // Next 15 matches these keys by substring, so exclude the session route.
    '/api/engine(?!-session)': ['./engines/linux/**/*', './engines/eval/model-0000225kai.onnx'],
  },
  outputFileTracingExcludes: {
    '*': ['./.cache/**/*', './.next-dev/**/*', './engines/*.exe', './engines/*.dll'],
  },
};
export default (phase) => ({ ...nextConfig, distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next' });
