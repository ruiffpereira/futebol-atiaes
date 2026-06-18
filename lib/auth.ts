// Autenticação simples por cookie assinado (HMAC). Sem base de dados.
import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'dev-inseguro-muda-me';

export function makeToken(): string {
  const payload = Buffer.from(JSON.stringify({ role: 'admin', iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}

export function verifyToken(token?: string | null): boolean {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expect = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect)); }
  catch { return false; }
}

export function checkPassword(pw: string): boolean {
  const real = process.env.ADMIN_PASSWORD || 'atiaes';
  // comparação de tempo ~constante
  const a = Buffer.from(pw || ''); const b = Buffer.from(real);
  if (a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(a, b); } catch { return false; }
}
