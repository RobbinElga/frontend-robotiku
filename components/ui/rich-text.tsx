"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, List } from "lucide-react";

export function RichText({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || ""; }, [value]);
    const cmd = (c: string) => { document.execCommand(c, false); ref.current?.focus(); onChange(ref.current?.innerHTML || ""); };

    return (
        <div className="rounded-md border">
            <div className="flex gap-1 border-b bg-muted/30 p-1">
                <button type="button" onClick={() => cmd("bold")} className="rounded p-1.5 hover:bg-muted"><Bold className="h-4 w-4" /></button>
                <button type="button" onClick={() => cmd("italic")} className="rounded p-1.5 hover:bg-muted"><Italic className="h-4 w-4" /></button>
                <button type="button" onClick={() => cmd("insertUnorderedList")} className="rounded p-1.5 hover:bg-muted"><List className="h-4 w-4" /></button>
            </div>
            <div ref={ref} contentEditable onInput={() => onChange(ref.current?.innerHTML || "")} data-ph={placeholder}
                className="min-h-[110px] px-3 py-2 text-sm outline-none [&:empty:before]:text-muted-foreground [&:empty:before]:content-[attr(data-ph)]" />
        </div>
    );
}