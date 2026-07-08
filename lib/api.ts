import axios from "axios";
import Cookies from "js-cookie";

export const TOKEN_KEY = "robotiku_token";

export type ApiEnvelope<T = unknown> = {
    status: boolean;
    data: T;
    message: string;
};

export const api = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
    headers: { Accept: "application/json" },
});

// sisipkan Bearer token tiap request
api.interceptors.request.use((config) => {
    const token = Cookies.get(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// token kedaluwarsa / tidak valid → bersihkan
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (typeof window !== "undefined" && error?.response?.status === 401) {
            Cookies.remove(TOKEN_KEY);
            const path = window.location.pathname;
            // hindari loop di halaman login/publik
            if (path.startsWith("/app") && path !== "/app/login") window.location.replace("/app/login");
            else if (path.startsWith("/sekolah") && path !== "/sekolah/login") window.location.replace("/sekolah/login");
        }
        return Promise.reject(error);
    }
);

// helper ambil pesan error dari format Laravel
export function apiError(err: unknown, fallback = "Terjadi kesalahan."): string {
    if (axios.isAxiosError(err)) {
        return err.response?.data?.message ?? fallback;
    }
    return fallback;
}