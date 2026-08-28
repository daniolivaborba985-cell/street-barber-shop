import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("STRIPE_SECRET_KEY ausente");

const stripe = new Stripe(secretKey);
const configs = await stripe.paymentMethodConfigurations.list({ limit: 100 });
for (const config of configs.data) {
  console.log(JSON.stringify({
    id: config.id,
    name: config.name,
    isDefault: config.is_default,
    active: config.active,
    application: config.application,
    card: config.card?.display_preference,
    pix: {
      available: config.pix?.available,
      displayPreference: config.pix?.display_preference,
    },
    boleto: config.boleto?.display_preference,
    keys: Object.keys(config).filter((key) => /pix|payment_method/i.test(key)),
  }));
}
