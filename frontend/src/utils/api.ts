import axios, { AxiosError } from "axios";

type ApiErrorBody = {
  error?: string;
  message?: string;
  errors?: string[];
};

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const baseURL = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && window.location.pathname !== "/") {
      window.location.assign("/");
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const body = error.response?.data as ApiErrorBody | undefined;
  if (body?.error) {
    return body.error;
  }
  if (body?.message) {
    return body.message;
  }
  if (body?.errors?.length) {
    return body.errors.join(", ");
  }

  return fallback;
}

export default api;
