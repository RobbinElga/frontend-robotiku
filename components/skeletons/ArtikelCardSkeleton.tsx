"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function ArtikelCardSkeleton() {
    return (
        <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-[0_12px_40px_-12px_rgba(37,99,235,0.15)]">
            <Skeleton height={192} borderRadius={0} />
            <div className="p-6">
                <Skeleton width={80} height={12} className="mb-2" />
                <Skeleton height={18} count={2} className="mb-1" />
                <Skeleton height={12} count={2} className="mt-3" />
                <Skeleton width={120} height={14} className="mt-4" />
            </div>
        </div>
    );
}

export function ArtikelGridSkeleton() {
    return (
        <SkeletonTheme baseColor="#E5E7EB" highlightColor="#f3f4f6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                    <ArtikelCardSkeleton key={i} />
                ))}
            </div>
        </SkeletonTheme>
    );
}