import type { AuthMode, AuthenticationResponse, AuthenticationData, LogoutResponse } from '../types/auth.types';
import type { GetMeResponse } from '../types/user.types';
import type { UserResponse } from '../types/user.types';
import { api } from '@/shared/services/apiService';
import { supabase } from '@/shared/lib/supabase';
import { useCryptoSessionStore } from '@/store/useCryptoSessionStore';
//import { useCryptoStore } from '@/store/useCryptoStore';
import { fetchPublicKey, fetchCsrfToken } from '@/shared/services/cryptoService';
import { encryptPayload, decryptServerResponse, type EncryptedPayload } from '@/shared/services/hybridCrypto';
import { encryptToken, decryptToken, clearToken } from '@/shared/services/EncrypdecrypToten';
import { refreshAccessToken } from '@/shared/services/authService';


export async function getCsrfToken(): Promise<string> {
  const cookie = document.cookie.split(';').map((item) => item.trim())
    .find((item) => item.startsWith('csrf_token='));
  const token = cookie ? decodeURIComponent(cookie.slice('csrf_token='.length)) : null;
  return token || fetchCsrfToken();
}



function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<EncryptedPayload>;
  return typeof payload.encrypted_key === 'string' && !!payload.encrypted_key
    && typeof payload.encrypted_data === 'string' && !!payload.encrypted_data
    && typeof payload.iv === 'string' && !!payload.iv;
}


export async function signIn(
  email: string,
  password: string
): Promise<AuthenticationResponse<AuthenticationData>> {

  const response = await api.post<AuthenticationResponse<AuthenticationData>>(
    "/auth/login/",
    {
      username: email,
      password,
    }
  );

  const result = response.data;
  
  if (!result.success || result.code===401) {
    throw new Error(result.message || "Échec de la connexion.");
  }

  const accessStorageKey = "access_token";
  const refreshStorageKey = "refresh_token";

  await encryptToken(
    result.data.access_token,
    accessStorageKey
  );

  await encryptToken(
    result.data.refresh_token,
    refreshStorageKey
  );

  return result;
}


export async function deconnexion(): Promise<LogoutResponse> {

  const accessToken = await decryptToken("access_token");
  const refreshToken = await decryptToken("refresh_token");

  if (!accessToken) {
    throw new Error("Token d'accès absent ou invalide.");
  }

  const response = await api.post<LogoutResponse>(
    "/auth/logout/",
    {
      refresh_token: refreshToken,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      withCredentials: true,
    }
  );

  await clearToken("access_token");
  await clearToken("refresh_token");

  return response.data;
}


export async function getMe(): Promise<GetMeResponse> {

  const headers: Record<string, string> = {};

  const accessStorageKey = "access_token";
  const accessToken = await decryptToken(accessStorageKey);

  if (!accessToken) {
    throw new Error("Token d'accès absent ou invalide.");
  }

  headers.Authorization = `Bearer ${accessToken}`;
 
  const response = await api.get<GetMeResponse>(
    "/auth/me/",
    {
      withCredentials: true,
      headers,
    }
  );
  
  if ( response.data.code === 401 || response.data.success===false ) {
    await refreshAccessToken()
    return await getMe()
  }

  return response.data;
}



export async function signUp(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials') || message.includes('status code 401')) return 'Email ou mot de passe incorrect.';
  if (message.includes('User already registered')) return 'Un compte existe déjà avec cet email.';
  if (message.includes('Password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  return message;
}

export async function submitAuth(mode: AuthMode, email: string, password: string) {
  return mode === 'signin' ? signIn(email, password) : signUp(email, password);
}
