// Content-Security-Policy. Permissive on script/style (the app uses inline styles and
// Next/stellar-sdk need eval/wasm) but locks down framing, base-uri and the network
// allowlist (Stellar RPC/Horizon, the OZ Channels relayer, Supabase, Mercury).
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
  "connect-src 'self' https://*.stellar.org https://channels.openzeppelin.com https://*.supabase.co wss://*.supabase.co https://*.mercurydata.app",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Allow WebAuthn (Face ID) for same-origin; deny the rest.
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), publickey-credentials-get=(self), publickey-credentials-create=(self)",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Run instrumentation.ts (server-boot env validation). Stable in Next 15; flag-gated in 14.2.
  // Build-time fail-closed lives in `scripts/check-env.mjs` (wired into the `build` script) so it
  // never fires during `next dev` / `next lint`.
  experimental: { instrumentationHook: true },
  // passkey-kit and stellar-wallets-kit ship untranspiled TS — let Next compile them.
  transpilePackages: [
    "passkey-kit",
    "passkey-kit-sdk",
    "sac-sdk",
    "@creit.tech/stellar-wallets-kit",
  ],
  // passkey-kit / stellar-sdk are browser-oriented; keep them out of server bundling edges
  webpack: (config, { webpack }) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    // stellar-sdk v14 `/minimal/bindings/config.js` does a top-level
    // require("../../package.json") for contract-bindings CODEGEN metadata that's never used at
    // runtime, and the relative path doesn't resolve under webpack (no lib/package.json). It's
    // pulled into the client via passkey-kit's `@stellar/stellar-sdk/minimal` import. Ignore it.
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /package\.json$/,
        contextRegExp: /@stellar[\\/]stellar-sdk[\\/]lib[\\/]minimal[\\/]bindings/,
      })
    );
    return config;
  },
};
export default nextConfig;
