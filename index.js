require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { getSession, setSession, clearSession } = require('./src/sessions');
const { OBJECTIVES, detectNiche, generateCopy, budgetRecommendation } = require('./src/strategies');
const meta = require('./src/meta');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// ─── Helpers ──────────────────────────────────────────────────────
const objKeys = Object.keys(OBJECTIVES);

function objKeyboard() {
  const rows = [];
  for (let i = 0; i < objKeys.length; i += 2) {
    const row = [Markup.button.callback(
      `${OBJECTIVES[objKeys[i]].emoji} ${OBJECTIVES[objKeys[i]].label}`,
      `obj:${objKeys[i]}`
    )];
    if (objKeys[i + 1]) row.push(Markup.button.callback(
      `${OBJECTIVES[objKeys[i + 1]].emoji} ${OBJECTIVES[objKeys[i + 1]].label}`,
      `obj:${objKeys[i + 1]}`
    ));
    rows.push(row);
  }
  return Markup.inlineKeyboard(rows);
}

function confirmKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Criar anúncio (pausado)', 'confirm:paused'),
      Markup.button.callback('🚀 Criar e ativar agora', 'confirm:active')
    ],
    [Markup.button.callback('✏️ Editar informações', 'confirm:edit')],
    [Markup.button.callback('❌ Cancelar', 'confirm:cancel')]
  ]);
}

// ─── /start ───────────────────────────────────────────────────────
bot.start(async ctx => {
  clearSession(ctx.from.id);
  await ctx.replyWithHTML(
    `👋 Olá! Sou seu <b>Agente de Anúncios Meta</b>.\n\n` +
    `Crio campanhas otimizadas para <b>baixo custo</b> diretamente na sua conta.\n\n` +
    `<b>Comandos disponíveis:</b>\n` +
    `/criar — Criar novo anúncio\n` +
    `/campanhas — Ver campanhas ativas\n` +
    `/resultados — Ver resultados (últimos 7 dias)\n` +
    `/conta — Ver status da conta\n` +
    `/ajuda — Como usar o agente`
  );
});

// ─── /ajuda ───────────────────────────────────────────────────────
bot.command('ajuda', async ctx => {
  await ctx.replyWithHTML(
    `<b>🤖 Como usar o Agente de Anúncios</b>\n\n` +
    `1. Use /criar para iniciar\n` +
    `2. Informe o <b>negócio</b> (ex: "Clínica odontológica em SP")\n` +
    `3. Escolha o <b>objetivo</b> da campanha\n` +
    `4. Informe o <b>orçamento diário</b> em R$\n` +
    `5. O agente gera o copy e cria tudo automaticamente\n\n` +
    `<b>💡 Dicas de baixo custo:</b>\n` +
    `• Comece com R$10-20/dia para testar\n` +
    `• Fique na fase de aprendizado 7 dias antes de mexer\n` +
    `• Use objetivo "Mensagens" para menor CPC\n` +
    `• Segmentação local reduz CPM drasticamente\n\n` +
    `Anúncios são criados como <b>PAUSADOS</b> por padrão — você revisa antes de ativar.`
  );
});

// ─── /conta ───────────────────────────────────────────────────────
bot.command('conta', async ctx => {
  const msg = await ctx.reply('🔍 Verificando sua conta...');
  const r = await meta.checkAccount();
  if (!r.ok) {
    await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
      `❌ Erro ao conectar: ${r.error}\n\nVerifique o META_ACCESS_TOKEN no seu .env`);
    return;
  }
  const d = r.data;
  const statusMap = { 1: '✅ Ativa', 2: '⚠️ Desativada', 3: '⛔ Sem confirmação', 9: '🔒 Fechada' };
  await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
    `📊 *Sua Conta de Anúncios*\n\n` +
    `🏷 Nome: ${d.name}\n` +
    `💱 Moeda: ${d.currency}\n` +
    `🔸 Status: ${statusMap[d.account_status] || d.account_status}\n` +
    `💸 Gasto total: ${d.amount_spent ? 'R$' + (d.amount_spent / 100).toFixed(2) : 'N/D'}`,
    { parse_mode: 'Markdown' }
  );
});

// ─── /campanhas ───────────────────────────────────────────────────
bot.command('campanhas', async ctx => {
  const msg = await ctx.reply('📋 Carregando campanhas...');
  const r = await meta.listCampaigns(8);
  if (!r.ok) {
    await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
      `❌ Erro: ${r.error}`);
    return;
  }
  if (!r.data.length) {
    await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
      `📭 Nenhuma campanha encontrada na conta.`);
    return;
  }
  const statusEmoji = { ACTIVE: '🟢', PAUSED: '⏸', ARCHIVED: '📦', DELETED: '🗑' };
  let text = `📋 *Suas Campanhas*\n\n`;
  for (const c of r.data) {
    const ins = c.insights && c.insights.data && c.insights.data[0];
    const spend = ins ? `R$${parseFloat(ins.spend).toFixed(2)}` : 'sem dados';
    text += `${statusEmoji[c.status] || '⚪'} *${c.name}*\n`;
    text += `   ID: \`${c.id}\` | Gasto: ${spend}\n\n`;
  }
  await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
    text, { parse_mode: 'Markdown' });
});

// ─── /resultados ──────────────────────────────────────────────────
bot.command('resultados', async ctx => {
  const msg = await ctx.reply('📈 Buscando resultados dos últimos 7 dias...');
  const r = await meta.getAccountInsights('last_7d');
  if (!r.ok) {
    await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
      `❌ Erro: ${r.error}`);
    return;
  }
  const d = r.data;
  if (!d || !d.spend) {
    await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
      `📭 Sem dados de desempenho nos últimos 7 dias.`);
    return;
  }
  const leads = d.actions ? d.actions.find(a => a.action_type === 'lead') : null;
  const msgs = d.actions ? d.actions.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d') : null;
  await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
    `📈 *Resultados — Últimos 7 dias*\n\n` +
    `💸 Gasto: R$${parseFloat(d.spend || 0).toFixed(2)}\n` +
    `👁 Impressões: ${parseInt(d.impressions || 0).toLocaleString('pt-BR')}\n` +
    `🖱 Cliques: ${parseInt(d.clicks || 0).toLocaleString('pt-BR')}\n` +
    `📊 CTR: ${parseFloat(d.ctr || 0).toFixed(2)}%\n` +
    `💰 CPC: R$${parseFloat(d.cpc || 0).toFixed(2)}\n` +
    `📡 CPM: R$${parseFloat(d.cpm || 0).toFixed(2)}\n` +
    (leads ? `🎯 Leads: ${leads.value}\n` : '') +
    (msgs ? `💬 Conv. WhatsApp: ${msgs.value}\n` : ''),
    { parse_mode: 'Markdown' }
  );
});

// ─── /criar — início do fluxo ─────────────────────────────────────
bot.command('criar', async ctx => {
  setSession(ctx.from.id, { step: 'business', data: {} });
  await ctx.replyWithHTML(
    `🎯 <b>Criação de Anúncio</b>\n\n` +
    `Vamos criar o anúncio ideal para você.\n\n` +
    `<b>Primeiro: qual é o negócio?</b>\n` +
    `Descreva em uma linha. Ex:\n` +
    `• "Clínica odontológica em São Paulo"\n` +
    `• "Barbearia no centro de Campinas"\n` +
    `• "Loja de roupas online"\n` +
    `• "Curso de inglês online"`
  );
});

// ─── Fluxo de mensagens ───────────────────────────────────────────
bot.on('text', async ctx => {
  const userId = ctx.from.id;
  const session = getSession(userId);
  const text = ctx.message.text.trim();

  // ignora comandos
  if (text.startsWith('/')) return;

  switch (session.step) {

    // ── Coleta negócio ─────────────────────────────────────────────
    case 'business': {
      session.data.businessDesc = text;
      session.data.niche = detectNiche(text);
      session.step = 'objective';
      setSession(userId, session);
      await ctx.replyWithHTML(
        `✅ <b>${text}</b>\n\n` +
        `Qual é o <b>objetivo</b> da campanha?`,
        objKeyboard()
      );
      break;
    }

    // ── Coleta orçamento ───────────────────────────────────────────
    case 'budget': {
      const budget = parseFloat(text.replace(',', '.').replace('R$', '').trim());
      if (isNaN(budget) || budget <= 0) {
        await ctx.reply('⚠️ Digite um valor válido em reais. Ex: 20 ou 15.50');
        break;
      }
      session.data.dailyBudget = budget;

      const obj = session.data.objective;
      const rec = budgetRecommendation(obj, budget);
      if (!rec.ok) {
        await ctx.replyWithHTML(
          rec.message + `\n\nQuer usar R$${rec.suggested}/dia? Ou informe outro valor:`
        );
        // mantém no step budget para novo valor
        break;
      }

      session.step = 'link';
      setSession(userId, session);
      await ctx.replyWithHTML(
        `💰 Orçamento: <b>R$${budget}/dia</b>\n${rec.level}\n\n` +
        `📎 <b>Qual link o anúncio vai levar?</b>\n` +
        `Cole o link do site, landing page ou WhatsApp.\n` +
        `Ou digite <b>pular</b> para usar a página do Facebook.`
      );
      break;
    }

    // ── Coleta link ────────────────────────────────────────────────
    case 'link': {
      if (text.toLowerCase() !== 'pular') {
        session.data.link = text.startsWith('http') ? text : 'https://' + text;
      }
      session.step = 'location';
      setSession(userId, session);
      await ctx.replyWithHTML(
        `🗺 <b>Qual cidade ou região quer atingir?</b>\n` +
        `Ex: "São Paulo", "Rio de Janeiro", "Campinas e Sorocaba"\n\n` +
        `Ou digite <b>brasil</b> para alcançar todo o país.`
      );
      break;
    }

    // ── Coleta localização ─────────────────────────────────────────
    case 'location': {
      const loc = text.toLowerCase() === 'brasil' ? null : text;
      session.data.location = loc;
      session.step = 'review';
      setSession(userId, session);

      // Gerar copy
      const strategy = OBJECTIVES[session.data.objective];
      const copy = generateCopy(session.data.niche, session.data.objective,
        session.data.businessDesc.split(' em ')[0], session.data.location);
      session.data.copy = copy;
      setSession(userId, session);

      // Montar resumo
      await ctx.replyWithHTML(
        `📋 <b>Resumo do Anúncio</b>\n\n` +
        `🏷 <b>Negócio:</b> ${session.data.businessDesc}\n` +
        `🎯 <b>Objetivo:</b> ${strategy.emoji} ${strategy.label}\n` +
        `💰 <b>Orçamento:</b> R$${session.data.dailyBudget}/dia\n` +
        `🗺 <b>Localização:</b> ${session.data.location || '🇧🇷 Brasil todo'}\n` +
        `${session.data.link ? `🔗 <b>Link:</b> ${session.data.link}\n` : ''}` +
        `\n<b>✍️ Copy gerado pelo agente:</b>\n` +
        `📌 <i>${copy.headline}</i>\n` +
        `💬 ${copy.body}\n\n` +
        `<b>💡 Dica:</b> ${strategy.tip}\n\n` +
        `Como deseja prosseguir?`,
        confirmKeyboard()
      );
      break;
    }

    default:
      await ctx.reply('Use /criar para criar um anúncio ou /ajuda para ver os comandos.');
  }
});

// ─── Callbacks dos botões ─────────────────────────────────────────

// Escolha de objetivo
bot.action(/^obj:(.+)$/, async ctx => {
  const userId = ctx.from.id;
  const session = getSession(userId);
  if (session.step !== 'objective') return ctx.answerCbQuery();

  const obj = ctx.match[1];
  session.data.objective = obj;
  session.step = 'budget';
  setSession(userId, session);

  const strategy = OBJECTIVES[obj];
  await ctx.editMessageText(
    `✅ Objetivo: ${strategy.emoji} ${strategy.label}\n\n` +
    `${strategy.description}\n` +
    `📊 Mínimo recomendado: R$${strategy.min_budget_daily}/dia\n\n` +
    `💰 Qual o orçamento diário em R$? (apenas o número)`
  );
  await ctx.answerCbQuery();
});

// Confirmação
bot.action(/^confirm:(.+)$/, async ctx => {
  const userId = ctx.from.id;
  const session = getSession(userId);
  const action = ctx.match[1];
  await ctx.answerCbQuery();

  if (action === 'cancel') {
    clearSession(userId);
    await ctx.editMessageText('❌ Criação cancelada. Use /criar para começar novamente.');
    return;
  }

  if (action === 'edit') {
    clearSession(userId);
    await ctx.editMessageText('✏️ Vamos refazer. Use /criar para começar novamente com as novas informações.');
    return;
  }

  // Criar anúncio
  const activateNow = action === 'active';
  const msg = await ctx.editMessageText('⏳ Criando sua campanha na Meta...');

  const strategy = OBJECTIVES[session.data.objective];
  const result = await meta.createFullAd({
    objective: session.data.objective,
    strategy,
    copy: session.data.copy,
    targeting: {
      locations: session.data.location ? [session.data.location] : null,
      age_min: 18,
      age_max: 65,
      genders: [1, 2]
    },
    dailyBudgetBRL: session.data.dailyBudget,
    businessName: session.data.businessDesc,
    link: session.data.link
  });

  if (!result.ok) {
    await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
      `❌ Erro ao criar ${result.step}: ${result.error}\n\n` +
      `Verifique se o token e o ID da conta estão corretos.`
    );
    clearSession(userId);
    return;
  }

  // Ativar se solicitado
  if (activateNow) {
    await meta.setStatus('campaigns', result.campaign_id, 'ACTIVE');
  }

  await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
    `✅ *Anúncio criado com sucesso!*\n\n` +
    `🆔 Campanha: \`${result.campaign_id}\`\n` +
    `🆔 Conjunto: \`${result.adset_id}\`\n` +
    `🆔 Anúncio: \`${result.ad_id}\`\n\n` +
    (activateNow
      ? `🚀 *Campanha ATIVA* — o algoritmo começará a aprender!\n\n` +
        `⏱ Aguarde 24-48h para ver os primeiros resultados.`
      : `⏸ *Campanha criada como PAUSADA*\n\n` +
        `Revise no Gerenciador de Anúncios e ative quando estiver pronto.\n` +
        `Use /campanhas para ver suas campanhas.`) +
    `\n\n💡 Use /resultados para acompanhar o desempenho.`,
    { parse_mode: 'Markdown' }
  );

  clearSession(userId);
});

// ─── Iniciar bot ──────────────────────────────────────────────────
bot.launch()
  .then(() => console.log('🤖 Agente de Anúncios Meta rodando no Telegram!'))
  .catch(err => console.error('Erro ao iniciar:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
