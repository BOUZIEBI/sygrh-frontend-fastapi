const STORAGE_KEY = 'encrypted_token';

async function getKey(): Promise<CryptoKey> {
  if (!window.isSecureContext || !window.crypto?.subtle) {
    throw new Error('Le chiffrement nécessite HTTPS en production (ou localhost en développement).');
  }
  const secret = import.meta.env.SECRET_KEY;
  if (!secret) {
    throw new Error('SECRET_KEY est absente du build React. Configurez-la sur Railway puis reconstruisez et redéployez le frontend.');
  }
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return window.crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

function decode(value: string): ArrayBuffer {
  const binary = window.atob(value);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return buffer;
}

/** Chiffre le token et stocke uniquement l’enveloppe chiffrée. */
export async function encryptToken(token: string, storageKey = STORAGE_KEY): Promise<void> {
  if (!token) throw new Error('Le token est vide.');
  const key = await getKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 }, key, new TextEncoder().encode(token),
  );
  localStorage.setItem(storageKey, JSON.stringify({
    version: 1, iv: encode(iv), data: encode(new Uint8Array(ciphertext)),
  }));
}

/** Retourne null si aucun token n’est stocké ; rejette si le déchiffrement échoue. */
export async function decryptToken(storageKey = STORAGE_KEY): Promise<string | null> {
  const stored = localStorage.getItem(storageKey);
  if (stored === null) return null;
  const key = await getKey();
  try {
    const payload = JSON.parse(stored);
    if (!payload || payload.version !== 1 || typeof payload.iv !== 'string' || typeof payload.data !== 'string') {
      throw new Error('Format invalide.');
    }
    const iv = decode(payload.iv);
    if (iv.byteLength !== 12) throw new Error('IV invalide.');
    const plaintext = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 }, key, decode(payload.data),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    clearToken("access_token")
    clearToken("refresh_token")
    throw new Error('Impossible de déchiffrer le token : clé incorrecte ou données altérées.');
  }
}

export function clearToken(storageKey = STORAGE_KEY): void {
  localStorage.removeItem(storageKey);
}

export const EncrypdecrypToten = { encryptToken, decryptToken, clearToken };
export const EncrypdecrypToken = EncrypdecrypToten;
