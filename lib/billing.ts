// Stripe integration — real keys enable real checkout; absent keys = demo billing mode.
import Stripe from 'stripe';

export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

let cached: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  cached = cached || new Stripe(process.env.STRIPE_SECRET_KEY);
  return cached;
}

export const stripePriceIds = () => ({
  PRO: process.env.STRIPE_PRICE_PRO || '',
  MAX: process.env.STRIPE_PRICE_MAX || '',
});

export const appUrl = (req: Request) =>
  process.env.APP_URL || new URL(req.url).origin;
