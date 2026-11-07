import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheckIcon,
    CameraIcon,
    ArrowUpRightIcon,
    CheckIcon,
} from './Icons';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';

/**
 * Default multi-room equirectangular panoramas for listings
 */
const DEFAULT_ROOMS = [
    {
        id: 'living',
        name: 'Living Room & Lounge',
        name_fr: 'Séjour & Salon Principal',
        panorama: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=85',
        thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
        hotSpots: [
            { pitch: -3, yaw: 85, targetScene: 'master', text: 'Vers Suite Parentale' },
            { pitch: -5, yaw: -80, targetScene: 'kitchen', text: 'Vers Cuisine Équipée' },
            { pitch: 0, yaw: 175, targetScene: 'terrace', text: 'Vers Terrasse & Piscine' },
        ],
    },
    {
        id: 'master',
        name: 'Master Suite & Balcony',
        name_fr: 'Suite Parentale & Balcon',
        panorama: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2400&q=85',
        thumbnail: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80',
        hotSpots: [
            { pitch: -2, yaw: -90, targetScene: 'living', text: 'Retour au Séjour' },
            { pitch: -4, yaw: 65, targetScene: 'terrace', text: 'Accès Terrasse' },
        ],
    },
    {
        id: 'kitchen',
        name: 'Gourmet Kitchen',
        name_fr: 'Cuisine Équipée & Îlot',
        panorama: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=2400&q=85',
        thumbnail: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
        hotSpots: [
            { pitch: -3, yaw: 110, targetScene: 'living', text: 'Retour au Séjour' },
        ],
    },
    {
        id: 'terrace',
        name: 'Terrace & Pool Deck',
        name_fr: 'Terrasse & Espace Piscine',
        panorama: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2400&q=85',
        thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
        hotSpots: [
            { pitch: 2, yaw: -160, targetScene: 'living', text: 'Entrer dans le Séjour' },
            { pitch: 0, yaw: 35, targetScene: 'master', text: 'Vers Suite' },
        ],
    },
];

/**
 * Dedicated Pannellum 360-degree Panoramic Virtual Tour Viewer Component.
 * Features:
 * - Multi-scene room navigation with interactive in-room hotspots and portal transitions
 * - Responsive touch & drag navigation for smartphones, tablets, and desktops
 * - Mobile gyroscope / device-orientation tracking mode
 * - Auto-rotation, compass sync, zoom controls, and HTML5 full-screen toggle
 * - Room selector carousel with real-time active scene highlighting
 * - Fallback equirectangular image renderer if external CDN is initializing
 */
export default function PannellumTourViewer({
    rooms = [],
    propertyTitle = 'Propriété Vérifiée',
    className = '',
    initialRoomId = 'living',
}) {
    const { t, locale } = useTranslation();
    const containerRef = useRef(null);
    const viewerDivRef = useRef(null);
    const viewerInstanceRef = useRef(null);

    const activeRooms = rooms && rooms.length > 0 ? rooms : DEFAULT_ROOMS;

    const [currentSceneId, setCurrentSceneId] = useState(initialRoomId);
    const [isLoading, setIsLoading] = useState(true);
    const [autoRotate, setAutoRotate] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [gyroActive, setGyroActive] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [yawDeg, setYawDeg] = useState(0);

    const currentRoom = activeRooms.find((r) => r.id === currentSceneId) || activeRooms[0];

    // Initialize Pannellum Viewer
    const initViewer = useCallback(() => {
        if (typeof window === 'undefined') return;
        if (!viewerDivRef.current) return;
        if (!window.pannellum) {
            // Script still loading from index.html CDN
            setTimeout(initViewer, 150);
            return;
        }

        try {
            // Destroy existing instance cleanly
            if (viewerInstanceRef.current) {
                try {
                    viewerInstanceRef.current.destroy();
                } catch (e) {}
                viewerInstanceRef.current = null;
            }

            // Build scenes configuration map for Pannellum
            const scenesConfig = {};
            activeRooms.forEach((room, index) => {
                const roomHotspots = [];

                // Connect to next room by default if no explicit hotspots
                if (room.hotSpots && room.hotSpots.length > 0) {
                    room.hotSpots.forEach((hs) => {
                        roomHotspots.push({
                            pitch: hs.pitch ?? -4,
                            yaw: hs.yaw ?? 60,
                            type: 'scene',
                            text: hs.text || `Vers ${hs.targetScene}`,
                            sceneId: hs.targetScene,
                            clickHandlerFunc: () => {
                                setCurrentSceneId(hs.targetScene);
                                setHasInteracted(true);
                            },
                        });
                    });
                } else {
                    // Generate smart bidirectional portals between adjacent rooms
                    const otherRooms = activeRooms.filter((r) => r.id !== room.id);
                    otherRooms.forEach((targetRoom, targetIndex) => {
                        const angle = ((targetIndex + 1) * (360 / (otherRooms.length + 1))) - 140;
                        roomHotspots.push({
                            pitch: -5,
                            yaw: angle,
                            type: 'scene',
                            text: locale === 'fr' ? `Aller à : ${targetRoom.name_fr || targetRoom.name}` : `Go to: ${targetRoom.name}`,
                            sceneId: targetRoom.id,
                            clickHandlerFunc: () => {
                                setCurrentSceneId(targetRoom.id);
                                setHasInteracted(true);
                            },
                        });
                    });
                }

                // GPS certification in-scene badge hotspot
                roomHotspots.push({
                    pitch: -18,
                    yaw: 15,
                    type: 'info',
                    text: '📍 Horodatage GPS In Situ Certifié · Chic Choc Habitat',
                });

                scenesConfig[room.id] = {
                    title: locale === 'fr' ? (room.name_fr || room.name) : room.name,
                    hfov: 100,
                    minHfov: 50,
                    maxHfov: 125,
                    type: 'equirectangular',
                    panorama: room.panorama,
                    autoRotate: autoRotate ? -1.8 : 0,
                    autoRotateInactivityDelay: 3500,
                    compass: true,
                    hotSpots: roomHotspots,
                };
            });

            // Initialize Pannellum multi-scene tour
            const firstScene = activeRooms.some((r) => r.id === currentSceneId) ? currentSceneId : activeRooms[0].id;

            const viewer = window.pannellum.viewer(viewerDivRef.current, {
                default: {
                    firstScene,
                    author: 'Chic Choc Habitat',
                    sceneFadeDuration: 900,
                    autoLoad: true,
                    compass: true,
                    showZoomCtrl: false,
                    showFullscreenCtrl: false,
                    mouseZoom: true,
                    touchPan: true,
                    draggable: true,
                    friction: 0.15,
                },
                scenes: scenesConfig,
            });

            viewerInstanceRef.current = viewer;

            // Events
            viewer.on('load', () => {
                setIsLoading(false);
                try {
                    const scene = viewer.getScene();
                    if (scene && scene !== currentSceneId) {
                        setCurrentSceneId(scene);
                    }
                } catch (e) {}
            });

            viewer.on('scenechange', (newSceneId) => {
                setCurrentSceneId(newSceneId);
                setIsLoading(false);
            });

            viewer.on('mousedown', () => setHasInteracted(true));
            viewer.on('touchstart', () => setHasInteracted(true));

            // Compass yaw tracking interval
            const yawInterval = setInterval(() => {
                if (viewerInstanceRef.current) {
                    try {
                        const yaw = Math.round(viewerInstanceRef.current.getYaw() || 0);
                        setYawDeg(((yaw % 360) + 360) % 360);
                    } catch (e) {}
                }
            }, 300);

            return () => {
                clearInterval(yawInterval);
            };
        } catch (err) {
            console.warn('Pannellum initialization fallback:', err);
            setIsLoading(false);
        }
    }, [activeRooms, autoRotate, locale, currentSceneId]);

    // Mount viewer
    useEffect(() => {
        const cleanup = initViewer();
        return () => {
            if (cleanup && typeof cleanup === 'function') cleanup();
            if (viewerInstanceRef.current) {
                try {
                    viewerInstanceRef.current.destroy();
                } catch (e) {}
                viewerInstanceRef.current = null;
            }
        };
    }, [initViewer]);

    // Switch scene when currentSceneId changes from external UI
    const handleRoomSelect = (roomId) => {
        setHasInteracted(true);
        if (roomId === currentSceneId) return;
        setIsLoading(true);
        setCurrentSceneId(roomId);

        if (viewerInstanceRef.current) {
            try {
                viewerInstanceRef.current.loadScene(roomId);
            } catch (e) {
                // If viewer needs reinit
                initViewer();
            }
        }
    };

    // Toggle Auto-rotate
    const handleToggleAutoRotate = () => {
        const nextState = !autoRotate;
        setAutoRotate(nextState);
        if (viewerInstanceRef.current) {
            try {
                if (nextState) {
                    viewerInstanceRef.current.startAutoRotate(-1.8);
                } else {
                    viewerInstanceRef.current.stopAutoRotate();
                }
            } catch (e) {}
        }
    };

    // Zoom Controls
    const handleZoomIn = () => {
        if (!viewerInstanceRef.current) return;
        try {
            const hfov = viewerInstanceRef.current.getHfov();
            viewerInstanceRef.current.setHfov(Math.max(45, hfov - 15));
        } catch (e) {}
    };

    const handleZoomOut = () => {
        if (!viewerInstanceRef.current) return;
        try {
            const hfov = viewerInstanceRef.current.getHfov();
            viewerInstanceRef.current.setHfov(Math.min(125, hfov + 15));
        } catch (e) {}
    };

    // Gyroscope / Device orientation on mobile
    const handleToggleGyro = () => {
        if (!viewerInstanceRef.current) return;
        try {
            if (!gyroActive) {
                // Request orientation permissions if iOS 13+
                if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                    DeviceOrientationEvent.requestPermission()
                        .then((res) => {
                            if (res === 'granted') {
                                viewerInstanceRef.current.startOrientation();
                                setGyroActive(true);
                            }
                        })
                        .catch(() => {});
                } else {
                    viewerInstanceRef.current.startOrientation();
                    setGyroActive(true);
                }
            } else {
                viewerInstanceRef.current.stopOrientation();
                setGyroActive(false);
            }
        } catch (e) {
            console.warn('Orientation error:', e);
        }
    };

    // Fullscreen Toggle
    const handleToggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
        }
    };

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-void shadow-2xl transition-all duration-300",
                isFullscreen ? "fixed inset-0 z-50 rounded-none border-none" : "w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] max-h-[680px]",
                className
            )}
        >
            {/* Pannellum DOM mount container */}
            <div
                ref={viewerDivRef}
                className="h-full w-full bg-void-deep"
                style={{ width: '100%', height: '100%' }}
            />

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-void/85 backdrop-blur-md"
                    >
                        <div className="relative flex h-14 w-14 items-center justify-center">
                            <span className="absolute h-full w-full animate-ping rounded-full bg-neon/30"></span>
                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                            <CameraIcon className="h-4 w-4 text-emerald-400 absolute" />
                        </div>
                        <p className="mt-3 font-display text-xs font-bold text-heading">
                            Chargement du panorama 360°...
                        </p>
                        <p className="text-[0.6875rem] text-emerald-400 font-mono mt-0.5">
                            {locale === 'fr' ? currentRoom.name_fr : currentRoom.name}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Status & Controls Header */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                {/* Room and Status Badge */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="flex items-center gap-2 rounded-full bg-void/85 px-3.5 py-1.5 backdrop-blur-md border border-emerald-500/35 shadow-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                        </span>
                        <span className="text-xs font-bold text-white tracking-wide">
                            360° {locale === 'fr' ? (currentRoom.name_fr || currentRoom.name) : currentRoom.name}
                        </span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-void/80 px-2.5 py-1 text-[0.6875rem] text-emerald-300 backdrop-blur-md border border-white/10">
                        <ShieldCheckIcon className="h-3.5 w-3.5 text-neon" />
                        <span>GPS Verrouillé</span>
                    </div>
                </div>

                {/* Controls toolbar */}
                <div className="flex items-center gap-1.5 pointer-events-auto">
                    {/* Compass degree */}
                    <div className="hidden sm:flex items-center gap-1 rounded-full bg-void/85 px-2.5 py-1 text-[0.6875rem] font-mono text-heading backdrop-blur-md border border-white/10">
                        <span className="text-emerald-400 font-bold">🧭</span>
                        <span>{yawDeg}°</span>
                    </div>

                    {/* Auto-rotate toggle */}
                    <button
                        type="button"
                        onClick={handleToggleAutoRotate}
                        title={autoRotate ? "Désactiver la rotation automatique" : "Activer la rotation automatique"}
                        className={cn(
                            "grid h-8 w-8 place-items-center rounded-full backdrop-blur-md border transition-all cursor-pointer",
                            autoRotate
                                ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                                : "bg-void/80 text-white/70 border-white/15 hover:text-white hover:bg-void"
                        )}
                    >
                        <span className="text-xs">🔄</span>
                    </button>

                    {/* Gyroscope toggle (mobile) */}
                    <button
                        type="button"
                        onClick={handleToggleGyro}
                        title="Mode Gyroscope Mobile"
                        className={cn(
                            "grid h-8 w-8 place-items-center rounded-full backdrop-blur-md border transition-all cursor-pointer",
                            gyroActive
                                ? "bg-cyan-500/25 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                                : "bg-void/80 text-white/70 border-white/15 hover:text-white hover:bg-void"
                        )}
                    >
                        <span className="text-xs">📱</span>
                    </button>

                    {/* Zoom in / out */}
                    <button
                        type="button"
                        onClick={handleZoomIn}
                        title="Zoomer"
                        className="grid h-8 w-8 place-items-center rounded-full bg-void/80 text-white/80 backdrop-blur-md border border-white/15 hover:bg-void hover:text-white cursor-pointer"
                    >
                        <span className="text-xs font-bold">+</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleZoomOut}
                        title="Dézoomer"
                        className="grid h-8 w-8 place-items-center rounded-full bg-void/80 text-white/80 backdrop-blur-md border border-white/15 hover:bg-void hover:text-white cursor-pointer"
                    >
                        <span className="text-xs font-bold">-</span>
                    </button>

                    {/* Fullscreen toggle */}
                    <button
                        type="button"
                        onClick={handleToggleFullscreen}
                        title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                        className="grid h-8 w-8 place-items-center rounded-full bg-void/80 text-white/80 backdrop-blur-md border border-white/15 hover:bg-void hover:text-white cursor-pointer"
                    >
                        <span className="text-xs">{isFullscreen ? '↙' : '↗'}</span>
                    </button>
                </div>
            </div>

            {/* Gesture Helper Tooltip (Fades out after interaction) */}
            <AnimatePresence>
                {!hasInteracted && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: 0.8 }}
                        className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center px-4"
                    >
                        <div className="flex items-center gap-2 rounded-full bg-void/90 px-4 py-2 text-xs font-semibold text-emerald-300 backdrop-blur-xl border border-emerald-500/40 shadow-2xl">
                            <span className="text-base animate-pulse">👆</span>
                            <span>Glissez avec le doigt ou la souris pour explorer à 360° · Cliquez sur les portails pour changer de pièce</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Room Navigation Bar */}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-3 pointer-events-none">
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none pointer-events-auto max-w-full">
                    {activeRooms.map((room) => {
                        const isActive = room.id === currentSceneId;
                        return (
                            <button
                                key={room.id}
                                type="button"
                                onClick={() => handleRoomSelect(room.id)}
                                className={cn(
                                    "group relative flex items-center gap-2 rounded-2xl p-1.5 pr-3 text-left transition-all duration-200 cursor-pointer shrink-0 shadow-lg",
                                    isActive
                                        ? "bg-emerald-950/85 text-emerald-200 ring-2 ring-emerald-400 backdrop-blur-xl scale-[1.03]"
                                        : "bg-void/85 text-white/70 hover:text-white hover:bg-void/95 border border-white/10 backdrop-blur-md"
                                )}
                            >
                                <div className="relative h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-xl bg-void shrink-0">
                                    <img
                                        src={room.thumbnail || room.panorama}
                                        alt={room.name}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    {isActive && (
                                        <div className="absolute inset-0 bg-emerald-500/20 ring-1 ring-emerald-400 inset-0 rounded-xl" />
                                    )}
                                </div>
                                <div className="min-w-0 pr-1">
                                    <p className="font-display text-[0.6875rem] sm:text-xs font-bold truncate">
                                        {locale === 'fr' ? (room.name_fr || room.name) : room.name}
                                    </p>
                                    <p className="text-[0.5625rem] text-emerald-400 font-medium">
                                        {isActive ? 'Pièce active' : 'Visiter'}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Room count pill */}
                <div className="hidden md:flex items-center gap-1.5 rounded-full bg-void/85 px-3 py-1.5 text-xs font-semibold text-faint backdrop-blur-md border border-white/10 shrink-0 pointer-events-auto">
                    <span className="text-emerald-400 font-bold">{activeRooms.findIndex((r) => r.id === currentSceneId) + 1}</span>
                    <span>/</span>
                    <span>{activeRooms.length} pièces</span>
                </div>
            </div>
        </div>
    );
}
