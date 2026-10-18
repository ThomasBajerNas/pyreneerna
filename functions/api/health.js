import { json } from "../_shop.js";
/* Guiden frågar här om betalning finns. Svarar stripe:true bara när en Stripe-nyckel är inlagd.
   mail:true när e-post för inloggning av superanvändare är påslagen (RESEND_API_KEY). */
export const onRequestGet = ({ env }) => json({ stripe: !!env.STRIPE_SECRET_KEY, test: /^sk_test_/.test(env.STRIPE_SECRET_KEY || ""), mail: !!env.RESEND_API_KEY });
