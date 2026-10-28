
import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL;
const csrfToken = import.meta.env.VITE_X_CSRF_TOKEN;

export const api = axios.create({
  // URL de base de l'API FastAPI
  baseURL: apiBaseUrl,
  timeout: 60_000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(csrfToken && {
      "X-CSRF-TOKEN": csrfToken,
    }),
  },
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);
