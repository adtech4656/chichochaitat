import gsap from 'gsap';

/**
 * GSAP Animation Toolkit for ChiChoc Habitat.
 * Provides hardware-accelerated animations for badges, hero reveal, and drawers.
 */

export function animateHeroReveal(container) {
    if (!container) return;
    const targets = container.querySelectorAll('[data-gsap="reveal"]');
    if (!targets || targets.length === 0) return;

    gsap.fromTo(
        targets,
        {
            opacity: 0,
            y: 24,
            filter: 'blur(6px)',
        },
        {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.85,
            stagger: 0.12,
            ease: 'power3.out',
        }
    );
}

export function animateCardEntrance(cards) {
    if (!cards || cards.length === 0) return;
    gsap.fromTo(
        cards,
        { opacity: 0, y: 30, scale: 0.96 },
        {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: 'back.out(1.2)',
        }
    );
}

export function animateDrawerSlideIn(drawerElement) {
    if (!drawerElement) return;
    gsap.fromTo(
        drawerElement,
        { x: '100%', opacity: 0.5 },
        { x: '0%', opacity: 1, duration: 0.45, ease: 'power3.out' }
    );
}

export function animatePulseGlow(element) {
    if (!element) return;
    return gsap.to(element, {
        boxShadow: '0 0 25px rgba(102, 187, 106, 0.6)',
        repeat: -1,
        yoyo: true,
        duration: 1.4,
        ease: 'sine.inOut',
    });
}
