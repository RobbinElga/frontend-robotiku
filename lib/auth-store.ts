import { create } from "zustand";
import Cookies from "js-cookie";
import { TOKEN_KEY } from "./api";

export type Actor =
    | { kind: "user"; id: number; name: string; role: string }
    | { kind: "school_admin"; id: number; name: string; school_id: number }
    | { kind: "parent"; student_id: number; name: string } // passwordless, tanpa token
    | null;

type AuthState = {
    actor: Actor;
    setSession: (token: string | null, actor: Actor) => void;
    setActor: (actor: Actor) => void;
    clear: () => void;
};

export const useAuth = create<AuthState>((set) => ({
    actor: null,
    setSession: (token, actor) => {
        if (token) {
            // cookie aman: strict + secure (HTTPS) + expiry ~2 jam (Sanctum 120 menit)
            Cookies.set(TOKEN_KEY, token, {
                sameSite: "strict",
                secure: typeof window !== "undefined" && window.location.protocol === "https:",
                expires: 1 / 12,
            });
        }
        set({ actor });
    },
    setActor: (actor) => set({ actor }),
    clear: () => {
        Cookies.remove(TOKEN_KEY);
        set({ actor: null });
    },
}));