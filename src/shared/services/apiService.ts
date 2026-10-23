import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL 

export const api = axios.create({
  // En développement, passer par le proxy Vite pour éviter les appels cross-origin.
  baseURL: apiBaseUrl,
  timeout: 60_000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});
