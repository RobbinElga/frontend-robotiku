"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Opts = { title?: string; description?: string; confirmText?: string; variant?: "default" | "destructive" };
const Ctx = createContext<(o?: Opts) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<{ open: boolean; opts: Opts }>({ open: false, opts: {} });
    const resolver = useRef<(v: boolean) => void>(() => { });

    const confirm = useCallback((opts: Opts = {}) =>
        new Promise<boolean>((res) => { resolver.current = res; setState({ open: true, opts }); }), []);
    const close = (v: boolean) => { resolver.current(v); setState((s) => ({ ...s, open: false })); };

    return (
        <Ctx.Provider value={confirm}>
            {children}
            <Dialog open={state.open} onOpenChange={(o) => !o && close(false)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>{state.opts.title ?? "Konfirmasi"}</DialogTitle></DialogHeader>
                    {state.opts.description && <p className="text-sm text-muted-foreground">{state.opts.description}</p>}
                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="outline" onClick={() => close(false)}>Batal</Button>
                        <Button variant={state.opts.variant === "destructive" ? "destructive" : "default"} onClick={() => close(true)}>{state.opts.confirmText ?? "Ya, lanjut"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Ctx.Provider>
    );
}