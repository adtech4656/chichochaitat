import { useMemo } from 'react';
import { cn } from '../lib/utils';

/**
 * Abstract map surface.
 *
 * A real Mapbox GL canvas needs a token and network access, so this renders a
 * restrained vector stand-in: roads, blocks, water, and projected pins. It
 * honours the same contract a Mapbox overlay would (markers with lat/lng), so
 * swapping implementations later is a drop-in change.
 *
 * TODO(maps): replace the <svg> body with a Mapbox GL JS instance using
 * NEXT/MAPBOX_TOKEN and the same `markers` prop.
 */
export default function MapCanvas({
    markers = [],
    accuracy = false,
    className,
    height = 'h-72',
    caption,
}) {
    const projected = useMemo(() => {
        if (markers.length === 0) return [];

        const lats = markers.map((marker) => marker.lat);
        const lngs = markers.map((marker) => marker.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        // Keep a single marker centred instead of pinning it to a corner.
        const padLat = maxLat - minLat || 0.01;
        const padLng = maxLng - minLng || 0.01;

        return markers.map((marker) => ({
            ...marker,
            x: 18 + ((marker.lng - (minLng - padLng * 0.35)) / (padLng * 1.7)) * 64,
            y: 82 - ((marker.lat - (minLat - padLat * 0.35)) / (padLat * 1.7)) * 64,
        }));
    }, [markers]);

    return (
        <div className={cn('relative overflow-hidden rounded-[1.35rem] ring-1 ring-white/10', height, className)}>
            <div className="absolute inset-0 bg-[#0b1016]" />

            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <defs>
                    <pattern id="map-grid" width="26" height="26" patternUnits="userSpaceOnUse">
                        <path d="M26 0H0V26" fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
                    </pattern>
                    <linearGradient id="map-water" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(102,187,106,0.10)" />
                        <stop offset="100%" stopColor="rgba(102,187,106,0.02)" />
                    </linearGradient>
                </defs>

                <rect width="400" height="260" fill="url(#map-grid)" />

                {/* Lagoon */}
                <path
                    d="M-10 205 C 60 190, 90 225, 150 214 S 265 176, 300 196 S 380 232, 410 218 L 410 270 L -10 270 Z"
                    fill="url(#map-water)"
                />

                {/* Arterial roads */}
                <path d="M-10 96 C 70 88, 120 118, 196 108 S 320 66, 410 84" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" strokeLinecap="round" />
                <path d="M132 -10 C 140 60, 118 110, 138 168 S 160 232, 152 270" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" strokeLinecap="round" />
                <path d="M268 -10 C 258 54, 282 122, 262 186 S 250 236, 258 270" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" strokeLinecap="round" />

                {/* Blocks */}
                {[
                    [42, 40, 54, 34], [116, 40, 62, 34], [214, 34, 44, 40], [286, 44, 58, 30],
                    [46, 126, 48, 40], [112, 128, 58, 36], [292, 120, 52, 38],
                ].map(([x, y, w, h], index) => (
                    <rect
                        key={index}
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        rx="5"
                        fill="rgba(255,255,255,0.028)"
                        stroke="rgba(255,255,255,0.045)"
                    />
                ))}
            </svg>

            {/* Pins */}
            {projected.map((marker) => (
                <div
                    key={marker.id ?? `${marker.lat}-${marker.lng}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                >
                    {accuracy && marker.primary && (
                        <>
                            <span className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 animate-[pulse-ring_2.6s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full bg-neon/20" />
                            <span className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neon/15" />
                        </>
                    )}

                    <span
                        className={cn(
                            'relative block h-3 w-3 rounded-full ring-2 ring-void',
                            marker.primary ? 'bg-neon shadow-[0_0_18px_rgba(102,187,106,0.8)]' : 'bg-body/50',
                        )}
                    />

                    {marker.label && (
                        <span className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded-full bg-void/85 px-2 py-0.5 text-[0.625rem] font-medium text-heading ring-1 ring-white/12 backdrop-blur">
                            {marker.label}
                        </span>
                    )}
                </div>
            ))}

            {caption && (
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-full bg-void/75 px-3 py-1.5 backdrop-blur-md ring-1 ring-white/10">
                    <span className="flex items-center gap-1.5 text-[0.625rem] font-medium text-body">
                        <span className="h-1.5 w-1.5 rounded-full bg-neon" />
                        {caption}
                    </span>
                    <span className="text-[0.625rem] text-faint">Map data placeholder</span>
                </div>
            )}
        </div>
    );
}
