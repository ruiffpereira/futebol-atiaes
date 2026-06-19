import { execSync } from 'node:child_process';

// Versão da app para cache-busting (ícones, manifest, service worker).
// Localmente usa o hash do commit; no Docker (sem .git) cai no timestamp do
// build → cada deploy gera uma versão nova e obriga o Chrome a re-descarregar.
let appVersion;
try {
  appVersion = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {
  appVersion = String(Date.now());
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // gera um servidor Node mínimo em .next/standalone (ideal p/ Docker)
  env: { APP_VERSION: appVersion },
};
export default nextConfig;
