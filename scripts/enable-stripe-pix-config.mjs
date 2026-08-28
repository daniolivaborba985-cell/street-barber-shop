import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("STRIPE_SECRET_KEY ausente");

const stripe = new Stripe(secretKey);
const configurationIds = [
  "pmc_1U8HuG7U4l5Nv4PIe3hQZyQV",
  "pmc_1U9Os67U4l5Nv4PIalZUMMAh",
];

for (const id of configurationIds) {
  try {
    const updated = await stripe.paymentMethodConfigurations.update(id, {
      pix: { display_preference: { preference: "on" } },
    });
    console.log(JSON.stringify({
      id: updated.id,
      name: updated.name,
      isDefault: updated.is_default,
      pix: updated.pix?.display_preference,
    }));
  } catch (error) {
    console.error(JSON.stringify({
      id,
      type: error?.type,
      code: error?.code,
      message: error?.message,
    }));
    process.exitCode = 1;
  }
}
