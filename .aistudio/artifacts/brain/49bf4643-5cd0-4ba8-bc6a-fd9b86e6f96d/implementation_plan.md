# Implementation Plan: Modern Sidebar Navigation, LocalStorage Mock Auth & "I'm Interested" Flow

Deliver an elevated, ultra-responsive UI for both mobile and desktop with a modern slide-out sidebar navigation, complete localStorage-backed mock authentication with instant demo account switchers, and the conversion of property contact CTAs to **"Je suis intéressé(e) / I'm Interested"**.

---

## 1. UI & Architecture Upgrades

### A. Modern Slide-Out Sidebar Navigation & Minimal Top Bar (`resources/js/Layouts/SiteLayout.jsx`)
- **Sleek Minimal Top Bar**:
  - Keep the top bar lightweight and uncluttered on both mobile and laptop:
    - Left: Luxury ChiChoc Habitat logo with verified status indicator.
    - Right: Compact Currency (live rate) & Language switcher pills, quick Wishlist/Compare indicators, and an animated Hamburger Menu button.
  - Eliminate cramped or overflowing navbar links that break on tablet and mobile screens.
- **Modern Slide-Out Sidebar Drawer**:
  - Slide-out backdrop-blurred panel accessible from anywhere (mobile and laptop).
  - Contains categorized, spacious navigation:
    - **Navigation Principale**: Accueil, Explorer les Biens, Carte GPS Interactive, Demande sur-mesure, Comparateur de Biens.
    - **Espace Membre & Sélecteur Démo**: Active user card with instant 1-click role switcher (Acheteur, Agent Agréé, Propriétaire).
    - **Paramètres & Outils**: Sélecteur de Devise en direct (XOF, EUR, USD, CAD, GBP), Sélecteur de Langue (FR/EN).
    - **Lignes Service Client & Conciergerie**: Hotline officielle (`+225 07 00 00 00`), WhatsApp Support, et Email d'assistance.

### B. Mock Authentication with LocalStorage & Demo Switcher (`resources/js/lib/auth-storage.js` & `AuthModal.jsx`)
- **LocalStorage Storage Engine**:
  - Store registered users, credentials, and active session directly in `localStorage` under `chichoc_auth_user` and `chichoc_registered_users`.
  - Support instant sign-up and sign-in without requiring an active external database.
- **1-Click Demo Profile Switchers**:
  - **Acheteur Vérifié**: Koffi Kouamé (`kouame@example.com`, Solde pré-approuvé, recherche active).
  - **Agent Agréé KYC 3**: Aya Koffi (`aya.koffi@habitat.ci`, 18 mandats actifs, 4.9 avis, badge MCLU).
  - **Propriétaire**: Ibrahim Touré (`toure@chichoc.ci`, Mandats exclusifs).
- **Session Sync**:
  - Auto-sync with Inertia page state and trigger re-renders across all components so users stay logged in across page navigations.

### C. "Je suis intéressé(e) / I'm Interested" CTA & Chat Flow
- **Element Targeting (CSS Selector 3 & Property Cards)**:
  - Replace *"Contacter ChiChoc"* or *"Contacter l'Agent"* buttons with:
    - Primary CTA: **"Je suis intéressé(e)"** (*"I'm Interested"*).
    - Icon: Sparkles / ShieldCheck.
  - When clicked:
    - Opens the ChiChoc Official Intermediation Drawer.
    - Automatically pre-fills and sends: *"Bonjour, je suis très intéressé(e) par ce bien [Titre]. Pouvez-vous me transmettre les modalités et organiser la visite officielle ?"*
    - Automatically opens the mediation chat thread so the customer immediately enters the negotiation and deal flow.
  - Reserve *"Contacter le Service Client ChiChoc"* specifically for customer service and helpline in the sidebar and footer.

### D. Mobile & Laptop Responsive Polish
- Ensure all interactive touch targets meet the 44px accessibility threshold.
- Fix mobile padding, sticky comparison bar positioning, and drawer heights for seamless viewing on iPhone/Android and desktop screens.
- Synchronize bilingual translations (`lang/fr.json` and `lang/en.json`).

---

## 2. Execution Steps

1. **Auth Storage Engine**: Create `resources/js/lib/auth-storage.js` and update `resources/js/lib/auth-modal.jsx` & `AuthModal.jsx` to manage local storage sessions with 1-click demo accounts.
2. **Navigation & Minimal Top Bar**: Update `resources/js/Layouts/SiteLayout.jsx` with the minimal top bar and full-featured slide-out sidebar menu.
3. **CTA Relabeling & Action**: Update `PropertyCard.jsx`, `VerifiedAgentProfile.jsx`, and property detail pages to feature **"Je suis intéressé(e)"** triggering the pre-filled negotiation chat.
4. **Verification**: Run `compile_applet` and `lint_applet`, restart dev server, and test responsiveness on mobile and desktop viewports.
