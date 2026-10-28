import axios from "axios";

import { deconnexion, getCsrfToken } from '@/features/auth/api/auth.api';
import { api } from "@/shared/services/apiService";
import { clearToken, decryptToken, encryptToken } from "./EncrypdecrypToten";
import { data } from "react-router-dom";

import { forcer_deconnexion } from "@/features/auth/api/auth.api";




export interface RefreshResponse {
  code: number;
  success: boolean;
  access: string;
  refresh: string;
  token_type: "bearer" | string;
  expires_in: number;
  data: unknown | null;
}



export async function refreshAccessToken(): Promise<RefreshResponse> {

  // Récupérer le refresh token enregistré
  const refreshToken = await decryptToken("refresh_token");

  if (!refreshToken) {
    throw new Error("Le refresh token est absent ou invalide.");
  }

  // Appeler Django pour renouveler le token
  const { data } = await api.post<RefreshResponse>(
    "/auth/refresh/",
    {
      refresh: refreshToken,
    },
    {
      withCredentials: true,
      headers: {
        Accept: "application/json",
      },
    }
  );
  
  // Vérifier la réponse
  if (!data?.access || data.code==401) {
    await forcer_deconnexion()
    throw new Error("Impossible de rafraîchir le token.");
  }

  // Enregistrer le nouveau access token
  await encryptToken(
    data.access,
    "access_token"
  );

  // Enregistrer le nouveau refresh token si disponible
  if (data.refresh) {
    await encryptToken(
      data.refresh,
      "refresh_token"
    );
  }

  return data;
}