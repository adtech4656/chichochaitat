import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LogoMark } from './Logo';

/**
 * Flow 1 — Entry.
 * Full-bleed #090C10, the mark blooms in with a green aura, holds, then
 * scales up and dissolves to reveal the home page.
 */
export default function LogoPreloader({ onDone }) {
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        const timer = window.setTimeout(onDone, reduceMotion ? 350 : 700);

        return () => window.clearTimeout(timer);
    }, [onDone, reduceMotion]);

    return (
        <motion.div
            className="fixed inset-0 z-[120] grid place-items-center bg-void cursor-pointer select-none"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
            onClick={onDone}
            aria-label="Skip intro animation"
        >
            {/* Ambient green aura */}
            <motion.div
                className="pointer-events-none absolute h-[26rem] w-[26rem] rounded-full"
                style={{
                    background:
                        'radial-gradient(circle, rgba(102,187,106,0.22) 0%, rgba(102,187,106,0.06) 45%, transparent 70%)',
                }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: [0, 0.9, 0.9, 0], scale: [0.6, 1, 1.25, 1.6] }}
                transition={{ duration: reduceMotion ? 0.3 : 1.9, times: [0, 0.3, 0.7, 1], ease: 'easeOut' }}
            />

            <motion.div
                className="relative flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.88, filter: 'blur(10px)' }}
                animate={
                    reduceMotion
                        ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
                        : {
                              opacity: [0, 1, 1, 0],
                              scale: [0.88, 1, 1.04, 1.16],
                              filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(8px)'],
                          }
                }
                transition={{ duration: reduceMotion ? 0.3 : 1.95, times: [0, 0.32, 0.72, 1], ease: [0.22, 1, 0.36, 1] }}
            >
                <LogoMark className="h-28 w-28 rounded-2xl bg-white/95 p-2 shadow-2xl ring-1 ring-neon/40" glow />

                <motion.div
                    className="mt-6 flex flex-col items-center gap-1 text-center"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: [0, 1, 1, 0], y: 0 }}
                    transition={{ duration: reduceMotion ? 0.3 : 1.7, times: [0, 0.35, 0.75, 1] }}
                >
                    <span className="font-display text-lg font-bold tracking-tight text-white">
                        CHIC CHOC <span className="text-neon">HABITAT</span>
                    </span>
                    <span className="text-[0.625rem] font-semibold text-neon/90 uppercase tracking-[0.25em]">
                        Fiable · Sécurisé · Garantie
                    </span>
                </motion.div>
            </motion.div>

            {/* Hairline progress */}
            <motion.div
                className="absolute bottom-16 h-px w-40 overflow-hidden rounded-full bg-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
            >
                <motion.div
                    className="h-full bg-neon"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: reduceMotion ? 0.2 : 1.7, ease: [0.22, 1, 0.36, 1] }}
                />
            </motion.div>
        </motion.div>
    );
}
