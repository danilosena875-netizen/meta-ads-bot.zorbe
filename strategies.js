/**
 * Estratégias de anúncios de BAIXO CUSTO por objetivo
 * Baseado em boas práticas da Meta para maximizar resultado com orçamento pequeno
 */

const OBJECTIVES = {
  leads: {
    label: 'Geração de Leads',
    emoji: '🎯',
    campaign_objective: 'OUTCOME_LEADS',
    optimization_goal: 'LEAD_GENERATION',
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    description: 'Captura contatos de pessoas interessadas no seu produto/serviço',
    best_for: 'Clínicas, imobiliárias, cursos, serviços locais',
    min_budget_daily: 10,
    tip: 'Use formulário instantâneo da Meta para reduzir atrito e baixar o CPL'
  },
  traffic: {
    label: 'Tráfego para Site',
    emoji: '🌐',
    campaign_objective: 'OUTCOME_TRAFFIC',
    optimization_goal: 'LINK_CLICKS',
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    description: 'Leva pessoas ao seu site, landing page ou WhatsApp',
    best_for: 'Blogs, lojas, portfólios, restaurantes',
    min_budget_daily: 5,
    tip: 'Otimize para "cliques no link" com orçamentos menores de R$5-20/dia'
  },
  sales: {
    label: 'Vendas / Conversões',
    emoji: '💰',
    campaign_objective: 'OUTCOME_SALES',
    optimization_goal: 'OFFSITE_CONVERSIONS',
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    description: 'Otimizado para pessoas que tendem a comprar',
    best_for: 'E-commerce, produtos digitais, infoprodutos',
    min_budget_daily: 20,
    tip: 'Instale o Pixel da Meta no site para melhor otimização'
  },
  engagement: {
    label: 'Engajamento',
    emoji: '❤️',
    campaign_objective: 'OUTCOME_ENGAGEMENT',
    optimization_goal: 'POST_ENGAGEMENT',
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    description: 'Curtidas, comentários, compartilhamentos e seguidores',
    best_for: 'Marcas, perfis de influência, conteúdo viral',
    min_budget_daily: 5,
    tip: 'Ótimo para aquecer audiência antes de campanha de vendas'
  },
  awareness: {
    label: 'Reconhecimento de Marca',
    emoji: '📢',
    campaign_objective: 'OUTCOME_AWARENESS',
    optimization_goal: 'REACH',
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    description: 'Alcança o máximo de pessoas na sua região/público',
    best_for: 'Negócios locais, eventos, lançamentos',
    min_budget_daily: 5,
    tip: 'CPM mais baixo — ideal para começar e construir audiência'
  },
  messages: {
    label: 'Mensagens no WhatsApp',
    emoji: '💬',
    campaign_objective: 'OUTCOME_ENGAGEMENT',
    optimization_goal: 'CONVERSATIONS',
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    description: 'Leva direto para conversa no WhatsApp Business',
    best_for: 'Atendimento, vendas consultivas, serviços locais',
    min_budget_daily: 10,
    tip: 'Um dos menores CPCs disponíveis — altamente recomendado para PMEs'
  }
};

/**
 * Segmentações inteligentes por nicho para baixo custo
 */
const NICHE_TARGETING = {
  // Saúde e Beleza
  clinica: {
    interests: ['Saúde', 'Medicina', 'Beleza', 'Bem-estar'],
    age_min: 25, age_max: 55,
    genders: [1, 2]
  },
  barbearia: {
    interests: ['Barbearia', 'Moda masculina', 'Cuidados pessoais'],
    age_min: 18, age_max: 45,
    genders: [2] // masculino
  },
  salao: {
    interests: ['Salão de beleza', 'Cabelo', 'Moda', 'Beleza'],
    age_min: 18, age_max: 50,
    genders: [1] // feminino
  },
  // Alimentação
  restaurante: {
    interests: ['Gastronomia', 'Restaurantes', 'Alimentação saudável', 'Delivery'],
    age_min: 18, age_max: 55,
    genders: [1, 2]
  },
  // Educação
  curso: {
    interests: ['Educação', 'Cursos online', 'Capacitação profissional', 'Empreendedorismo'],
    age_min: 18, age_max: 45,
    genders: [1, 2]
  },
  // Imóveis
  imoveis: {
    interests: ['Imóveis', 'Casa própria', 'Investimento imobiliário'],
    age_min: 25, age_max: 55,
    genders: [1, 2]
  },
  // Pet
  petshop: {
    interests: ['Animais de estimação', 'Cachorros', 'Gatos', 'Veterinária'],
    age_min: 20, age_max: 50,
    genders: [1, 2]
  },
  // Tech/Serviços digitais
  tecnologia: {
    interests: ['Tecnologia', 'Startups', 'Software', 'Negócios digitais'],
    age_min: 20, age_max: 45,
    genders: [1, 2]
  },
  // Padrão genérico
  default: {
    interests: [],
    age_min: 18, age_max: 55,
    genders: [1, 2]
  }
};

/**
 * Detecta nicho pelo texto fornecido pelo usuário
 */
function detectNiche(text) {
  const t = text.toLowerCase();
  if (t.match(/cl[íi]nica|odonto|dentista|médico|médica|fisio|psico/)) return 'clinica';
  if (t.match(/barbear|barbearia/)) return 'barbearia';
  if (t.match(/sal[ãa]o|cabeleireiro|cabeleireira|estética|manicure/)) return 'salao';
  if (t.match(/restaurante|lanchonete|pizz|burger|comida|delivery|marmita/)) return 'restaurante';
  if (t.match(/curso|escola|aula|treinamento|capacitação|ensino/)) return 'curso';
  if (t.match(/im[óo]vel|apartamento|casa|construtora|corretor/)) return 'imoveis';
  if (t.match(/pet|cachorro|gato|veterinário|veterinária/)) return 'petshop';
  if (t.match(/tech|software|app|sistema|site|digital|marketing/)) return 'tecnologia';
  return 'default';
}

/**
 * Gera copy inteligente por objetivo e nicho
 */
function generateCopy(niche, objective, businessName, location) {
  const loc = location ? ` em ${location}` : '';
  const name = businessName || 'nosso negócio';

  const copies = {
    leads: {
      clinica: {
        headline: `Consulta Gratuita${loc} — Agende Agora`,
        body: `Cuidar da sua saúde nunca foi tão fácil. ${name} oferece atendimento especializado com agendamento rápido. Preencha o formulário e receba contato em até 1 hora! ✅`,
        cta: 'SIGN_UP'
      },
      barbearia: {
        headline: `Corte Profissional${loc} — Primeira Visita com Desconto`,
        body: `Homem que se cuida merece o melhor. Agende seu horário no ${name} e ganhe desconto na primeira visita. Vagas limitadas! ✂️`,
        cta: 'BOOK_TRAVEL'
      },
      default: {
        headline: `${name} — Solicite seu Orçamento Grátis`,
        body: `Interessado em saber mais? Deixe seu contato e nossa equipe entra em contato em até 24h com as melhores condições para você! 🎯`,
        cta: 'SIGN_UP'
      }
    },
    traffic: {
      restaurante: {
        headline: `Peça Agora e Receba em 30 min${loc}`,
        body: `${name} — sabor de verdade na sua porta. Cardápio completo com as melhores opções da região. Peça pelo nosso site! 🍕`,
        cta: 'ORDER_NOW'
      },
      default: {
        headline: `Conheça o ${name}`,
        body: `Descubra tudo que temos para você. Acesse nosso site e veja nossas ofertas especiais de hoje! 👆`,
        cta: 'LEARN_MORE'
      }
    },
    messages: {
      default: {
        headline: `Fale Agora com ${name} no WhatsApp`,
        body: `Tire suas dúvidas, solicite orçamento ou faça seu pedido direto no WhatsApp. Atendimento rápido e sem complicação! 💬`,
        cta: 'WHATSAPP_MESSAGE'
      }
    },
    engagement: {
      default: {
        headline: `${name} — Siga e Fique por Dentro`,
        body: `Dicas, novidades e conteúdo exclusivo todo dia. Curta nossa página e não perca nada! ❤️`,
        cta: 'LIKE_PAGE'
      }
    },
    awareness: {
      default: {
        headline: `${name}${loc} — Conheça Nossa História`,
        body: `Somos referência na região. Qualidade, atendimento e resultados que fazem diferença. Venha nos conhecer! 🏆`,
        cta: 'LEARN_MORE'
      }
    },
    sales: {
      default: {
        headline: `Oferta Especial — ${name}`,
        body: `Aproveite as melhores condições que você vai encontrar. Oferta por tempo limitado! Compre agora com segurança. 🛒`,
        cta: 'SHOP_NOW'
      }
    }
  };

  const objCopies = copies[objective] || copies.leads;
  return objCopies[niche] || objCopies.default;
}

/**
 * Recomendação de orçamento por objetivo e porte do negócio
 */
function budgetRecommendation(objective, dailyBudget) {
  const strategy = OBJECTIVES[objective];
  const min = strategy.min_budget_daily;

  if (dailyBudget < min) {
    return {
      ok: false,
      message: `⚠️ Para ${strategy.label}, o mínimo recomendado é R$${min}/dia. Com menos, o algoritmo não consegue otimizar bem.`,
      suggested: min
    };
  }

  let level = '';
  if (dailyBudget <= 15) level = '🟡 Entrada — resultados em 7-14 dias de aprendizado';
  else if (dailyBudget <= 50) level = '🟢 Bom — fase de aprendizado em 3-7 dias';
  else level = '🚀 Acelerado — resultados mais rápidos';

  return { ok: true, level };
}

module.exports = { OBJECTIVES, NICHE_TARGETING, detectNiche, generateCopy, budgetRecommendation };
