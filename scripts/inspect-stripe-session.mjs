import Stripe from "stripe";

const sessionId = process.argv[2];
const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("STRIPE_SECRET_KEY ausente");
if (!sessionId || !sessionId.startsWith("cs_")) throw new Error("Informe um Checkout Session ID válido");

const stripe = new Stripe(secretKey);
const session = await stripe.checkout.sessions.retrieve(sessionId);
console.log(JSON.stringify({
  id: session.id,
  mode: session.mode,
  status: session.status,
  paymentStatus: session.payment_status,
  paymentMethodTypes: session.payment_method_types,
  paymentMethodConfiguration: session.payment_method_configuration,
  paymentMethodConfigurationDetails: session.payment_method_configuration_details,
  paymentMethodOptions: session.payment_method_options,
  customerEmail: session.customer_email,
  metadata: session.metadata,
}, null, 2));
