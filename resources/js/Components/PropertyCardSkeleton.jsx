/**
 * Glassmorphic shimmer placeholder shown while property data / imagery loads.
 * Mirrors the real card's geometry so the swap is layout-stable (no CLS).
 */
export default function PropertyCardSkeleton({ delay = 0 }) {
    return (
        <div
            className="glass overflow-hidden rounded-[1.5rem]"
            style={{ animationDelay: `${delay}ms` }}
            aria-hidden="true"
        >
            <div className="relative aspect-[4/3] w-full shimmer-surface">
                <div className="absolute left-4 top-4 h-6 w-24 rounded-full bg-white/[0.07]" />
                <div className="absolute right-4 top-4 h-9 w-9 rounded-full bg-white/[0.07]" />
            </div>

            <div className="space-y-3 p-5">
                <div className="h-3 w-28 rounded-full bg-white/[0.07]" />
                <div className="h-5 w-3/4 rounded-full bg-white/[0.09]" />
                <div className="h-3 w-1/2 rounded-full bg-white/[0.06]" />

                <div className="flex items-center justify-between pt-3">
                    <div className="h-6 w-32 rounded-full bg-white/[0.09]" />
                    <div className="h-9 w-9 rounded-full bg-white/[0.07]" />
                </div>
            </div>
        </div>
    );
}
