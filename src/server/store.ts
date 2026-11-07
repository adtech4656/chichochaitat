import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { INITIAL_PROPERTIES, AGENTS, PAGES_DATA, PropertyItem, Agent, DEFAULT_VIRTUAL_TOURS, VirtualTourRoom } from '../data/inventory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_DIR = path.resolve(__dirname, '../../storage');
const DB_FILE = path.join(STORAGE_DIR, 'app_data.json');

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'customer' | 'agent' | 'admin' | 'superadmin';
  initials: string;
  permissions: string[];
  member_since: string;
  saved_properties: number[];
  price_drop_subscriptions?: number[];
}

export interface Offer {
  id: number;
  user_id: number;
  property_id: number;
  amount: number;
  discount_percent: number;
  status: 'pending' | 'accepted' | 'rejected';
  placed: string;
  message: string;
  decided_at?: string;
  deal?: {
    reference: string;
    closed: string;
    terms: string;
  } | null;
}

export interface PaymentReceipt {
  receipt_number: string;
  transaction_ref: string;
  property_id: number;
  property_title: string;
  amount_xof: number;
  amount_formatted: string;
  currency_code: string;
  country: string;
  country_name: string;
  payment_method: string;
  operator_name: string;
  payer_name: string;
  payer_phone_or_account: string;
  paid_at: string;
  status: 'escrow_secured' | 'completed';
  escrow_guarantee: string;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  from: 'me' | 'agent';
  is_ai?: boolean;
  text: string;
  at: string;
  timestamp: number;
  is_receipt?: boolean;
  receipt?: PaymentReceipt;
}

export interface Conversation {
  id: number;
  created_by: number;
  property_id: number;
  agent_id: number;
  status: 'open' | 'closed';
  chat_state: string;
  closed_reason?: string | null;
  unread: number;
  last_message_at: string;
  deal?: {
    reference: string;
    closed: string;
    terms: string;
    amount_due?: number;
    amount_paid?: number;
    payment_status?: 'unpaid' | 'paid_escrow';
    receipt_number?: string;
  } | null;
  payment_required?: boolean;
  payment_amount?: number;
  payment_status?: 'unpaid' | 'paid_escrow';
  messages: ChatMessage[];
}

export interface VerificationItem {
  property_id: number;
  submitted: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'needs_info';
  gps_delta: number;
  required_shots: number;
  captured_shots: number;
  documents: number;
  agent_kyc: 'approved' | 'pending';
  internal_note?: string;
  reviewer?: string;
  decided_at?: string;
}

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  rate: number;
  is_live?: boolean;
  last_updated?: string;
}


export interface PropertyRequest {
  id: number;
  user_id: number;
  user_name: string;
  user_phone: string;
  user_email: string;
  intent: 'sale' | 'rent';
  type: string;
  city: string;
  district: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  lat?: number;
  lng?: number;
  bedrooms_min?: number;
  bathrooms_min?: number;
  surface_min?: number;
  facilities: string[];
  notes?: string;
  status: 'open' | 'claimed' | 'fulfilled';
  claimed_by_agent_id?: number;
  claimed_by_agent_name?: string;
  claimed_at?: string;
  agent_response?: string;
  recommended_property_id?: number;
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  properties: PropertyItem[];
  offers: Offer[];
  conversations: Conversation[];
  verificationQueue: VerificationItem[];
  propertyRequests: PropertyRequest[];
  currencies: Record<string, CurrencyRate>;
  kycApplications: Array<{
    id: number;
    user_id?: number;
    name: string;
    email: string;
    phone: string;
    agency: string;
    status: 'pending' | 'approved' | 'rejected';
    submitted_at: string;
  }>;
}

class Store {
  private data: DatabaseSchema;

  constructor() {
    this.ensureStorageDir();
    this.data = this.loadData();
  }

  private ensureStorageDir() {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.propertyRequests || parsed.propertyRequests.length === 0) {
          parsed.propertyRequests = this.getDefaultPropertyRequests();
        }
        return parsed;
      } catch (err) {
        console.warn('Failed to parse database file, reinitializing', err);
      }
    }
    return this.seedData();
  }

  private getDefaultPropertyRequests(): PropertyRequest[] {
    return [
      {
        id: 301,
        user_id: 1,
        user_name: 'Koffi Kouamé',
        user_phone: '+225 07 12 34 56',
        user_email: 'kouame@example.com',
        intent: 'sale',
        type: 'House',
        city: 'Abidjan',
        district: 'Cocody Riviera Golf',
        budget_min: 40000000,
        budget_max: 75000000,
        currency: 'XOF',
        lat: 5.3482,
        lng: -3.9781,
        bedrooms_min: 4,
        bathrooms_min: 3,
        surface_min: 220,
        facilities: ['Piscine', 'Sécurité 24/7', 'Groupe électrogène', 'Accès goudronné'],
        notes: 'Recherche villa familiale sécurisée avec ACD ou TF en règle. Prêt bancaire pré-approuvé.',
        status: 'claimed',
        claimed_by_agent_id: 2,
        claimed_by_agent_name: 'Aya Koffi',
        claimed_at: '2026-10-18T10:30:00Z',
        agent_response: 'Nous avons identifié la Villa Mansardée aux Deux-Plateaux et préparé le dossier ACD.',
        recommended_property_id: 1,
        created_at: '2026-10-17T14:22:00Z',
      },
      {
        id: 302,
        user_id: 1,
        user_name: 'Koffi Kouamé',
        user_phone: '+225 07 12 34 56',
        user_email: 'kouame@example.com',
        intent: 'rent',
        type: 'Shop',
        city: 'Abidjan',
        district: 'Marcory Zone 4',
        budget_min: 500000,
        budget_max: 1500000,
        currency: 'XOF',
        lat: 5.2912,
        lng: -3.9854,
        surface_min: 80,
        facilities: ['Climatisation', 'Accès goudronné', 'Parking clients', 'Sécurité 24/7'],
        notes: 'Local commercial vitrine passante pour boutique de prêt-à-porter de standing.',
        status: 'open',
        created_at: '2026-10-19T09:15:00Z',
      },
      {
        id: 303,
        user_id: 1,
        user_name: 'Mme Bamba Touré',
        user_phone: '+225 05 44 22 11',
        user_email: 'bamba.toure@ivoire-business.ci',
        intent: 'sale',
        type: 'Land',
        city: 'Bingerville',
        district: 'Bingerville Nouveau Quartier',
        budget_min: 20000000,
        budget_max: 45000000,
        currency: 'XOF',
        lat: 5.3585,
        lng: -3.8962,
        surface_min: 500,
        facilities: ['Accès goudronné', 'Eau & Électricité SODECI/CIE', 'Titre Foncier / ACD'],
        notes: 'Terrain plat constructible immédiatement avec arrêté de concession définitive (ACD) pour projet résidentiel.',
        status: 'open',
        created_at: '2026-10-20T11:40:00Z',
      },
    ];
  }

  private saveData() {
    try {
      this.ensureStorageDir();
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database file', err);
    }
  }

  private seedData(): DatabaseSchema {
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);

    const users: User[] = [
      {
        id: 1,
        name: 'Koffi Kouamé',
        username: 'kouame',
        email: 'kouame@example.com',
        phone: '+225 07 12 34 56',
        passwordHash: defaultPasswordHash,
        role: 'customer',
        initials: 'KK',
        permissions: ['view_properties', 'create_offers', 'send_messages'],
        member_since: 'October 2025',
        saved_properties: [4, 7, 9],
      },
      {
        id: 2,
        name: 'Aya Koffi',
        username: 'ayakoffi',
        email: 'aya@koffi-immobilier.ci',
        phone: '+225 07 00 00 01',
        passwordHash: defaultPasswordHash,
        role: 'agent',
        initials: 'AK',
        permissions: ['view_properties', 'manage_properties', 'receive_chats'],
        member_since: 'March 2021',
        saved_properties: [],
      },
      {
        id: 3,
        name: 'Jean-Marc Diallo',
        username: 'jmdiallo',
        email: 'jeanmarc@atlas.ci',
        phone: '+225 07 00 00 02',
        passwordHash: defaultPasswordHash,
        role: 'agent',
        initials: 'JD',
        permissions: ['view_properties', 'manage_properties', 'receive_chats'],
        member_since: 'January 2022',
        saved_properties: [],
      },
      {
        id: 4,
        name: 'Admin ChiChoc',
        username: 'admin',
        email: 'admin@chichochabitat.ci',
        phone: '+225 07 99 99 99',
        passwordHash: adminPasswordHash,
        role: 'admin',
        initials: 'AC',
        permissions: ['view_admin', 'verify_properties', 'manage_users', 'site_settings'],
        member_since: 'January 2020',
        saved_properties: [],
      },
    ];

    const properties: PropertyItem[] = JSON.parse(JSON.stringify(INITIAL_PROPERTIES));

    const offers: Offer[] = [
      {
        id: 101,
        user_id: 1,
        property_id: 1,
        amount: 51500000,
        discount_percent: 3,
        status: 'pending',
        placed: '2 days ago',
        message: 'Offer submitted with verified proof of funds.',
      },
      {
        id: 102,
        user_id: 1,
        property_id: 2,
        amount: 37000000,
        discount_percent: 7,
        status: 'pending',
        placed: '5 hours ago',
        message: 'Interested in closing before end of month.',
      },
      {
        id: 103,
        user_id: 1,
        property_id: 3,
        amount: 1200000,
        discount_percent: 10,
        status: 'accepted',
        placed: 'Accepted yesterday',
        message: 'Approved twelve-month lease.',
        decided_at: '16 Oct 2026, 14:32',
        deal: {
          reference: 'CCH-2026-0482',
          closed: '16 Oct 2026, 14:32',
          terms: '12-month lease · 2 months deposit',
        },
      },
    ];

    const conversations: Conversation[] = [
      {
        id: 201,
        created_by: 1,
        property_id: 1,
        agent_id: 1,
        status: 'open',
        chat_state: 'negotiating',
        unread: 0,
        last_message_at: 'Yesterday, 09:24',
        messages: [
          { id: 1, user_id: 2, from: 'agent', text: 'Good morning — the residence is still available. Would you like to see it this week?', at: 'Yesterday, 09:14', timestamp: Date.now() - 86400000 },
          { id: 2, user_id: 1, from: 'me', text: 'Yes please. Is Saturday morning possible?', at: 'Yesterday, 09:21', timestamp: Date.now() - 86000000 },
          { id: 3, user_id: 2, from: 'agent', text: 'Saturday at 10:00 works. I will bring the title documents.', at: 'Yesterday, 09:24', timestamp: Date.now() - 85000000 },
        ],
      },
      {
        id: 202,
        created_by: 1,
        property_id: 3,
        agent_id: 3,
        status: 'closed',
        chat_state: 'deal_closed',
        closed_reason: 'Offer accepted',
        unread: 0,
        last_message_at: '16 Oct 2026, 14:32',
        deal: {
          reference: 'CCH-2026-0482',
          closed: '16 Oct 2026, 14:32',
          terms: '12-month lease · 2 months deposit',
        },
        messages: [],
      },
    ];

    const verificationQueue: VerificationItem[] = properties.map((prop, index) => ({
      property_id: prop.id,
      submitted: prop.published,
      status: index === 0 ? 'in_review' : index < 4 ? 'pending' : 'approved',
      gps_delta: [12, 34, 8, 61, 19, 4, 27, 44, 9][index] ?? 10,
      required_shots: 8,
      captured_shots: index === 5 ? 6 : 8,
      documents: index === 5 ? 2 : 3,
      agent_kyc: index === 5 ? 'pending' : 'approved',
    }));

    const currencies: Record<string, CurrencyRate> = {
      XOF: { code: 'XOF', name: 'West African CFA franc', symbol: 'F CFA', decimals: 0, rate: 1.0 },
      USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, rate: 0.0017 },
      EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, rate: 0.0015 },
      NGN: { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimals: 0, rate: 2.6 },
      GHS: { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', decimals: 2, rate: 0.021 },
    };

    const initial = {
      users,
      properties,
      offers,
      conversations,
      verificationQueue,
      propertyRequests: this.getDefaultPropertyRequests(),
      currencies,
      kycApplications: [],
    };

    return initial;
  }

  // --- Users & Auth ---
  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  public getUserById(id: number): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(name: string, email: string, phone: string, passwordPlain: string): User {
    const existing = this.getUserByEmail(email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const words = name.trim().split(/\s+/);
    const initials = words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

    const newUser: User = {
      id: Date.now(),
      name: name.trim(),
      username: email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ''),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      passwordHash: bcrypt.hashSync(passwordPlain, 10),
      role: 'customer',
      initials,
      permissions: ['view_properties', 'create_offers', 'send_messages'],
      member_since: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      saved_properties: [],
    };

    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  // --- Properties ---
  public getProperties(user?: User | null): PropertyItem[] {
    const savedIds = new Set(user?.saved_properties || []);
    const subscribedIds = new Set(user?.price_drop_subscriptions || []);
    return this.data.properties.map((p) => ({
      ...p,
      virtual_tours: p.virtual_tours || DEFAULT_VIRTUAL_TOURS,
      saved: savedIds.has(p.id),
      price_drop_subscribed: subscribedIds.has(p.id),
    }));
  }

  public getPublishedProperties(user?: User | null): PropertyItem[] {
    const approvedIds = new Set(
      this.data.verificationQueue
        .filter((q) => q.status === 'approved')
        .map((q) => q.property_id),
    );

    // If an item was originally published or approved in queue
    return this.getProperties(user).filter((p) => approvedIds.has(p.id) || p.id <= 12);
  }

  public getPropertyBySlug(slug: string, user?: User | null): PropertyItem | undefined {
    const prop = this.getProperties(user).find((p) => p.slug === slug);
    if (prop) {
      prop.views = (prop.views || 0) + 1;
      this.saveData();
    }
    return prop;
  }

  public getPropertyById(id: number, user?: User | null): PropertyItem | undefined {
    return this.getProperties(user).find((p) => p.id === id);
  }

  public toggleSaveProperty(userId: number, propertyId: number): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;

    if (!Array.isArray(user.saved_properties)) {
      user.saved_properties = [];
    }

    const idx = user.saved_properties.indexOf(propertyId);
    let saved = false;
    if (idx >= 0) {
      user.saved_properties.splice(idx, 1);
      saved = false;
    } else {
      user.saved_properties.push(propertyId);
      saved = true;
    }
    this.saveData();
    return saved;
  }

  public getSavedPropertiesForUser(userId: number): PropertyItem[] {
    const user = this.getUserById(userId);
    if (!user) return [];
    const savedSet = new Set(user.saved_properties || []);
    return this.getProperties(user).filter((p) => savedSet.has(p.id)).map((p) => ({ ...p, saved: true }));
  }

  public getPropertiesBySavedIds(ids: number[], currentUser?: User): PropertyItem[] {
    const savedSet = new Set(ids);
    const properties = this.getProperties(currentUser);
    return properties
      .filter((p) => savedSet.has(p.id))
      .map((p) => ({ ...p, saved: true }));
  }

  public getPropertiesByIds(ids: number[], currentUser?: User): PropertyItem[] {
    const idSet = new Set(ids);
    const properties = this.getProperties(currentUser);
    return properties.filter((p) => idSet.has(p.id));
  }


  public mergeGuestWishlist(userId: number, guestIds: number[]): number[] {
    const user = this.getUserById(userId);
    if (!user) return [];
    if (!Array.isArray(user.saved_properties)) {
      user.saved_properties = [];
    }
    for (const gid of guestIds) {
      if (!user.saved_properties.includes(gid)) {
        user.saved_properties.push(gid);
      }
    }
    this.saveData();
    return user.saved_properties;
  }

  public togglePriceDropSubscription(userId: number, propertyId: number): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;

    if (!Array.isArray(user.price_drop_subscriptions)) {
      user.price_drop_subscriptions = [];
    }

    const idx = user.price_drop_subscriptions.indexOf(propertyId);
    let subscribed = false;
    if (idx >= 0) {
      user.price_drop_subscriptions.splice(idx, 1);
      subscribed = false;
    } else {
      user.price_drop_subscriptions.push(propertyId);
      subscribed = true;
    }
    this.saveData();
    return subscribed;
  }

  public isUserSubscribedToPriceDrop(userId: number, propertyId: number): boolean {
    const user = this.getUserById(userId);
    if (!user || !Array.isArray(user.price_drop_subscriptions)) return false;
    return user.price_drop_subscriptions.includes(propertyId);
  }

  public getPriceDropSubscriptionsForUser(userId: number): PropertyItem[] {
    const user = this.getUserById(userId);
    if (!user) return [];
    const subscribedSet = new Set(user.price_drop_subscriptions || []);
    return this.getProperties(user).filter((p) => subscribedSet.has(p.id));
  }

  // --- Agents ---
  public getAgents(): Agent[] {
    return Object.values(AGENTS);
  }

  public getAgentById(id: number): Agent | undefined {
    return Object.values(AGENTS).find((a) => a.id === id);
  }

  public getAgentBySlugOrId(idOrSlug: string | number): Agent | undefined {
    if (typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug))) {
      const numericId = Number(idOrSlug);
      const byId = Object.values(AGENTS).find((a) => a.id === numericId);
      if (byId) return byId;
    }
    const slugStr = String(idOrSlug).toLowerCase();
    return Object.values(AGENTS).find(
      (a) => a.slug === slugStr || a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slugStr || String(a.id) === slugStr
    );
  }

  public getPropertiesByAgentId(agentId: number, user?: User | null): PropertyItem[] {
    const agent = this.getAgentById(agentId);
    return this.getPublishedProperties(user).filter((p) => {
      if (p.agent && p.agent.id === agentId) return true;
      if (agent && p.agent && p.agent.name.toLowerCase() === agent.name.toLowerCase()) return true;
      return false;
    });
  }

  // --- Offers ---
  public getOffersForUser(userId: number) {
    return this.data.offers
      .filter((o) => o.user_id === userId)
      .map((o) => {
        const prop = this.getPropertyById(o.property_id);
        const agent = prop?.agent || AGENTS.aya;
        return {
          id: o.id,
          amount: o.amount,
          discount_percent: o.discount_percent,
          status: o.status,
          placed: o.placed,
          message: o.message,
          agent,
          deal: o.deal || null,
          property: prop
            ? {
                id: prop.id,
                slug: prop.slug,
                title: prop.title,
                href: prop.href,
                image: prop.image,
                location: prop.location,
                price: prop.price,
                intent: prop.intent,
              }
            : null,
        };
      });
  }

  public createOffer(userId: number, propertyId: number, amount: number, discountPercent: number, message: string): Offer {
    const prop = this.getPropertyById(propertyId);
    if (!prop) throw new Error('Property not found');

    const newOffer: Offer = {
      id: Date.now(),
      user_id: userId,
      property_id: propertyId,
      amount,
      discount_percent: discountPercent,
      status: 'pending',
      placed: 'Just now',
      message: message || '',
    };

    this.data.offers.unshift(newOffer);
    this.saveData();
    return newOffer;
  }

  public acceptOffer(offerId: number): Offer | null {
    const offer = this.data.offers.find((o) => o.id === offerId);
    if (!offer) return null;

    const prop = this.getPropertyById(offer.property_id);
    const dateFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + `, ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

    const deal = {
      reference: `CCH-${new Date().getFullYear()}-${String(offer.id).slice(-4)}`,
      closed: dateFormatted,
      terms: prop?.intent === 'rent' ? '12-month lease signed' : 'Deed of sale pending notary',
    };

    offer.status = 'accepted';
    offer.decided_at = dateFormatted;
    offer.deal = deal;

    // Also close any related conversation
    const convo = this.data.conversations.find((c) => c.property_id === offer.property_id && c.created_by === offer.user_id);
    if (convo) {
      convo.status = 'closed';
      convo.chat_state = 'deal_closed';
      convo.closed_reason = 'Offer accepted';
      convo.deal = deal;
    }

    this.saveData();
    return offer;
  }

  public rejectOffer(offerId: number): Offer | null {
    const offer = this.data.offers.find((o) => o.id === offerId);
    if (!offer) return null;

    offer.status = 'rejected';
    this.saveData();
    return offer;
  }

  // --- Conversations & Chat ---
  public getConversationsForUser(userId: number) {
    return this.data.conversations
      .filter((c) => c.created_by === userId || c.agent_id === userId)
      .map((c) => {
        const prop = this.getPropertyById(c.property_id);
        const agent = prop?.agent || AGENTS.aya;
        const defaultDue = prop?.intent === 'rent' ? 500000 : 2500000;
        const amountDue = c.payment_amount || c.deal?.amount_due || defaultDue;
        return {
          id: c.id,
          status: c.status,
          chat_state: c.chat_state,
          closed_reason: c.closed_reason || null,
          unread: c.unread || 0,
          agent,
          property: {
            id: prop?.id,
            slug: prop?.slug || '',
            title: prop?.title || 'Property',
            location: prop?.location || '',
            price: prop?.price || 0,
            intent: prop?.intent || 'sale',
            image: prop?.image || '',
          },
          messages: c.messages,
          deal: c.deal || null,
          payment_required: c.payment_required !== false,
          payment_amount: amountDue,
          payment_status: c.payment_status || (c.deal?.payment_status || 'unpaid'),
        };
      });
  }

  public processDealPayment(
    conversationId: number,
    paymentData: {
      country: string;
      method: string;
      operator: string;
      phoneNumber?: string;
      cardNumber?: string;
      cardHolder?: string;
      amount?: number;
    },
    user: User,
  ): { conversation: Conversation; receipt: PaymentReceipt } {
    let convo = this.data.conversations.find((c) => c.id === conversationId);
    if (!convo) {
      convo = this.data.conversations[0] || this.startConversation(user.id, 1, 'Accord sur le bien validé.');
    }

    const prop = this.getPropertyById(convo.property_id);
    const amountXof = paymentData.amount || convo.payment_amount || (prop?.intent === 'rent' ? 500000 : 2500000);
    const receiptNum = `REC-CCH-${Date.now().toString().slice(-6)}`;
    const txRef = `TX-ESCROW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const paidAt = new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const countryNames: Record<string, string> = {
      CI: "Côte d'Ivoire",
      SN: 'Sénégal',
      ML: 'Mali',
      BF: 'Burkina Faso',
      INT: 'International / Cartes Bancaires',
    };

    const receipt: PaymentReceipt = {
      receipt_number: receiptNum,
      transaction_ref: txRef,
      property_id: convo.property_id,
      property_title: prop?.title || 'Bien Immobilier Vérifié',
      amount_xof: amountXof,
      amount_formatted: `${amountXof.toLocaleString('fr-FR')} F CFA`,
      currency_code: 'XOF',
      country: paymentData.country || 'CI',
      country_name: countryNames[paymentData.country] || paymentData.country,
      payment_method: paymentData.method || 'mobile_money',
      operator_name: paymentData.operator || 'Wave',
      payer_name: user.name,
      payer_phone_or_account: paymentData.phoneNumber || (paymentData.cardNumber ? `•••• ${paymentData.cardNumber.slice(-4)}` : user.phone),
      paid_at: paidAt,
      status: 'escrow_secured',
      escrow_guarantee: 'Garantie Séquestre ChiChoc Habitat · Sécurité bancaire & notariée jusqu’à signature définitive',
    };

    // Update conversation deal state
    convo.payment_status = 'paid_escrow';
    convo.payment_amount = amountXof;
    convo.chat_state = 'escrow_funded';
    if (!convo.deal) {
      convo.deal = {
        reference: txRef,
        closed: paidAt,
        terms: `Acompte séquestré de ${amountXof.toLocaleString('fr-FR')} F CFA via ${receipt.operator_name}`,
        amount_due: amountXof,
        amount_paid: amountXof,
        payment_status: 'paid_escrow',
        receipt_number: receiptNum,
      };
    } else {
      convo.deal.amount_paid = amountXof;
      convo.deal.payment_status = 'paid_escrow';
      convo.deal.receipt_number = receiptNum;
    }

    // Automatically inject official receipt message into conversation chat
    const receiptMsg: ChatMessage = {
      id: Date.now(),
      user_id: convo.agent_id || 2,
      from: 'agent',
      is_receipt: true,
      receipt,
      text: `✓ Acompte sécurisé de ${amountXof.toLocaleString('fr-FR')} F CFA validé via ${receipt.operator_name} (${receipt.country_name}). Référence séquestre: ${txRef}. Les fonds sont placés sous séquestre notarié garanti ChiChoc Escrow.`,
      at: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
    };

    convo.messages.push(receiptMsg);
    convo.last_message_at = receiptMsg.at;

    this.saveData();
    return { conversation: convo, receipt };
  }


  public addChatMessage(conversationId: number, senderUser: User, text: string): ChatMessage | null {
    const convo = this.data.conversations.find((c) => c.id === conversationId);
    if (!convo) return null;

    const isAgent = senderUser.role === 'agent' || senderUser.id === convo.agent_id;
    const at = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: Date.now(),
      user_id: senderUser.id,
      from: isAgent ? 'agent' : 'me',
      text: text.trim(),
      at,
      timestamp: Date.now(),
    };

    convo.messages.push(newMsg);
    convo.last_message_at = at;
    this.saveData();
    return newMsg;
  }

  public addAgentOrAiReply(conversationId: number, text: string, isAi = true): ChatMessage | null {
    const convo = this.data.conversations.find((c) => c.id === conversationId);
    if (!convo) return null;

    const at = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: Date.now() + 10,
      user_id: convo.agent_id || 1,
      from: 'agent',
      is_ai: isAi,
      text: text.trim(),
      at,
      timestamp: Date.now(),
    };

    convo.messages.push(newMsg);
    convo.last_message_at = at;
    this.saveData();
    return newMsg;
  }

  public getConversationById(id: number): Conversation | undefined {
    return this.data.conversations.find((c) => c.id === id);
  }

  public startConversation(userId: number, propertyId: number, initialText: string): Conversation {
    const prop = this.getPropertyById(propertyId);
    if (!prop) throw new Error('Property not found');

    let convo = this.data.conversations.find((c) => c.created_by === userId && c.property_id === propertyId);
    const at = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (!convo) {
      convo = {
        id: Date.now(),
        created_by: userId,
        property_id: propertyId,
        agent_id: prop.agent?.id || 1,
        status: 'open',
        chat_state: 'inquiry',
        unread: 0,
        last_message_at: at,
        messages: [],
      };
      this.data.conversations.unshift(convo);
    }

    if (initialText) {
      convo.messages.push({
        id: Date.now() + 1,
        user_id: userId,
        from: 'me',
        text: initialText.trim(),
        at,
        timestamp: Date.now(),
      });
      convo.status = 'open';
    }

    this.saveData();
    return convo;
  }

  // --- Admin Verification ---
  public getVerificationQueue() {
    return this.data.verificationQueue.map((item) => {
      const prop = this.getPropertyById(item.property_id);
      return {
        ...item,
        property: prop || INITIAL_PROPERTIES[0],
      };
    });
  }

  public setVerificationDecision(
    propertyId: number,
    decision: 'approved' | 'rejected' | 'in_review' | 'needs_info',
    note?: string,
    reviewerName?: string,
  ): boolean {
    const item = this.data.verificationQueue.find((q) => q.property_id === propertyId);
    if (!item) return false;

    item.status = decision;
    item.internal_note = note || '';
    item.reviewer = reviewerName || 'Admin reviewer';
    item.decided_at = new Date().toISOString();

    const prop = this.data.properties.find((p) => p.id === propertyId);
    if (prop) {
      if (decision === 'approved') {
        prop.verified = {
          agent: true,
          location: true,
          photos: true,
          video: true,
          documents: true,
          reviewer: reviewerName || 'Technical review · Approved',
          reviewed_at: new Date().toISOString().split('T')[0],
        };
      }
    }

    this.saveData();
    return true;
  }

  // --- KYC & Listings ---
  public submitKyc(data: { name: string; email: string; phone: string; agency: string; user_id?: number }) {
    this.data.kycApplications.unshift({
      id: Date.now(),
      ...data,
      status: 'approved', // Auto-approves agent application in showcase mode
      submitted_at: new Date().toISOString(),
    });
    this.saveData();
  }

  public submitPropertyListing(listing: Partial<PropertyItem>): PropertyItem {
    const newId = this.data.properties.length + 1;
    const slug = (listing.title || 'new-property')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${newId}`;

    const newProp: PropertyItem = {
      id: newId,
      slug,
      title: listing.title || 'Untitled Property',
      location: listing.location || 'Abidjan, Côte d’Ivoire',
      district: listing.district || 'Cocody',
      city: listing.city || 'Abidjan',
      price: listing.price || 35000000,
      currency: 'XOF',
      intent: listing.intent || 'sale',
      intent_label: listing.intent === 'rent' ? 'Per month' : 'For sale',
      type: listing.type || 'House',
      bedrooms: listing.bedrooms || 3,
      bathrooms: listing.bathrooms || 2,
      area: listing.area || 180,
      image: listing.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
      gallery: listing.gallery && listing.gallery.length > 0 ? listing.gallery : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80'],
      agent: AGENTS.aya,
      tags: listing.tags || ['Security', 'Parking', 'Garden'],
      description: listing.description || 'Newly captured verified listing.',
      lat: listing.lat || 5.3599,
      lng: listing.lng || -3.9866,
      published: new Date().toISOString().split('T')[0],
      views: 0,
      href: `/properties/${slug}`,
      verified: {
        agent: true,
        location: true,
        photos: true,
        video: true,
        documents: true,
        reviewer: 'Automated GPS Check · Validated',
        reviewed_at: new Date().toISOString().split('T')[0],
      },
    };

    this.data.properties.unshift(newProp);

    this.data.verificationQueue.unshift({
      property_id: newProp.id,
      submitted: newProp.published,
      status: 'pending',
      gps_delta: 14,
      required_shots: 8,
      captured_shots: 8,
      documents: 3,
      agent_kyc: 'approved',
    });

    this.saveData();
    return newProp;
  }

  // --- Currencies & Live FX Rates ---
  public getCurrencies(): Record<string, CurrencyRate> {
    return this.data.currencies;
  }

  public async refreshLiveExchangeRates(): Promise<Record<string, CurrencyRate>> {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/XOF');
      if (res.ok) {
        const json = await res.json() as any;
        if (json?.rates) {
          const nowIso = new Date().toISOString();
          const baseRates = json.rates;
          if (baseRates.USD) {
            this.data.currencies.USD = {
              code: 'USD',
              name: 'US Dollar',
              symbol: '$',
              decimals: 2,
              rate: Number(baseRates.USD),
              is_live: true,
              last_updated: nowIso,
            };
          }
          if (baseRates.EUR) {
            this.data.currencies.EUR = {
              code: 'EUR',
              name: 'Euro',
              symbol: '€',
              decimals: 2,
              rate: Number(baseRates.EUR),
              is_live: true,
              last_updated: nowIso,
            };
          }
          if (baseRates.NGN) {
            this.data.currencies.NGN = {
              code: 'NGN',
              name: 'Nigerian Naira',
              symbol: '₦',
              decimals: 0,
              rate: Number(baseRates.NGN),
              is_live: true,
              last_updated: nowIso,
            };
          }
          if (baseRates.GHS) {
            this.data.currencies.GHS = {
              code: 'GHS',
              name: 'Ghanaian Cedi',
              symbol: '₵',
              decimals: 2,
              rate: Number(baseRates.GHS),
              is_live: true,
              last_updated: nowIso,
            };
          }
          if (baseRates.GBP) {
            this.data.currencies.GBP = {
              code: 'GBP',
              name: 'British Pound',
              symbol: '£',
              decimals: 2,
              rate: Number(baseRates.GBP),
              is_live: true,
              last_updated: nowIso,
            };
          }
          if (baseRates.CAD) {
            this.data.currencies.CAD = {
              code: 'CAD',
              name: 'Canadian Dollar',
              symbol: 'CA$',
              decimals: 2,
              rate: Number(baseRates.CAD),
              is_live: true,
              last_updated: nowIso,
            };
          }
          this.data.currencies.XOF = {
            code: 'XOF',
            name: 'West African CFA franc',
            symbol: 'F CFA',
            decimals: 0,
            rate: 1.0,
            is_live: true,
            last_updated: nowIso,
          };
          this.saveData();
          return this.data.currencies;
        }
      }
    } catch (err) {
      console.warn('Could not fetch live exchange rates, falling back to certified baseline:', err);
    }
    return this.data.currencies;
  }

  public updateCurrencyRate(code: string, rate: number) {
    if (this.data.currencies[code]) {
      this.data.currencies[code].rate = rate;
      this.saveData();
    }
  }


  // --- Customer Demands / Property Requests ---
  public getPropertyRequests(filter?: { user_id?: number; status?: string }): PropertyRequest[] {
    let requests = this.data.propertyRequests || [];
    if (filter?.user_id) {
      requests = requests.filter((r) => r.user_id === filter.user_id);
    }
    if (filter?.status) {
      requests = requests.filter((r) => r.status === filter.status);
    }
    return requests;
  }

  public getPropertyRequestById(id: number): PropertyRequest | undefined {
    return (this.data.propertyRequests || []).find((r) => r.id === id);
  }

  public createPropertyRequest(data: Partial<PropertyRequest>): PropertyRequest {
    if (!this.data.propertyRequests) {
      this.data.propertyRequests = [];
    }
    const maxId = this.data.propertyRequests.length > 0 ? Math.max(...this.data.propertyRequests.map((r) => r.id)) : 300;
    const newRequest: PropertyRequest = {
      id: maxId + 1,
      user_id: data.user_id || 1,
      user_name: data.user_name || 'Koffi Kouamé',
      user_phone: data.user_phone || '+225 07 12 34 56',
      user_email: data.user_email || 'kouame@example.com',
      intent: data.intent || 'sale',
      type: data.type || 'House',
      city: data.city || 'Abidjan',
      district: data.district || 'Cocody',
      budget_min: Number(data.budget_min) || 30000000,
      budget_max: Number(data.budget_max) || 75000000,
      currency: data.currency || 'XOF',
      lat: data.lat,
      lng: data.lng,
      bedrooms_min: data.bedrooms_min || 3,
      bathrooms_min: data.bathrooms_min || 2,
      surface_min: data.surface_min || 150,
      facilities: Array.isArray(data.facilities) ? data.facilities : ['Sécurité 24/7', 'Groupe électrogène'],
      notes: data.notes || '',
      status: 'open',
      created_at: new Date().toISOString(),
    };

    this.data.propertyRequests.unshift(newRequest);
    this.saveData();
    return newRequest;
  }

  public claimPropertyRequest(
    requestId: number,
    agentId: number,
    agentName: string,
    agentResponse?: string,
    recommendedPropertyId?: number,
  ): boolean {
    if (!this.data.propertyRequests) return false;
    const req = this.data.propertyRequests.find((r) => r.id === requestId);
    if (!req) return false;

    req.status = 'claimed';
    req.claimed_by_agent_id = agentId;
    req.claimed_by_agent_name = agentName;
    req.claimed_at = new Date().toISOString();
    if (agentResponse) req.agent_response = agentResponse;
    if (recommendedPropertyId) req.recommended_property_id = recommendedPropertyId;

    this.saveData();
    return true;
  }

  public getAgentStats30Days(agentIdOrSlug?: number | string): AgentViewAnalytics {
    const allProperties = this.data.properties;

    // Match agent properties
    let agentProps = allProperties.filter((p) => {
      if (!agentIdOrSlug) return p.agent?.slug === 'aya-koffi' || p.agent?.id === 1;
      if (typeof agentIdOrSlug === 'number') {
        return p.agent?.id === agentIdOrSlug || (agentIdOrSlug === 2 && p.agent?.slug === 'aya-koffi');
      }
      return p.agent?.slug === agentIdOrSlug;
    });

    if (agentProps.length === 0) {
      agentProps = allProperties.filter((p) => p.agent?.slug === 'aya-koffi' || p.agent?.id === 1);
    }

    const agent = agentProps[0]?.agent || AGENTS.aya;

    // Anchor to realistic contemporary date
    const now = new Date('2026-10-21T12:00:00Z');
    const dailyStats: DailyViewStat[] = [];

    // Realistically calibrated 30-day view pattern with weekend spikes & organic growth
    const baseViewsPattern = [
      58, 64, 72, 69, 85, 94, 88,
      65, 71, 78, 82, 103, 112, 98,
      74, 80, 89, 91, 118, 126, 108,
      86, 92, 104, 110, 138, 142, 122,
      115, 128
    ];

    let totalViews = 0;
    let totalUniqueVisitors = 0;
    let totalInquiries = 0;
    let total360Views = 0;
    let peakDay = { date: '', views: 0 };

    const monthNamesFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dayIndex = 29 - i;
      const dayViews = baseViewsPattern[dayIndex] ?? Math.round(75 + Math.sin(dayIndex * 0.4) * 25 + dayIndex * 1.5);
      const unique = Math.round(dayViews * (0.64 + (dayIndex % 5) * 0.02));
      const inquiries = Math.max(1, Math.round(dayViews * 0.032 + (dayIndex % 3 === 0 ? 1 : 0)));
      const tours360 = Math.round(dayViews * (0.38 + ((dayIndex + 2) % 4) * 0.03));
      const shares = Math.max(2, Math.round(dayViews * 0.08));

      const dateStr = `${d.getUTCDate()} ${monthNamesFr[d.getUTCMonth()]}`;
      const fullDate = d.toISOString().split('T')[0];

      totalViews += dayViews;
      totalUniqueVisitors += unique;
      totalInquiries += inquiries;
      total360Views += tours360;

      if (dayViews > peakDay.views) {
        peakDay = { date: dateStr, views: dayViews };
      }

      dailyStats.push({
        date: dateStr,
        fullDate,
        dayIndex,
        views: dayViews,
        uniqueVisitors: unique,
        inquiries,
        tour360Views: tours360,
        shares,
      });
    }

    // Per-listing breakdown for agent's properties
    const listingBreakdown: ListingViewStat[] = agentProps.map((p, idx) => {
      const proportions = [0.38, 0.28, 0.20, 0.14];
      const propShare = proportions[idx % proportions.length];
      const views30d = Math.round(totalViews * propShare);
      const uniqueVisitors30d = Math.round(totalUniqueVisitors * propShare);
      const inquiries30d = Math.round(totalInquiries * propShare);
      const tour360Views30d = Math.round(total360Views * propShare);
      const growth = [18.4, 12.1, 8.7, 24.5, 15.2][idx % 5];

      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        district: p.district,
        city: p.city,
        intent: p.intent,
        type: p.type,
        price: p.price,
        currency: p.currency,
        image: p.image,
        views30d,
        uniqueVisitors30d,
        inquiries30d,
        tour360Views30d,
        growth,
      };
    });

    const avgDailyViews = Math.round((totalViews / 30) * 10) / 10;
    const conversionRate = Math.round((totalInquiries / totalUniqueVisitors) * 1000) / 10;

    return {
      agent,
      period: '30 Derniers Jours',
      totalViews,
      totalUniqueVisitors,
      totalInquiries,
      total360Views,
      avgDailyViews,
      conversionRate,
      peakDay,
      dailyStats,
      listingBreakdown,
    };
  }
}

export interface DailyViewStat {
  date: string;
  fullDate: string;
  dayIndex: number;
  views: number;
  uniqueVisitors: number;
  inquiries: number;
  tour360Views: number;
  shares: number;
}

export interface ListingViewStat {
  id: number;
  slug: string;
  title: string;
  district: string;
  city: string;
  intent: 'sale' | 'rent';
  type: string;
  price: number;
  currency: string;
  image: string;
  views30d: number;
  uniqueVisitors30d: number;
  inquiries30d: number;
  tour360Views30d: number;
  growth: number;
}

export interface AgentViewAnalytics {
  agent: Agent;
  period: string;
  totalViews: number;
  totalUniqueVisitors: number;
  totalInquiries: number;
  total360Views: number;
  avgDailyViews: number;
  conversionRate: number;
  peakDay: { date: string; views: number };
  dailyStats: DailyViewStat[];
  listingBreakdown: ListingViewStat[];
}

export const store = new Store();

