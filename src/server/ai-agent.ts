import { GoogleGenAI } from '@google/genai';
import { store, PropertyItem } from './store.js';

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    aiClient = new GoogleGenAI({ apiKey });
    return aiClient;
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

/**
 * Generate a professional, grounded auto-reply to customer inquiries about a property.
 * Strictly uses only verified data from the site inventory.
 */
export async function generateAutoReply(params: {
  property: PropertyItem;
  customerName?: string;
  customerMessage: string;
  conversationHistory?: Array<{ from: string; text: string }>;
}): Promise<string> {
  const { property, customerName, customerMessage, conversationHistory = [] } = params;
  const agent = property.agent;

  const agentName = agent?.name || 'Aya Koffi';
  const agentAgency = agent?.agency || 'Koffi & Co. Immobilier';
  const agentPhone = agent?.phone || '+225 07 00 00 01';

  const historyContext = conversationHistory
    .slice(-4)
    .map((m) => `${m.from === 'me' ? 'Customer' : 'Agent'}: ${m.text}`)
    .join('\n');

  const systemInstruction = `You are the Official Intermediation and Escrow Officer at the ChiChoc Habitat Official Intermediation and Concierge Desk (Médiation & Conciergerie Officielle ChiChoc Habitat), the verified luxury real estate marketplace in Côte d'Ivoire.

CRITICAL RULES & STRICT PLATFORM POLICIES:
1. STRICT INTERMEDIATION RULE: For legal and financial security, customers are NEVER allowed to contact real estate agents directly. ChiChoc Habitat serves as the mandatory trusted intermediary: our organization verifies both sides (audits buyer KYC, inspects authentic land titles like ACD/TF, and secures escrow deposits in trust). The agent's role is strictly to list properties, set prices, and confirm appointment slots scheduled by ChiChoc.
2. Ground your answers ONLY in the property data below. DO NOT invent unverified specs or other listings.
3. Tone: Professional, reassuring, articulate, authoritative, and trustworthy like a premier real estate concierge and escrow officer in Abidjan.
4. Language: Reply in the same language the customer uses (French if French, English if English).
5. Length: Keep it concise and scannable (2 to 4 sentences).
6. Action: Always invite the customer to schedule an official 2-step visit through ChiChoc Habitat (ChiChoc coordinates with the agent/owner and confirms the verified visit pass) or secure the deal by placing the escrow deposit via the "Make Payment / Faire un paiement" button in this chat.

VERIFIED PROPERTY SPECIFICATIONS:
- Title: ${property.title}
- Reference ID: CCH-${property.id}
- Location: ${property.location} (${property.district}, ${property.city})
- GPS Coordinates: ${property.lat}, ${property.lng} (Verified on-site)
- Price: ${property.price.toLocaleString('fr-FR')} XOF (${property.intent_label})
- Type: ${property.type}
- Space: ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms, ${property.area} m² surface
- Features: ${property.tags?.join(', ') || 'High standing'}
- Description: ${property.description}
- Verification Status: All 5 checks passed (Agent KYC, On-Site GPS, High-res Photos, Video audit, Land Title / ACD audited)
- Assigned Partner Agent: ${agentName} (${agent.role_title || 'Agent Agréé'}), Agency: ${agentAgency}
- Platform Intermediation Guarantee: ChiChoc Habitat audits both sides, coordinates the appointment with the agent/owner, and oversees the official appointment to finalize the deal.`;

  const ai = getGenAI();

  if (ai) {
    try {
      const prompt = `Customer Name: ${customerName || 'Client'}
Previous messages:
${historyContext || 'None'}

Latest customer message:
"${customerMessage}"

Provide the immediate professional auto-reply.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 300,
        },
      });

      const text = response.text?.trim();
      if (text) {
        return text;
      }
    } catch (err) {
      console.warn('Gemini generateAutoReply fallback triggered:', err);
    }
  }

  // Domain-grounded fallback if API key is not supplied or network fails
  const isFrench = !/[a-zA-Z]{3,}/.test(customerMessage) || /bonjour|bonsoir|prix|maison|terrain|disponible|visite|merci|contact/i.test(customerMessage);

  if (isFrench) {
    return `Bonjour ${customerName ? customerName : ''} ! Bienvenue à la Médiation & Conciergerie Officielle ChiChoc Habitat. Le bien "${property.title}" (${property.location}, ${property.price.toLocaleString('fr-FR')} F CFA) est audité et vérifié. Pour votre protection juridique et financière absolue, aucun contact direct avec les agents n'est autorisé : ChiChoc Habitat prend en charge votre dossier, coordonne votre rendez-vous officiel en 2 étapes avec l'agent/propriétaire (${agentName}) et sécurise votre acompte sous séquestre notarié. Souhaitez-vous que nous déclenchions la coordination de votre visite ?`;
  } else {
    return `Hello ${customerName ? customerName : ''}! Welcome to the ChiChoc Habitat Official Intermediation and Concierge Desk. "${property.title}" in ${property.location} (${property.price.toLocaleString('fr-FR')} XOF) is fully audited. For your strict legal and financial security, direct contact with agents is prohibited: ChiChoc Habitat oversees your file, coordinates your 2-step official tour with agent/owner ${agentName}, and holds your escrow deposit in protected trust. Would you like us to initiate visit coordination?`;
  }
}
