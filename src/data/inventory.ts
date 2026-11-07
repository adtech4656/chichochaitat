export interface AgentVerificationBadge {
  key: string;
  label: string;
  verified: boolean;
}

export interface Agent {
  id: number;
  slug: string;
  name: string;
  agency: string;
  role_title?: string;
  initials: string;
  rating: number;
  deals: number;
  verified: boolean;
  since: string;
  response: string;
  phone: string;
  email: string;
  whatsapp?: string;
  office_address?: string;
  license_number?: string;
  bio?: string;
  specialties?: string[];
  languages?: string[];
  avatar?: string;
  cover_image?: string;
  kyc_status?: string;
  kyc_date?: string;
  verification_badges?: AgentVerificationBadge[];
}

export interface PropertyItem {
  id: number;
  slug: string;
  title: string;
  location: string;
  district: string;
  city: string;
  price: number;
  currency: string;
  intent: 'sale' | 'rent';
  intent_label: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  gallery: string[];
  agent: Agent;
  tags: string[];
  description: string;
  lat: number;
  lng: number;
  published: string;
  views: number;
  href: string;
  saved?: boolean;
  price_drop_subscribed?: boolean;
  original_price?: number;
  price_drop_amount?: number;
  virtual_tours?: VirtualTourRoom[];
  verified: {
    agent: boolean;
    location: boolean;
    photos: boolean;
    video: boolean;
    documents: boolean;
    reviewer: string;
    reviewed_at: string;
  };
}

export interface VirtualTourRoom {
  id: string;
  name: string;
  name_fr: string;
  panorama: string;
  thumbnail: string;
}

export const DEFAULT_VIRTUAL_TOURS: VirtualTourRoom[] = [
  {
    id: 'living',
    name: 'Living Room & Lounge',
    name_fr: 'Séjour & Salon Principal',
    panorama: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'master',
    name: 'Master Suite & Balcony',
    name_fr: 'Suite Parentale & Balcon',
    panorama: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'kitchen',
    name: 'Gourmet Kitchen',
    name_fr: 'Cuisine Équipée & Îlot',
    panorama: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'terrace',
    name: 'Terrace & Pool Deck',
    name_fr: 'Terrasse & Espace Piscine',
    panorama: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2400&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
  },
];

const img = (photoId: string, width = 1200) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=80`;

export const AGENTS: Record<string, Agent> = {
  aya: {
    id: 1,
    slug: 'aya-koffi',
    name: 'Aya Koffi',
    agency: 'Koffi & Co. Immobilier',
    role_title: 'Directrice & Courtier Principal',
    initials: 'AK',
    rating: 4.9,
    deals: 128,
    verified: true,
    since: '2021',
    response: 'Under 10 min',
    phone: '+225 07 00 00 01',
    email: 'aya@koffi-immobilier.ci',
    whatsapp: '+22507000001',
    office_address: 'Cocody Danga, Boulevard de France, Immeuble Horizon, 3e étage, Abidjan',
    license_number: 'RCCM CI-ABJ-2021-B-8491 / CCH-CERT-001',
    bio: 'Diplômée en gestion immobilière et finance foncière avec plus de 9 ans d’expérience sur le marché abidjanais. Spécialiste reconnue des résidences haut standing à Cocody, Riviera et Plateau, avec un strict engagement de transparence notariale et de conformité KYC.',
    specialties: ['Résidences de luxe', 'Villas & Haut Standing', 'Vérification foncière & ACD', 'Négociation sécurisée'],
    languages: ['Français (Natif)', 'English (Fluent)', 'Baoulé'],
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    kyc_status: 'approved',
    kyc_date: '14 Mars 2024',
    verification_badges: [
      { key: 'cni', label: 'CNI biométrique & Passeport vérifiés', verified: true },
      { key: 'rccm', label: 'Registre de commerce (RCCM) audité', verified: true },
      { key: 'office', label: 'Siège social & bureaux physiques contrôlés à Cocody', verified: true },
      { key: 'gps', label: 'Certification capture GPS sur site validée', verified: true },
      { key: 'escrow', label: 'Compte séquestre notarié & garantie anti-fraude', verified: true },
    ],
  },
  jeanmarc: {
    id: 2,
    slug: 'jean-marc-diallo',
    name: 'Jean-Marc Diallo',
    agency: 'Atlas Habitat',
    role_title: 'Expert Foncier & Négociateur Immobilier',
    initials: 'JD',
    rating: 4.8,
    deals: 94,
    verified: true,
    since: '2022',
    response: 'Under 30 min',
    phone: '+225 07 00 00 02',
    email: 'jeanmarc@atlas.ci',
    whatsapp: '+22507000002',
    office_address: 'Riviera Bonoumin, Carrefour Guiraud, Abidjan',
    license_number: 'RCCM CI-ABJ-2022-A-3129 / CCH-CERT-002',
    bio: 'Ingénieur urbaniste et consultant immobilier certifié. Expert en valorisation de parcelles, transactions de villas familiales et titrisation foncière dans le Grand Abidjan et Grand-Bassam.',
    specialties: ['Terrains & Terrains titrés', 'Villas familiales', 'Riviera & Bingerville', 'Audit urbanistique'],
    languages: ['Français (Natif)', 'English', 'Dioula'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    cover_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
    kyc_status: 'approved',
    kyc_date: '02 Juin 2024',
    verification_badges: [
      { key: 'cni', label: 'Passeport national vérifié', verified: true },
      { key: 'rccm', label: 'RCCM Atlas Habitat en règle', verified: true },
      { key: 'office', label: 'Agence physique auditée à Riviera Bonoumin', verified: true },
      { key: 'gps', label: 'Protocole de capture GPS 100% conforme', verified: true },
      { key: 'escrow', label: 'Garantie professionnelle souscrite', verified: true },
    ],
  },
  fatou: {
    id: 3,
    slug: 'fatou-bamba',
    name: 'Fatou Bamba',
    agency: 'Ivoire Estates',
    role_title: 'Responsable Gestion Locative & Baux Commerciaux',
    initials: 'FB',
    rating: 4.7,
    deals: 61,
    verified: true,
    since: '2023',
    response: 'Same day',
    phone: '+225 07 00 00 03',
    email: 'fatou@ivoire-estates.ci',
    whatsapp: '+22507000003',
    office_address: 'Plateau, Immeuble Postel 2001, 8e étage, Abidjan',
    license_number: 'RCCM CI-ABJ-2023-B-5712 / CCH-CERT-003',
    bio: 'Spécialiste de la location meublée premium, des baux d’entreprises et d’espaces commerciaux à Plateau et Marcory Zone 4. Suivi personnalisé des bailleurs et locataires expatriés.',
    specialties: ['Baux commerciaux', 'Lofts & Appartements meublés', 'Gestion locative sécurisée', 'Plateau & Zone 4'],
    languages: ['Français (Natif)', 'English (Bilingual)', 'Malinké'],
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    cover_image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
    kyc_status: 'approved',
    kyc_date: '18 Janvier 2025',
    verification_badges: [
      { key: 'cni', label: 'CNI et biométrie certifiées', verified: true },
      { key: 'rccm', label: 'Licence professionnelle validée', verified: true },
      { key: 'office', label: 'Bureaux physiques inspectés au Plateau', verified: true },
      { key: 'gps', label: 'Audits de visite in situ certifiés', verified: true },
      { key: 'escrow', label: 'Contrats types conformes droit OHADA', verified: true },
    ],
  },
};

export const INITIAL_PROPERTIES: PropertyItem[] = [
  {
    id: 1,
    slug: 'mansard-view-residence',
    title: 'Mansard View Residence',
    location: 'Cocody, Abidjan',
    district: 'Cocody',
    city: 'Abidjan',
    price: 54000000,
    currency: 'XOF',
    intent: 'sale',
    intent_label: 'For sale',
    type: 'House',
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    image: img('photo-1600585154340-be6161a56a0c', 1400),
    gallery: [
      img('photo-1600585154340-be6161a56a0c', 1600),
      img('photo-1600607687939-ce8a6c25118c', 1600),
      img('photo-1600566753190-17f0baa2a6c3', 1600),
      img('photo-1600210492486-724fe5c67fb0', 1600),
    ],
    agent: AGENTS.aya,
    tags: ['Pool', 'Garden', 'Parking', 'Security', 'Solar'],
    description:
      'A calm, light-filled family home set back from the road in Cocody. Double-height living space opens onto a shaded terrace and a filtered pool, with a separate service wing and covered parking for two cars. Every photograph in this listing was captured on site with GPS and timestamp verification.',
    lat: 5.3599,
    lng: -3.9866,
    published: '2026-09-28',
    views: 1284,
    href: '/properties/mansard-view-residence',
    verified: {
      agent: true,
      location: true,
      photos: true,
      video: true,
      documents: true,
      reviewer: 'Technical review · K. Mensah',
      reviewed_at: '2026-09-28',
    },
  },
  {
    id: 2,
    slug: 'sunset-creek-villa',
    title: 'Sunset Creek Villa',
    location: 'Riviera, Abidjan',
    district: 'Riviera',
    city: 'Abidjan',
    price: 38500000,
    currency: 'XOF',
    intent: 'sale',
    intent_label: 'For sale',
    type: 'House',
    bedrooms: 3,
    bathrooms: 2,
    area: 220,
    image: img('photo-1600596542815-ffad4c1539a9', 1400),
    gallery: [
      img('photo-1600596542815-ffad4c1539a9', 1600),
      img('photo-1600607687920-4e2a09cf159d', 1600),
      img('photo-1600585154526-990dced4db0d', 1600),
    ],
    agent: AGENTS.jeanmarc,
    tags: ['Garden', 'Parking', 'Security', 'Borehole'],
    description:
      'Quiet villa with a mature garden and room to extend. The kitchen was renovated in 2024 and the roof was replaced the same year. Title documents have been reviewed by our legal team.',
    lat: 5.3673,
    lng: -3.9551,
    published: '2026-10-02',
    views: 941,
    href: '/properties/sunset-creek-villa',
    verified: {
      agent: true,
      location: true,
      photos: true,
      video: true,
      documents: true,
      reviewer: 'Technical review · K. Mensah',
      reviewed_at: '2026-10-02',
    },
  },
  {
    id: 3,
    slug: 'atelier-loft-plateau',
    title: 'Atelier Loft — Plateau',
    location: 'Plateau, Abidjan',
    district: 'Plateau',
    city: 'Abidjan',
    price: 1250000,
    currency: 'XOF',
    intent: 'rent',
    intent_label: 'Per month',
    type: 'House',
    bedrooms: 2,
    bathrooms: 2,
    area: 118,
    image: img('photo-1512917774080-9991f1c4c750', 1400),
    gallery: [
      img('photo-1512917774080-9991f1c4c750', 1600),
      img('photo-1600210492486-724fe5c67fb0', 1600),
    ],
    agent: AGENTS.fatou,
    tags: ['Furnished', 'Air conditioning', 'Elevator', 'Security'],
    description:
      'Converted loft minutes from the Plateau business district. Furnished, air-conditioned, and available immediately on a twelve-month minimum term.',
    lat: 5.3242,
    lng: -4.0161,
    published: '2026-10-08',
    views: 612,
    href: '/properties/atelier-loft-plateau',
    verified: {
      agent: true,
      location: true,
      photos: true,
      video: true,
      documents: true,
      reviewer: 'Technical review · K. Mensah',
      reviewed_at: '2026-10-08',
    },
  },
  {
    id: 4,
    slug: 'cocody-garden-estate',
    title: 'Cocody Garden Estate',
    location: 'Angré, Abidjan',
    district: 'Angré',
    city: 'Abidjan',
    price: 76000000,
    currency: 'XOF',
    intent: 'sale',
    intent_label: 'For sale',
    type: 'House',
    bedrooms: 5,
    bathrooms: 4,
    area: 410,
    image: img('photo-1613490493576-7fde63acd811', 1400),
    gallery: [
      img('photo-1613490493576-7fde63acd811', 1600),
      img('photo-1600607687939-ce8a6c25118c', 1600),
    ],
    agent: AGENTS.aya,
    tags: ['Pool', 'Garden', 'Parking', 'Security', 'Solar'],
    description:
      'A five-bedroom estate on a 900 m² titled plot, with staff quarters, a pool, and a solar array that covers daytime load.',
    lat: 5.4028,
    lng: -3.9702,
    published: '2026-09-19',
    views: 2104,
    href: '/properties/cocody-garden-estate',
    verified: {
      agent: true,
      location: true,
      photos: true,
      video: true,
      documents: true,
      reviewer: 'Technical review · K. Mensah',
      reviewed_at: '2026-09-19',
    },
  },
  {
    id: 5,
    slug: 'palm-ridge-plot',
    title: 'Palm Ridge Titled Plot',
    location: 'Bingerville, Abidjan',
    district: 'Bingerville',
    city: 'Abidjan',
    price: 18900000,
    currency: 'XOF',
    intent: 'sale',
    intent_label: 'For sale',
    type: 'Land',
    bedrooms: 0,
    bathrooms: 0,
    area: 600,
    image: img('photo-1500382017468-9049fed747ef', 1400),
    gallery: [img('photo-1500382017468-9049fed747ef', 1600)],
    agent: AGENTS.jeanmarc,
    tags: ['Titled', 'Corner plot', 'Road access'],
    description:
      'Corner plot with an ADU certificate on file and clear road access. Ideal for a duplex or a small residence.',
    lat: 5.3556,
    lng: -3.8836,
    published: '2026-10-11',
    views: 388,
    href: '/properties/palm-ridge-plot',
    verified: {
      agent: true,
      location: true,
      photos: true,
      video: true,
      documents: true,
      reviewer: 'Technical review · K. Mensah',
      reviewed_at: '2026-10-11',
    },
  },
  {
    id: 6,
    slug: 'marina-court-commercial',
    title: 'Marina Court Commercial',
    location: 'Marcory, Abidjan',
    district: 'Marcory',
    city: 'Abidjan',
    price: 2400000,
    currency: 'XOF',
    intent: 'rent',
    intent_label: 'Per month',
    type: 'Shop',
    bedrooms: 0,
    bathrooms: 1,
    area: 95,
    image: img('photo-1497366754035-f200968a6e72', 1400),
    gallery: [img('photo-1497366754035-f200968a6e72', 1600)],
    agent: AGENTS.fatou,
    tags: ['Street frontage', 'Parking', 'Security', 'Air conditioning'],
    description:
      'Ground-floor retail unit with nine metres of street frontage in a high-footfall stretch of Marcory.',
    lat: 5.3021,
    lng: -3.9905,
    published: '2026-10-14',
    views: 274,
    href: '/properties/marina-court-commercial',
    verified: {
      agent: true,
      location: true,
      photos: true,
      video: true,
      documents: true,
      reviewer: 'Technical review · K. Mensah',
      reviewed_at: '2026-10-14',
    },
  },
  {
    id: 7,
    slug: 'lagune-bleue-hotel',
    title: 'Lagune Bleue Boutique Hotel',
    location: 'Grand-Bassam, Grand-Bassam',
    district: 'Grand-Bassam',
    city: 'Grand-Bassam',
    price: 285000000,
    currency: 'XOF',
    intent: 'sale',
    intent_label: 'For sale',
    type: 'Hotel',
    bedrooms: 18,
    bathrooms: 18,
    area: 1250,
    image: img('photo-1582719478250-c89cae4dc85b', 1400),
    gallery: [
      img('photo-1582719478250-c89cae4dc85b', 1600),
      img('photo-1445019980597-93fa8acb246c', 1600),
    ],
    agent: AGENTS.aya,
    tags: ['Pool', 'Restaurant', 'Beachfront', 'Security'],
    description:
      'Eighteen-key boutique property on the lagoon side of Grand-Bassam, trading since 2019 with an established bookings base.',
    lat: 5.2058,
    lng: -3.7386,
    published: '2026-09-08',
    views: 3320,
    href: '/properties/lagune-bleue-hotel',
    verified: {
      agent: true,
      location: true,
      photos: true,
      video: true,
      documents: true,
      reviewer: 'Technical review · K. Mensah',
      reviewed_at: '2026-09-08',
    },
  },
  {
    id: 8,
    slug: 'akwaba-family-home',
    title: 'Akwaba Family Home',
    location: 'Yopougon, Abidjan',
    district: 'Yopougon',
    city: 'Abidjan',
    price: 24500000,
    currency: 'XOF',
    intent: 'sale',
    intent_label: 'For sale',
    type: 'House',
    bedrooms: 3,
    bathrooms: 2,
    area: 165,
    image: img('photo-1568605114967-8130f3a36994', 1400),
    gallery: [
      img('photo-1568605114967-8130f3a36994', 1600),
      img('photo-1600585154526-990dced4db0d', 1600),
    ],
    agent: AGENTS.jeanmarc,
    tags: ['Garden', 'Parking', 'Borehole'],
    description:
      'Practical three-bedroom home on a quiet residential street, within walking distance of schools and a market.',
    lat: 5.3364,
    lng: -4.0856,
    published: '2026-10-05',
    views: 733,
    href: '/properties/akwaba-family-home',
    verified: {
      agent: true,
      location: true,
      photos: true,
      video: true,
      documents: true,
      reviewer: 'Technical review · K. Mensah',
      reviewed_at: '2026-10-05',
    },
  },
  {
    id: 9,
    slug: 'riviera-terrace-duplex',
    title: 'Riviera Terrace Duplex',
    location: 'Riviera 4, Abidjan',
    district: 'Riviera 4',
    city: 'Abidjan',
    price: 1800000,
    currency: 'XOF',
    intent: 'rent',
    intent_label: 'Per month',
    type: 'House',
    bedrooms: 4,
    bathrooms: 3,
    area: 240,
    image: img('photo-1570129477492-45c003edd2be', 1400),
    gallery: [
      img('photo-1570129477492-45c003edd2be', 1600),
      img('photo-1600566753190-17f0baa2a6c3', 1600),
    ],
    agent: AGENTS.fatou,
    tags: ['Garden', 'Parking', 'Security', 'Air conditioning'],
    description:
      'Duplex with a private garden in a gated Riviera 4 compound. Available unfurnished from November.',
    lat: 5.3711,
    lng: -3.9403,
    published: '2026-10-16',
    views: 189,
    href: '/properties/riviera-terrace-duplex',
    verified: {
      agent: true,
      location: true,
      photos: true,
      video: true,
      documents: true,
      reviewer: 'Technical review · K. Mensah',
      reviewed_at: '2026-10-16',
    },
  },
  {
    id: 10,
    slug: 'galerie-marchande-ivoire',
    title: 'Galerie Marchande & Boutique Ivoire',
    location: 'Plateau, Abidjan',
    district: 'Plateau',
    city: 'Abidjan',
    price: 95000000,
    currency: 'XOF',
    intent: 'sale',
    intent_label: 'For sale',
    type: 'Shop',
    bedrooms: 0,
    bathrooms: 2,
    area: 185,
    image: img('photo-1441986300917-64674bd600d8', 1400),
    gallery: [
      img('photo-1441986300917-64674bd600d8', 1600),
      img('photo-1497366754035-f200968a6e72', 1600),
    ],
    agent: AGENTS.fatou,
    tags: ['Street frontage', 'Parking', 'Security', 'Air conditioning'],
    description:
      'Emplacement commercial de premier ordre au cœur du Plateau d’Abidjan. Vitrine de 14 mètres sur axe passant, réserve sécurisée et double accès. Idéal pour enseigne internationale ou showroom haut de gamme.',
    lat: 5.3268,
    lng: -4.0182,
    published: '2026-10-20',
    views: 890,
    href: '/properties/galerie-marchande-ivoire',
    verified: {
      agent: true,
      location: true,
      photos: true,
      video: true,
      documents: true,
      reviewer: 'Technical review · K. Mensah',
      reviewed_at: '2026-10-20',
    },
  },
  {
    id: 11,
    slug: 'residence-palmier-hotel',
    title: 'Résidence Hôtelière & Écolodge Palmier',
    location: 'Assinie-Mafia, Assinie',
    district: 'Assinie',
    city: 'Assinie',
    price: 4500000,
    currency: 'XOF',
    intent: 'rent',
    intent_label: 'Per month',
    type: 'Hotel',
    bedrooms: 14,
    bathrooms: 14,
    area: 920,
    image: img('photo-1566073771259-6a8506099945', 1400),
    gallery: [
      img('photo-1566073771259-6a8506099945', 1600),
      img('photo-1582719478250-c89cae4dc85b', 1600),
    ],
    agent: AGENTS.aya,
    tags: ['Pool', 'Restaurant', 'Beachfront', 'Security', 'Borehole'],
    description:
      'Complexe hôtelier pieds dans l’eau en gérance locative professionnelle. 14 bungalows climatisés, restaurant panoramique, piscine lagon et ponton d’amarrage privé sur la lagune d’Assinie.',
    lat: 5.1321,
    lng: -3.2845,
    published: '2026-10-22',
    views: 1450,
    href: '/properties/residence-palmier-hotel',
    verified: {
      agent: true,
      location: true,
      photos: true,
      video: true,
      documents: true,
      reviewer: 'Technical review · K. Mensah',
      reviewed_at: '2026-10-22',
    },
  },
  {
    id: 12,
    slug: 'domaine-foncier-san-pedro',
    title: 'Domaine Foncier San Pedro Titré ACD',
    location: 'San Pedro, Côte d’Ivoire',
    district: 'San Pedro',
    city: 'San Pedro',
    price: 34000000,
    currency: 'XOF',
    intent: 'sale',
    intent_label: 'For sale',
    type: 'Land',
    bedrooms: 0,
    bathrooms: 0,
    area: 1250,
    image: img('photo-1500382017468-9049fed747ef', 1400),
    gallery: [img('photo-1500382017468-9049fed747ef', 1600)],
    agent: AGENTS.jeanmarc,
    tags: ['Titled', 'Corner plot', 'Road access'],
    description:
      'Terrain exceptionnel de 1 250 m² avec Arrêté de Concession Définitive (ACD) délivré par le Ministère de la Construction. Zone résidentielle et logistique en plein essor avec accès bitumé immédiat.',
    lat: 4.7485,
    lng: -6.6363,
    published: '2026-10-24',
    views: 520,
    href: '/properties/domaine-foncier-san-pedro',
    verified: {
      agent: true,
      location: true,
      photos: true,
      video: true,
      documents: true,
      reviewer: 'Technical review · K. Mensah',
      reviewed_at: '2026-10-24',
    },
  },
];

export const CURRENCIES = {
  XOF: { code: 'XOF', name: 'West African CFA franc', symbol: 'F CFA', decimals: 0, rate: 1.0 },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, rate: 0.0017 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, rate: 0.0015 },
  NGN: { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimals: 0, rate: 2.6 },
  GHS: { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', decimals: 2, rate: 0.021 },
};

export const PAGES_DATA = [
  {
    slug: 'how-verification-works',
    group: 'trust',
    sort: 1,
    en: {
      title: 'How verification works',
      body: `Every listing passes four checks before it can appear on ChiChoc-Habitat.\n\n**Agent identity.** The person listing the property submits a government ID and completes a liveness check. Our trust team compares the face to the document and approves the agent before they can list anything.\n\n**Location.** Photos may only be captured inside the app, and capture is blocked unless the device is within 100 metres of the stated address. The recorded coordinates are stored with each photograph.\n\n**Photography.** A checklist generated from the property's claimed features must be completed. A house with three bedrooms needs photographs of each bedroom. Capture cannot be skipped or uploaded from a gallery.\n\n**Documents.** Title, ownership, and where relevant an ADU certificate are reviewed by the legal team and routed to the correct department automatically.\n\nOnly after all four stages does a reviewer publish the listing. The decision is recorded permanently and cannot be edited.`,
    },
    fr: {
      title: 'Comment fonctionne la vérification',
      body: `Chaque annonce passe quatre contrôles avant d'apparaître sur ChiChoc-Habitat.\n\n**Identité de l'agent.** La personne qui publie le bien fournit une pièce d'identité officielle et réalise un contrôle de présence réelle. Notre équipe confiance compare le visage au document et approuve l'agent avant toute publication.\n\n**Localisation.** Les photos ne peuvent être prises que depuis l'application, et la capture est bloquée si l'appareil se trouve à plus de 100 mètres de l'adresse indiquée. Les coordonnées enregistrées sont conservées avec chaque photographie.\n\n**Photographie.** Une liste de photos générée à partir des caractéristiques annoncées du bien doit être complétée. Une maison de trois chambres exige une photo de chaque chambre. Aucune capture ne peut être ignorée ni importée depuis une galerie.\n\n**Documents.** Le titre, la propriété et, le cas échéant, l'ADU sont examinés par l'équipe juridique et transmis automatiquement au service compétent.\n\nCe n'est qu'après ces quatre étapes qu'un vérificateur publie l'annonce. La décision est enregistrée de façon permanente et ne peut pas être modifiée.`,
    },
  },
  {
    slug: 'agent-standards',
    group: 'trust',
    sort: 2,
    en: {
      title: 'Agent standards',
      body: `Agents on ChiChoc-Habitat agree to a higher standard than a typical listing portal.\n\n- List only properties you are authorised to represent.\n- Complete KYC before your first listing, and keep it current.\n- Capture every photograph on site. Stock imagery is grounds for immediate removal.\n- Respond to customer enquiries within one business day.\n- Never request payment outside the platform.\n\nRepeated or serious breaches result in suspension. Every action we take is logged and reviewable.`,
    },
    fr: {
      title: 'Exigences pour les agents',
      body: `Les agents de ChiChoc-Habitat s'engagent à un niveau d'exigence supérieur à celui d'un portail d'annonces classique.\n\n- Ne publiez que des biens que vous êtes autorisé à représenter.\n- Réalisez votre KYC avant votre première annonce et maintenez-le à jour.\n- Prenez chaque photographie sur place. Les images de stock entraînent un retrait immédiat.\n- Répondez aux demandes des clients sous un jour ouvré.\n- Ne demandez jamais de paiement en dehors de la plateforme.\n\nTout manquement grave ou répété entraîne une suspension. Chacune de nos décisions est journalisée et peut être examinée.`,
    },
  },
  {
    slug: 'document-checks',
    group: 'trust',
    sort: 3,
    en: {
      title: 'Document checks',
      body: `Land and property documents are checked by our legal department before a listing goes live.\n\nWe review the **ADU** (Attestation de Droit d'Usage) and, where applicable, the **IDUFCI** parcel identifier. Ownership documents must match the identity of the person listing the property, or a valid mandate must be on file.\n\nDocuments are encrypted at rest, visible only to the legal team for the property in question, and never shared with buyers beyond the verification badge and the facts we publish.`,
    },
    fr: {
      title: 'Vérification des documents',
      body: `Les documents fonciers et immobiliers sont contrôlés par notre service juridique avant la mise en ligne d'une annonce.\n\nNous examinons l'**ADU** (Attestation de Droit d'Usage) et, le cas échéant, l'identifiant de parcelle **IDUFCI**. Les documents de propriété doivent correspondre à l'identité de la personne qui publie le bien, ou un mandat valide doit être au dossier.\n\nLes documents sont chiffrés au repos, visibles uniquement par l'équipe juridique en charge du bien concerné, et jamais communiqués aux acheteurs au-delà du badge de vérification et des informations que nous publions.`,
    },
  },
  {
    slug: 'security',
    group: 'trust',
    sort: 4,
    en: {
      title: 'Security',
      body: `Security is a product requirement, not a feature.\n\n- All traffic is served over TLS 1.3.\n- Passwords are hashed with Argon2id.\n- Documents and identity files are encrypted at rest with AES-256.\n- VPN and proxy traffic is blocked at the edge to reduce fraud.\n- Every back-office action is written to an append-only audit log that cannot be deleted, including by an administrator.\n- Back-office access requires multi-factor authentication and a role-based permission grant.\n\nIf you believe you have found a vulnerability, contact security@chichochabitat.ci.`,
    },
    fr: {
      title: 'Sécurité',
      body: `La sécurité est une exigence produit, pas une option.\n\n- Tout le trafic est servi en TLS 1.3.\n- Les mots de passe sont hachés avec Argon2id.\n- Les documents et fichiers d'identité sont chiffrés au repos en AES-256.\n- Le trafic VPN et proxy est bloqué en amont pour réduire la fraude.\n- Chaque action d'administration est écrite dans un journal d'audit non modifiable, y compris par un administrateur.\n- L'accès à l'administration exige l'authentification multifacteur et une autorisation fondée sur les rôles.\n\nSi vous pensez avoir découvert une faille, écrivez à security@chichochabitat.ci.`,
    },
  },
  {
    slug: 'about',
    group: 'company',
    sort: 1,
    en: {
      title: 'About ChiChoc-Habitat',
      body: `ChiChoc-Habitat exists because buying property in Côte d'Ivoire should not require blind trust.\n\nWe built a marketplace where the physical reality of a property is confirmed before a buyer ever sees it: photographs taken on site with GPS proof, agents whose identity has been verified, and documents reviewed by lawyers.\n\nWe are headquartered in Abidjan and designed from the start to operate across multiple countries and currencies.`,
    },
    fr: {
      title: 'À propos de ChiChoc-Habitat',
      body: `ChiChoc-Habitat existe parce qu'acheter un bien en Côte d'Ivoire ne devrait pas exiger une confiance aveugle.\n\nNous avons construit une place de marché où la réalité physique d'un bien est confirmée avant même que l'acheteur ne la voie : des photographies prises sur place avec preuve GPS, des agents dont l'identité est vérifiée et des documents examinés par des juristes.\n\nNotre siège est à Abidjan et la plateforme est conçue dès le départ pour opérer dans plusieurs pays et plusieurs devises.`,
    },
  },
  {
    slug: 'careers',
    group: 'company',
    sort: 2,
    en: {
      title: 'Careers',
      body: `We hire people who care about getting the detail right.\n\nThere are no open roles advertised at the moment. If you work in verification, legal property review, or full-stack engineering and want to be considered for future openings, write to careers@chichochabitat.ci with a short note about what you would improve.`,
    },
    fr: {
      title: 'Carrières',
      body: `Nous recrutons des personnes attachées au souci du détail.\n\nAucun poste n'est ouvert au public pour le moment. Si vous travaillez dans la vérification, la revue juridique immobilière ou l'ingénierie full-stack et souhaitez être considéré pour de futures ouvertures, écrivez à careers@chichochabitat.ci avec une courte note sur ce que vous amélioreriez.`,
    },
  },
  {
    slug: 'press',
    group: 'company',
    sort: 3,
    en: {
      title: 'Press',
      body: `For interviews, data requests, or brand assets, contact press@chichochabitat.ci.\n\nWe publish verified market data quarterly. Journalists may request aggregate figures on listings, approval rates, and regional pricing without customer-identifying information.`,
    },
    fr: {
      title: 'Presse',
      body: `Pour les entretiens, les demandes de données ou les éléments de marque, contactez press@chichochabitat.ci.\n\nNous publions chaque trimestre des données de marché vérifiées. Les journalistes peuvent demander des chiffres agrégés sur les annonces, les taux d'approbation et les prix régionaux, sans information permettant d'identifier un client.`,
    },
  },
  {
    slug: 'contact',
    group: 'company',
    sort: 4,
    en: {
      title: 'Contact',
      body: `We answer every message.\n\n**General enquiries** — hello@chichochabitat.ci\n**Trust and safety** — trust@chichochabitat.ci\n**Security disclosures** — security@chichochabitat.ci\n**Press** — press@chichochabitat.ci\n\nOur office is in Cocody, Abidjan. Visits are by appointment.`,
    },
    fr: {
      title: 'Contact',
      body: `Nous répondons à chaque message.\n\n**Demandes générales** — hello@chichochabitat.ci\n**Confiance et sécurité** — trust@chichochabitat.ci\n**Signalement de faille** — security@chichochabitat.ci\n**Presse** — press@chichochabitat.ci\n\nNotre bureau se trouve à Cocody, Abidjan. Les visites se font sur rendez-vous.`,
    },
  },
  {
    slug: 'terms',
    group: 'legal',
    sort: 1,
    en: {
      title: 'Terms & Conditions',
      body: `These terms govern your use of ChiChoc-Habitat. By creating an account you accept them.\n\n**1. Accounts.** You must provide accurate information and keep your credentials secure. You are responsible for activity under your account.\n\n**2. Listings.** Agents warrant that they are authorised to list a property and that all information and media is accurate. Listings are published only after verification. We may remove any listing that fails review.\n\n**3. Fees.** The price shown to a customer includes the platform fee. Agents are told their payout. Fees are configured per property and transaction type and are displayed before an offer is made.\n\n**4. Offers.** An accepted offer creates a binding agreement between buyer and seller or landlord and tenant. We record the acceptance permanently; the chat closes but the record remains.\n\n**5. Prohibited conduct.** No fraudulent listings, no off-platform payment requests, no scraping, no attempts to circumvent verification.\n\n**6. Liability.** We verify identity, location, and documents in good faith but do not guarantee a property's condition. Independent inspection is always recommended.\n\n**7. Governing law.** These terms are governed by the laws of Côte d'Ivoire.`,
    },
    fr: {
      title: 'Conditions générales',
      body: `Les présentes conditions régissent votre utilisation de ChiChoc-Habitat. En créant un compte, vous les acceptez.\n\n**1. Comptes.** Vous devez fournir des informations exactes et garder vos identifiants confidentiels. Vous êtes responsable de l'activité effectuée avec votre compte.\n\n**2. Annonces.** Les agents garantissent qu'ils sont autorisés à publier un bien et que toutes les informations et tous les médias sont exacts. Les annonces ne sont publiées qu'après vérification. Nous pouvons retirer toute annonce qui échoue au contrôle.\n\n**3. Frais.** Le prix affiché au client inclut les frais de plateforme. Les agents connaissent leur reversement. Les frais sont configurés par type de bien et de transaction et affichés avant toute offre.\n\n**4. Offres.** Une offre acceptée crée un accord ferme entre acheteur et vendeur ou bailleur et locataire. Nous enregistrons l'acceptation de façon permanente : la conversation se ferme mais l'enregistrement demeure.\n\n**5. Conduites interdites.** Aucune annonce frauduleuse, aucune demande de paiement hors plateforme, aucune extraction automatisée de données, aucune tentative de contourner la vérification.\n\n**6. Responsabilité.** Nous vérifions l'identité, la localisation et les documents de bonne foi, mais ne garantissons pas l'état d'un bien. Une inspection indépendante reste toujours recommandée.\n\n**7. Droit applicable.** Les présentes conditions sont régies par le droit ivoirien.`,
    },
  },
  {
    slug: 'privacy',
    group: 'legal',
    sort: 2,
    en: {
      title: 'Privacy Policy',
      body: `We collect only what verification requires.\n\n**What we collect.** Account details (name, email, phone), identity documents and liveness captures for agents, property media including GPS coordinates, and usage logs.\n\n**Why.** To verify identity, confirm that a property exists where it is claimed to be, prevent fraud, and meet legal obligations.\n\n**Who sees it.** Identity documents are visible only to the verification team for the property in question. Buyers see the verification outcome, never the underlying document.\n\n**Retention.** Verification records are retained for the life of the account plus the period required by Ivorian law, because they underpin the audit log.\n\n**Your rights.** You may request access to, correction of, or deletion of your personal data, subject to legal retention requirements. Write to privacy@chichochabitat.ci.`,
    },
    fr: {
      title: 'Politique de confidentialité',
      body: `Nous ne collectons que ce que la vérification exige.\n\n**Ce que nous collectons.** Les données de compte (nom, e-mail, téléphone), les pièces d'identité et captures de présence réelle pour les agents, les médias des biens y compris les coordonnées GPS, ainsi que les journaux d'utilisation.\n\n**Pourquoi.** Pour vérifier l'identité, confirmer qu'un bien existe bien à l'endroit annoncé, prévenir la fraude et respecter nos obligations légales.\n\n**Qui y a accès.** Les pièces d'identité ne sont visibles que par l'équipe de vérification en charge du bien concerné. Les acheteurs voient le résultat de la vérification, jamais le document lui-même.\n\n**Conservation.** Les dossiers de vérification sont conservés pendant la durée de vie du compte, puis pendant la période exigée par la loi ivoirienne, car ils fondent le journal d'audit.\n\n**Vos droits.** Vous pouvez demander l'accès à vos données personnelles, leur rectification ou leur suppression, sous réserve des obligations légales de conservation. Écrivez à privacy@chichochabitat.ci.`,
    },
  },
  {
    slug: 'cookies',
    group: 'legal',
    sort: 3,
    en: {
      title: 'Cookie Policy',
      body: `We use a small number of cookies and local storage entries, all of which are necessary for the site to work.\n\n- **Session cookie** — keeps you signed in.\n- **CSRF token** — protects forms against cross-site request forgery.\n- **Language preference** — remembers whether you chose French or English, so the site opens in your language next time.\n- **Currency preference** — remembers your chosen display currency.\n\nWe do not use advertising cookies and we do not sell data to third parties.`,
    },
    fr: {
      title: 'Politique relative aux cookies',
      body: `Nous utilisons un petit nombre de cookies et d'entrées de stockage local, tous nécessaires au fonctionnement du site.\n\n- **Cookie de session** — vous garde connecté.\n- **Jeton CSRF** — protège les formulaires contre les requêtes intersites.\n- **Préférence de langue** — mémorise votre choix entre le français et l'anglais, afin que le site s'ouvre dans votre langue lors de votre prochaine visite.\n- **Préférence de devise** — mémorise la devise d'affichage choisie.\n\nNous n'utilisons pas de cookies publicitaires et ne vendons aucune donnée à des tiers.`,
    },
  },
];
