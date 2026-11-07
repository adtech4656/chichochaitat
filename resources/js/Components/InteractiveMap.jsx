import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { cn } from '../lib/utils';
import { useMoney } from '../lib/money';
import { useTranslation } from '../lib/i18n';
import { ShieldCheckIcon } from './Icons';

/**
 * Interactive GPS-verified Map component powered by Leaflet.
 * Styled with CartoDB Dark Matter tiles to seamlessly integrate with
 * Chic Choc Habitat's obsidian & emerald glassmorphism design system.
 */
export default function InteractiveMap({
    markers = [],
    center,
    zoom = 14,
    height = 'h-80',
    className,
    showVerificationCircle = true,
    caption,
    onMarkerClick,
    onUserLocation,
}) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const userLayerRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [userCoords, setUserCoords] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const { format } = useMoney();
    const { t, locale } = useTranslation();

    // Determine initial center
    const defaultCenter = center || (markers.length > 0 ? [markers[0].lat, markers[0].lng] : [5.3599, -3.9866]);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Initialize Leaflet Map
        const map = L.map(mapContainerRef.current, {
            center: defaultCenter,
            zoom,
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: false,
        });

        mapInstanceRef.current = map;

        // High contrast dark tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
        }).addTo(map);

        // Feature layer for pins
        const markersGroup = L.featureGroup().addTo(map);
        markersLayerRef.current = markersGroup;

        // User layer
        const userGroup = L.featureGroup().addTo(map);
        userLayerRef.current = userGroup;

        // Enable scroll zoom on click/focus
        map.on('focus', () => map.scrollWheelZoom.enable());
        map.on('blur', () => map.scrollWheelZoom.disable());

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Update markers and bounds when props change
    useEffect(() => {
        const map = mapInstanceRef.current;
        const group = markersLayerRef.current;
        if (!map || !group) return;

        group.clearLayers();

        if (markers.length === 0) return;

        markers.forEach((item) => {
            if (!item.lat || !item.lng) return;

            const isPrimary = item.primary || markers.length === 1;

            // Custom HTML Marker matching Chic Choc Habitat brand with touch target
            const formattedPrice = item.price ? format(item.price, item.currency) : '';
            const iconHtml = `
                <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group" style="min-width: 48px; min-height: 48px;">
                    ${isPrimary ? `
                        <span class="absolute h-10 w-10 animate-ping rounded-full bg-emerald-400/35 opacity-75 pointer-events-none"></span>
                        <span class="absolute h-6 w-6 rounded-full border border-emerald-400/60 bg-emerald-500/25 pointer-events-none"></span>
                    ` : ''}
                    <div class="relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-xl transition-all duration-200 group-hover:scale-110 active:scale-95 ${
                        isPrimary
                            ? 'bg-[#090C10] text-[#66BB6A] ring-2 ring-[#66BB6A] shadow-[0_0_15px_rgba(102,187,106,0.4)]'
                            : 'bg-[#0E1319] text-white ring-1 ring-white/20 hover:ring-[#66BB6A] hover:text-[#66BB6A]'
                    }">
                        <span class="h-2 w-2 rounded-full ${isPrimary ? 'bg-[#66BB6A] animate-pulse' : 'bg-white/60'}"></span>
                        <span class="font-bold tracking-tight">${formattedPrice || (item.title || 'GPS')}</span>
                    </div>
                </div>
            `;

            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'cch-map-custom-marker',
                iconSize: [0, 0],
            });

            const marker = L.marker([item.lat, item.lng], { icon: customIcon });

            // Fully responsive, touch-friendly popup tooltip
            const rentSuffix = item.intent === 'rent' ? '<span style="font-size: 10px; font-weight: normal; opacity: 0.8;"> /mois</span>' : '';
            const popupContent = `
                <div style="font-family: system-ui, -apple-system, sans-serif; background: #0E1319; color: #E8F5E9; border-radius: 16px; padding: 12px; width: 240px; max-width: calc(100vw - 48px); border: 1px solid rgba(102, 187, 106, 0.35); box-shadow: 0 20px 40px rgba(0,0,0,0.85); backdrop-filter: blur(12px);">
                    ${item.image ? `
                        <div style="position: relative; width: 100%; height: 115px; border-radius: 10px; overflow: hidden; margin-bottom: 10px; background: #05070A;">
                            <img src="${item.image}" alt="${item.title || ''}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" />
                            <div style="position: absolute; top: 6px; left: 6px; background: rgba(9, 12, 16, 0.85); backdrop-filter: blur(8px); border: 1px solid rgba(102, 187, 106, 0.4); border-radius: 9999px; padding: 2px 7px; font-size: 9px; font-weight: 700; color: #66BB6A; display: flex; items-center: center; gap: 4px;">
                                <span>📍</span>
                                <span>GPS VÉRIFIÉ</span>
                            </div>
                        </div>
                    ` : ''}

                    <div style="margin-bottom: 8px;">
                        <h4 style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin: 0 0 3px 0; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${item.title || 'Propriété Vérifiée'}
                        </h4>
                        <p style="font-size: 11px; color: rgba(165, 214, 167, 0.7); margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${item.location || item.district || 'Abidjan, Côte d’Ivoire'}
                        </p>
                    </div>

                    ${formattedPrice ? `
                        <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08);">
                            <span style="font-size: 14px; font-weight: 800; color: #66BB6A; letter-spacing: -0.01em;">
                                ${formattedPrice}${rentSuffix}
                            </span>
                        </div>
                    ` : ''}

                    ${item.href ? `
                        <a href="${item.href}" style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; background: linear-gradient(135deg, #66BB6A 0%, #43A047 100%); color: #070B0E; font-size: 11px; font-weight: 800; padding: 8px 12px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(102,187,106,0.35); box-sizing: border-box;">
                            <span>Consulter l'annonce</span>
                            <span style="font-size: 12px;">→</span>
                        </a>
                    ` : ''}
                </div>
            `;

            marker.bindPopup(popupContent, {
                className: 'cch-dark-popup',
                closeButton: true,
                offset: [0, -12],
                autoPan: true,
                autoPanPadding: [25, 25],
                maxWidth: 260,
                minWidth: 220,
            });

            marker.on('click', () => {
                map.panTo([item.lat, item.lng], { animate: true, duration: 0.4 });
                if (onMarkerClick) {
                    onMarkerClick(item);
                }
            });

            marker.addTo(group);

            // Verification radar circle around primary item
            if (isPrimary && showVerificationCircle) {
                L.circle([item.lat, item.lng], {
                    radius: 150,
                    color: '#66BB6A',
                    weight: 1,
                    opacity: 0.6,
                    fillColor: '#66BB6A',
                    fillOpacity: 0.07,
                }).addTo(group);
            }
        });

        // Fit bounds if multiple markers, or center on single
        if (markers.length > 1) {
            map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 15 });
        } else if (markers.length === 1) {
            map.setView([markers[0].lat, markers[0].lng], zoom);
        }
    }, [markers, zoom, showVerificationCircle]);

    const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
    const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
    const handleResetCenter = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(defaultCenter, zoom);
        }
    };

    const handleLocateUser = () => {
        if (!navigator.geolocation) {
            alert(locale === 'fr' ? 'La géolocalisation n’est pas disponible.' : 'Geolocation is not available.');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                setUserCoords({ lat: latitude, lng: longitude, accuracy });
                setIsLocating(false);

                const map = mapInstanceRef.current;
                const userGroup = userLayerRef.current;
                if (!map || !userGroup) return;

                userGroup.clearLayers();

                // Live User Marker
                const userIconHtml = `
                    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                        <span class="absolute h-10 w-10 animate-ping rounded-full bg-cyan-400/40 opacity-75"></span>
                        <span class="absolute h-5 w-5 rounded-full border border-cyan-400/80 bg-cyan-500/20"></span>
                        <div class="relative flex items-center gap-1.5 rounded-full bg-[#070b0e] px-2.5 py-1 text-xs font-bold text-cyan-300 ring-2 ring-cyan-400 shadow-2xl">
                            <span class="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
                            <span>Vous êtes ici</span>
                        </div>
                    </div>
                `;

                const userIcon = L.divIcon({
                    html: userIconHtml,
                    className: 'cch-user-live-marker',
                    iconSize: [0, 0],
                });

                L.marker([latitude, longitude], { icon: userIcon }).addTo(userGroup);

                // User accuracy radius
                L.circle([latitude, longitude], {
                    radius: Math.max(accuracy || 100, 80),
                    color: '#22d3ee',
                    weight: 1.5,
                    opacity: 0.6,
                    fillColor: '#22d3ee',
                    fillOpacity: 0.08,
                }).addTo(userGroup);

                map.setView([latitude, longitude], 15);
                onUserLocation?.({ lat: latitude, lng: longitude });
            },
            (err) => {
                console.warn('Geolocation error:', err);
                setIsLocating(false);
                const fallbackLat = 5.3599;
                const fallbackLng = -3.9866;
                setUserCoords({ lat: fallbackLat, lng: fallbackLng, accuracy: 50 });
                onUserLocation?.({ lat: fallbackLat, lng: fallbackLng });
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([fallbackLat, fallbackLng], 15);
                }
            },
            { enableHighAccuracy: true, timeout: 8000 },
        );
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
    };

    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-[1.35rem] ring-1 ring-white/10 transition-all duration-300',
                isFullscreen ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl' : height,
                className,
            )}
        >
            {/* Map Canvas Element */}
            <div ref={mapContainerRef} className="h-full w-full bg-[#070b0e]" />

            {/* Verification Watermark & Status Pill */}
            <div className="pointer-events-none absolute left-3 top-3 z-[400] flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-void/80 px-2.5 py-1 text-[0.6875rem] font-medium text-heading backdrop-blur-md ring-1 ring-white/15">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
                    </span>
                    <ShieldCheckIcon className="h-3.5 w-3.5 text-neon" />
                    <span>GPS 100% Audité sur site</span>
                </div>
            </div>

            {/* Map Action Controls Overlay */}
            <div className="absolute right-3 top-3 z-[400] flex flex-col gap-1.5">
                <button
                    type="button"
                    onClick={handleLocateUser}
                    title={locale === 'fr' ? 'Ma position GPS en direct (Live)' : 'My Live GPS location'}
                    className={cn(
                        'grid h-8 w-8 place-items-center rounded-lg bg-void/80 backdrop-blur-md ring-1 ring-white/15 transition-all hover:bg-white/15 active:scale-95',
                        userCoords ? 'text-cyan-400 ring-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.3)]' : 'text-heading hover:text-cyan-400',
                    )}
                >
                    {isLocating ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                    ) : (
                        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="8" cy="8" r="6" />
                            <path d="M8 2v2M8 12v2M2 8h2M12 8h2" />
                        </svg>
                    )}
                </button>
                <button
                    type="button"
                    onClick={handleZoomIn}
                    aria-label="Zoom in"
                    className="grid h-8 w-8 place-items-center rounded-lg bg-void/80 text-heading backdrop-blur-md ring-1 ring-white/15 transition-all hover:bg-white/15 hover:text-neon active:scale-95"
                >
                    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3v10M3 8h10" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={handleZoomOut}
                    aria-label="Zoom out"
                    className="grid h-8 w-8 place-items-center rounded-lg bg-void/80 text-heading backdrop-blur-md ring-1 ring-white/15 transition-all hover:bg-white/15 hover:text-neon active:scale-95"
                >
                    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 8h10" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={handleResetCenter}
                    title="Recenter map"
                    className="grid h-8 w-8 place-items-center rounded-lg bg-void/80 text-heading backdrop-blur-md ring-1 ring-white/15 transition-all hover:bg-white/15 hover:text-neon active:scale-95"
                >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="8" cy="8" r="6" />
                        <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-void/80 text-heading backdrop-blur-md ring-1 ring-white/15 transition-all hover:bg-white/15 hover:text-neon active:scale-95"
                >
                    {isFullscreen ? (
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 2v3H2M11 2v3h3M5 14v-3H2M11 14v-3h3" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 5V2h3M14 5V2h-3M2 11v3h3M14 11v3h-3" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Bottom Caption / Coordinates Pill */}
            {caption && (
                <div className="absolute inset-x-3 bottom-3 z-[400] flex items-center justify-between gap-2 rounded-full bg-void/85 px-3 py-1.5 backdrop-blur-md ring-1 ring-white/10">
                    <span className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-body">
                        <span className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
                        {caption}
                    </span>
                    <span className="font-mono text-[0.625rem] text-faint">
                        {defaultCenter[0].toFixed(4)}°N, {Math.abs(defaultCenter[1]).toFixed(4)}°W
                    </span>
                </div>
            )}
        </div>
    );
}
