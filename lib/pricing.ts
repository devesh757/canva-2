// Plan catalog + usage limits. Shared by client pages and server entitlement checks.
// Observed from Canva's public pricing pages (docs/REVERSE_ENGINEERING.md) — clean-room reimplementation.

export type PlanId = 'FREE' | 'PRO' | 'MAX';

export interface PlanDef {
  id: PlanId;
  name: string;
  price: number; // USD / month
  tagline: string;
  aiImage: number; // monthly image generations
  aiText: number; // monthly text generations
  features: string[];
  highlight?: boolean;
}

export const PLANS: PlanDef[] = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    tagline: 'Everything to start designing.',
    aiImage: 5,
    aiText: 25,
    features: [
      'Unlimited designs & exports',
      'All editor tools, 20+ fonts',
      '5 Magic image / 25 text per month',
      'Offline heuristics always free',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 12,
    tagline: 'Serious creators and small teams.',
    aiImage: 60,
    aiText: 300,
    highlight: true,
    features: [
      'Everything in Free',
      '60 Magic image / 300 text per month',
      'Premium template collection',
      'Priority support',
    ],
  },
  {
    id: 'MAX',
    name: 'Max',
    price: 29,
    tagline: 'Power users with heavy AI usage.',
    aiImage: 500,
    aiText: 5000,
    features: [
      'Everything in Pro',
      '500 Magic image / 5000 text per month',
      'Bulk export & full-deck PDF',
      'Early access to new tools',
    ],
  },
];

export const planById = (id: string | null | undefined): PlanDef =>
  PLANS.find((p) => p.id === (id || 'FREE')) || PLANS[0];
