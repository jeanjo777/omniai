// OmniAI - Utilitaires Stripe
const Stripe = require('stripe');
const { supabase } = require('./db');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Plans disponibles
const PLANS = {
  free: {
    name: 'Gratuit',
    priceId: null,
    limits: {
      chat: 50,
      code: 20,
      image: 5,
      video: 1
    }
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    limits: {
      chat: 1000,
      code: 500,
      image: 100,
      video: 20
    }
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    limits: {
      chat: -1, // illimité
      code: -1,
      image: -1,
      video: -1
    }
  }
};

/**
 * Créer une session de checkout
 */
async function createCheckoutSession(userId, planId, successUrl, cancelUrl) {
  const plan = PLANS[planId];
  if (!plan || !plan.priceId) {
    throw new Error('Plan invalide');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1
      }
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planId
    }
  });

  return session;
}

/**
 * Créer un portail client
 */
async function createPortalSession(customerId, returnUrl) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });

  return session;
}

/**
 * Gérer un webhook Stripe
 */
async function handleWebhook(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }
}

// Handlers internes
async function handleCheckoutComplete(session) {
  const { userId, planId } = session.metadata;

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    plan: planId,
    status: 'active',
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  });
}

async function handleSubscriptionUpdate(subscription) {
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionDeleted(subscription) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentSucceeded(invoice) {
  await supabase.from('payments').insert({
    stripe_invoice_id: invoice.id,
    stripe_customer_id: invoice.customer,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    created_at: new Date().toISOString()
  });
}

async function handlePaymentFailed(invoice) {
  await supabase.from('payments').insert({
    stripe_invoice_id: invoice.id,
    stripe_customer_id: invoice.customer,
    amount: invoice.amount_due,
    currency: invoice.currency,
    status: 'failed',
    created_at: new Date().toISOString()
  });
}

/**
 * Récupérer les limites d'un plan
 */
function getPlanLimits(planId) {
  return PLANS[planId]?.limits || PLANS.free.limits;
}

module.exports = {
  stripe,
  PLANS,
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
  getPlanLimits
};
