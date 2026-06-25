import * as crypto from 'crypto';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}