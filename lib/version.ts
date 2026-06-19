// Versão da app, definida no build (ver next.config.mjs → env.APP_VERSION).
// Usada para cache-busting de ícones, manifest e service worker.
export const APP_VERSION = process.env.APP_VERSION || 'dev';
