/**
 * Shared motion language.
 *
 * Every transition in ChiChoc-Habitat uses the same spring so the product
 * feels like one physical material rather than a set of pages.
 */
export const spring = { type: 'spring', stiffness: 300, damping: 30 };
export const springSoft = { type: 'spring', stiffness: 220, damping: 28 };

/** Page-level enter/exit: slide up + fade. */
export const page = {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0, transition: spring },
    exit: { opacity: 0, y: -16, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
};

/** Container that releases children one after another. */
export const staggerParent = {
    animate: { transition: { staggerChildren: 0.075, delayChildren: 0.08 } },
};

export const staggerChild = {
    initial: { opacity: 0, y: 26, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1, transition: spring },
};

/** Modal panel: rise from just below centre. */
export const modalPanel = {
    initial: { opacity: 0, y: 24, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1, transition: spring },
    exit: { opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.18 } },
};
