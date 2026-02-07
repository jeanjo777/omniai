// OmniAI - Utilitaires Stripe
const Stripe = require('stripe');
const { supabase } = require('./db');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Plans disponibles
const PLANS = {
  free: {
    name: 'Gratuit',
    priceId: null,
    credits: 100
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    credits: 5000
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    credits: -1 // illimité
  }
};

// Packs de crédits achetables
const CREDIT_PACKS = {
  starter: { name: 'Starter', credits: 500, price: 499 },     // $4.99 CAD
  popular: { name: 'Popular', credits: 2000, price: 1499 },    // $14.99 CAD
  mega:    { name: 'Mega', credits: 5000, price: 2999 }        // $29.99 CAD
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
  const { type, userId, planId, packId, credits } = session.metadata;

  // Achat de crédits (one-time payment)
  if (type === 'credits' && userId && credits) {
    const creditsService = require('../services/credits-service');
    const pack = CREDIT_PACKS[packId] || { name: 'Pack' };
    await creditsService.addCredits(
      userId,
      parseInt(credits),
      'purchase',
      `Achat pack ${pack.name} — ${credits} points`,
      { packId, sessionId: session.id }
    );
    console.log(`✅ ${credits} crédits ajoutés pour ${userId} (pack ${packId})`);
    return;
  }

  // Abonnement (subscription)
  if (userId && planId) {
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      plan: planId,
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    });

    // Ajouter les crédits mensuels du plan
    const plan = PLANS[planId];
    if (plan && plan.credits > 0) {
      const creditsService = require('../services/credits-service');
      await creditsService.addCredits(
        userId,
        plan.credits,
        'subscription',
        `Abonnement ${plan.name} — ${plan.credits} points mensuels`,
        { planId, sessionId: session.id }
      );
      console.log(`✅ ${plan.credits} crédits mensuels ajoutés pour ${userId} (plan ${planId})`);
    }
  }
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

  // Ajouter les crédits mensuels pour les renouvellements d'abonnement
  if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
    try {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id, plan')
        .eq('stripe_subscription_id', invoice.subscription)
        .single();

      if (sub && PLANS[sub.plan] && PLANS[sub.plan].credits > 0) {
        const creditsService = require('../services/credits-service');
        await creditsService.addCredits(
          sub.user_id,
          PLANS[sub.plan].credits,
          'subscription',
          `Renouvellement ${PLANS[sub.plan].name} — ${PLANS[sub.plan].credits} points mensuels`,
          { planId: sub.plan, invoiceId: invoice.id }
        );
        console.log(`✅ Renouvellement: ${PLANS[sub.plan].credits} crédits pour ${sub.user_id}`);
      }
    } catch (err) {
      console.error('Erreur ajout crédits renouvellement:', err);
    }
  }
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
 * Récupérer les crédits d'un plan
 */
function getPlanCredits(planId) {
  return PLANS[planId]?.credits || PLANS.free.credits;
}

module.exports = {
  stripe,
  PLANS,
  CREDIT_PACKS,
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
  getPlanCredits
};
