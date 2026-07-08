const API = process.env.NEXT_PUBLIC_API_URL || "";
/** URL gambar publik (QRIS/artikel/landing) untuk <img src>. */
export const publicMediaUrl = (p?: string | null) => (p ? `${API}/api/v1/public-media/${p}` : null);