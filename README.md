# 🤖 Agente de Anúncios Meta — Bot Telegram

Cria campanhas otimizadas para **baixo custo** diretamente na sua conta Meta Business via Telegram.

---

## ⚡ Como configurar (passo a passo)

### 1. Criar o bot no Telegram

1. Abra o Telegram e procure por **@BotFather**
2. Envie `/newbot`
3. Dê um nome (ex: "Agente Anúncios") e um username (ex: `meus_anuncios_bot`)
4. Copie o **token** que o BotFather enviar

---

### 2. Pegar suas credenciais Meta

**Token de acesso:**
1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie um App (tipo: Business)
3. Adicione o produto "Marketing API"
4. Em **Ferramentas > Explorador de API**, gere um token com as permissões:
   - `ads_management`
   - `ads_read`
   - `pages_read_engagement`
5. Para token permanente, use o **Token de Acesso do Sistema** no Business Manager

**Ad Account ID:**
1. Acesse [business.facebook.com](https://business.facebook.com)
2. Vá em **Configurações > Contas de Anúncios**
3. Copie o ID no formato `act_XXXXXXXXXX`

**Page ID:**
1. Acesse sua Página do Facebook
2. Clique em **Sobre** → role até encontrar o "ID da Página"

---

### 3. Configurar o projeto

```bash
# Instalar dependências
npm install

# Copiar e preencher as variáveis
cp .env.example .env
# Edite o .env com seus dados
```

Seu `.env` deve ficar assim:
```
TELEGRAM_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxyz
META_ACCESS_TOKEN=EAABsbCS...
META_AD_ACCOUNT_ID=act_123456789
META_PAGE_ID=987654321
META_API_VERSION=v21.0
```

---

### 4. Rodar o bot

**Localmente (para testar):**
```bash
npm start
```

**Em produção (Railway — grátis):**
1. Acesse [railway.app](https://railway.app) e crie uma conta
2. Clique em **New Project → Deploy from GitHub**
3. Faça upload do projeto ou conecte o repositório
4. Em **Variables**, adicione todas as variáveis do `.env`
5. O bot fica online 24/7 gratuitamente

---

## 📱 Como usar o bot

| Comando | O que faz |
|---------|-----------|
| `/criar` | Inicia criação guiada de anúncio |
| `/campanhas` | Lista campanhas da sua conta |
| `/resultados` | Métricas dos últimos 7 dias |
| `/conta` | Status da conta de anúncios |
| `/ajuda` | Dicas de baixo custo |

---

## 🎯 Objetivos suportados

| Objetivo | Uso ideal | Orçamento mín. |
|----------|-----------|---------------|
| 🎯 Leads | Clínicas, serviços, cursos | R$10/dia |
| 🌐 Tráfego | Sites, blogs, landing pages | R$5/dia |
| 💬 Mensagens WhatsApp | Atendimento, vendas diretas | R$10/dia |
| 💰 Vendas | E-commerce, produtos | R$20/dia |
| ❤️ Engajamento | Redes sociais, branding | R$5/dia |
| 📢 Reconhecimento | Negócios locais, eventos | R$5/dia |

---

## 💡 Dicas de baixo custo implementadas

- **Bid strategy automática**: sempre `LOWEST_COST_WITHOUT_CAP` para o algoritmo otimizar livremente
- **Segmentação inteligente por nicho**: interesses relevantes detectados automaticamente pelo texto
- **Localização com raio**: campanhas locais têm CPM muito menor que nacional
- **Anúncios criados como PAUSADOS**: você revisa antes de gastar
- **Copy especializado por objetivo**: texto otimizado para cada meta de conversão

---

## 🔧 Estrutura do projeto

```
meta-ads-bot/
├── index.js          # Bot Telegram + fluxo de conversa
├── src/
│   ├── meta.js       # Integração com Meta Marketing API
│   ├── strategies.js # Estratégias, copies e recomendações
│   └── sessions.js   # Gerenciamento de sessões por usuário
├── .env.example      # Modelo de configuração
└── package.json
```
