const axios = require('axios');

const BASE = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v21.0'}`;
const TOKEN = () => process.env.META_ACCESS_TOKEN;
const ACCOUNT = () => process.env.META_AD_ACCOUNT_ID;
const PAGE_ID = () => process.env.META_PAGE_ID;

function api(method, path, data = {}) {
  const url = `${BASE}${path}`;
  const params = { access_token: TOKEN() };
  if (method === 'GET') return axios.get(url, { params: { ...params, ...data } });
  return axios[method](url, { ...data, access_token: TOKEN() });
}

// ─── Verificação de conta ─────────────────────────────────────────
async function checkAccount() {
  try {
    const r = await api('GET', `/${ACCOUNT()}`, { fields: 'name,currency,account_status,spend_cap,amount_spent' });
    return { ok: true, data: r.data };
  } catch (e) {
    return { ok: false, error: metaError(e) };
  }
}

// ─── Listar campanhas existentes ──────────────────────────────────
async function listCampaigns(limit = 10) {
  try {
    const r = await api('GET', `/${ACCOUNT()}/campaigns`, {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,spend_cap,insights{spend,impressions,clicks,cpm,cpc,ctr}',
      limit
    });
    return { ok: true, data: r.data.data };
  } catch (e) {
    return { ok: false, error: metaError(e) };
  }
}

// ─── Criar campanha ───────────────────────────────────────────────
async function createCampaign({ name, objective, daily_budget_cents, status = 'PAUSED' }) {
  try {
    const r = await api('post', `/${ACCOUNT()}/campaigns`, {
      name,
      objective,
      status,
      special_ad_categories: [],
      daily_budget: daily_budget_cents
    });
    return { ok: true, id: r.data.id };
  } catch (e) {
    return { ok: false, error: metaError(e) };
  }
}

// ─── Criar conjunto de anúncios ───────────────────────────────────
async function createAdSet({
  campaign_id, name, optimization_goal, billing_event,
  bid_strategy, daily_budget_cents, targeting, start_time, end_time
}) {
  try {
    const body = {
      campaign_id,
      name,
      optimization_goal,
      billing_event,
      bid_strategy,
      daily_budget: daily_budget_cents,
      targeting,
      status: 'PAUSED'
    };
    if (start_time) body.start_time = start_time;
    if (end_time) body.end_time = end_time;

    const r = await api('post', `/${ACCOUNT()}/adsets`, body);
    return { ok: true, id: r.data.id };
  } catch (e) {
    return { ok: false, error: metaError(e) };
  }
}

// ─── Criar criativo ───────────────────────────────────────────────
async function createCreative({ name, headline, body, cta, link, image_url }) {
  try {
    const object_story_spec = {
      page_id: PAGE_ID(),
      link_data: {
        message: body,
        link: link || 'https://www.facebook.com/' + PAGE_ID(),
        name: headline,
        call_to_action: { type: cta || 'LEARN_MORE' }
      }
    };

    if (image_url) {
      object_story_spec.link_data.picture = image_url;
    }

    const r = await api('post', `/${ACCOUNT()}/adcreatives`, {
      name,
      object_story_spec
    });
    return { ok: true, id: r.data.id };
  } catch (e) {
    return { ok: false, error: metaError(e) };
  }
}

// ─── Criar anúncio ────────────────────────────────────────────────
async function createAd({ adset_id, creative_id, name }) {
  try {
    const r = await api('post', `/${ACCOUNT()}/ads`, {
      adset_id,
      creative: { creative_id },
      name,
      status: 'PAUSED'
    });
    return { ok: true, id: r.data.id };
  } catch (e) {
    return { ok: false, error: metaError(e) };
  }
}

// ─── Ativar / Pausar ──────────────────────────────────────────────
async function setStatus(type, id, status) {
  // type: 'campaigns' | 'adsets' | 'ads'
  try {
    await api('post', `/${id}`, { status });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: metaError(e) };
  }
}

// ─── Insights da conta ────────────────────────────────────────────
async function getAccountInsights(dateRange = 'last_7d') {
  try {
    const r = await api('GET', `/${ACCOUNT()}/insights`, {
      fields: 'spend,impressions,clicks,cpm,cpc,ctr,actions',
      date_preset: dateRange,
      level: 'account'
    });
    return { ok: true, data: r.data.data[0] || {} };
  } catch (e) {
    return { ok: false, error: metaError(e) };
  }
}

// ─── Fluxo completo: criar campanha + conjunto + criativo + anúncio ──
async function createFullAd({ objective, strategy, copy, targeting, dailyBudgetBRL, campaignName, businessName, link }) {
  const budgetCents = Math.round(dailyBudgetBRL * 100); // Meta usa centavos

  // 1. Campanha
  const camp = await createCampaign({
    name: campaignName || `[Agente] ${businessName} — ${strategy.label}`,
    objective: strategy.campaign_objective,
    daily_budget_cents: budgetCents
  });
  if (!camp.ok) return { ok: false, step: 'campanha', error: camp.error };

  // 2. Conjunto de anúncios
  const adsetName = `Conjunto — ${strategy.label} — ${new Date().toLocaleDateString('pt-BR')}`;
  const adset = await createAdSet({
    campaign_id: camp.id,
    name: adsetName,
    optimization_goal: strategy.optimization_goal,
    billing_event: strategy.billing_event,
    bid_strategy: strategy.bid_strategy,
    daily_budget_cents: budgetCents,
    targeting: buildTargeting(targeting)
  });
  if (!adset.ok) return { ok: false, step: 'conjunto', error: adset.error };

  // 3. Criativo
  const creative = await createCreative({
    name: `Criativo — ${businessName}`,
    headline: copy.headline,
    body: copy.body,
    cta: copy.cta,
    link: link || null
  });
  if (!creative.ok) return { ok: false, step: 'criativo', error: creative.error };

  // 4. Anúncio
  const ad = await createAd({
    adset_id: adset.id,
    creative_id: creative.id,
    name: `Anúncio — ${businessName} — ${strategy.label}`
  });
  if (!ad.ok) return { ok: false, step: 'anúncio', error: ad.error };

  return {
    ok: true,
    campaign_id: camp.id,
    adset_id: adset.id,
    creative_id: creative.id,
    ad_id: ad.id
  };
}

// ─── Monta targeting da Meta ──────────────────────────────────────
function buildTargeting({ locations, age_min, age_max, genders, interests, radius_km = 15 }) {
  const targeting = {
    age_min: age_min || 18,
    age_max: age_max || 65,
    genders: genders || [1, 2]
  };

  if (locations && locations.length > 0) {
    targeting.geo_locations = {
      cities: locations.map(city => ({ key: city, radius: radius_km, distance_unit: 'kilometer' }))
    };
  } else {
    targeting.geo_locations = { countries: ['BR'] };
  }

  if (interests && interests.length > 0) {
    targeting.flexible_spec = [{ interests: interests.map(i => ({ name: i })) }];
  }

  return targeting;
}

// ─── Formata erro da Meta ─────────────────────────────────────────
function metaError(e) {
  if (e.response && e.response.data && e.response.data.error) {
    const err = e.response.data.error;
    return `${err.message} (código ${err.code})`;
  }
  return e.message;
}

module.exports = {
  checkAccount, listCampaigns, createFullAd, getAccountInsights, setStatus
};
