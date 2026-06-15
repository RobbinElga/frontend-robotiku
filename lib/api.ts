import axios from "axios";

/**
 * API client RobotiKU.
 * Base URL diambil dari .env.local (NEXT_PUBLIC_API_URL).
 *
 * Catatan keamanan: penyimpanan token sementara pakai localStorage
 * sebagai placeholder. Strategi final (mis. httpOnly cookie) akan kita
 * tetapkan di Tahap 3 (Autentikasi & Keamanan).
 */
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
    headers: {
        Accept: "application/json",
    },
});

// Sisipkan Bearer token pada setiap request (jika ada).
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("robotiku_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;