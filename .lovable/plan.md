# Plano — Site Baile do Havaí

Projeto grande com pagamento, webhook, emails transacionais e painel admin. Vou construir em fases coerentes. Antes de começar, dois ajustes técnicos importantes na sua spec:

## Ajustes na stack
1. **Sem Supabase Edge Functions**: a stack do projeto é TanStack Start. O webhook da InfinityPay vira uma **server route** em `src/routes/api/public/webhook-infinitypay.ts` (URL pública, sem auth). Chamadas internas (criar pedido, criar link de pagamento, enviar email) viram **server functions** (`createServerFn`). Funcionalmente idêntico ao que você pediu.
2. **Email transacional**: vou usar **Resend via connector** (recomendado pela plataforma) através do gateway Lovable — você só precisa fornecer a `RESEND_API_KEY` quando eu pedir, ou conectar via connector.

## Fase 1 — Infraestrutura
- Habilitar Lovable Cloud (Supabase gerenciado)
- Pedir secrets: `INFINITYPAY_HANDLE`, `RESEND_API_KEY`
- Criar tabelas via migration: `event_config`, `orders`, `tickets`, `admin_users` (via `user_roles`)
- RLS: público pode inserir orders/tickets (status='pending'); leitura admin via role; service_role para webhook
- Seed: 1 linha em `event_config` (limit=200, frozen=false)

## Fase 2 — Design system
- Atualizar `src/styles.css` com tokens: azul noite, dourado, verde tropical, rosa hibisco, bege
- Fontes Bebas Neue + Lato via Google Fonts
- Gradientes e sombras tropicais como tokens semânticos

## Fase 3 — Landing (`/`)
- Hero com título Bebas Neue + countdown ao vivo até 04/07/2026 20h
- Seções: info do evento, destaques, aviso crianças grátis
- CTA → `/comprar` (escondido se `sales_frozen` ou esgotado)
- Imagens geradas: hero tropical com hibiscos

## Fase 4 — Fluxo de compra (`/comprar`)
- Stepper com 3 etapas: Participantes → Comprador → Pagamento
- Validação CPF (algoritmo dígitos verificadores), máscara CPF/telefone
- Card por participante com toggle Militar/Civil e dropdown de posto condicional
- Cálculo automático criança (≤12 anos em 04/07/2026 = R$ 0)
- Bloqueio de CPF duplicado
- Resumo do pedido com subtotal/total
- Server fn `createOrder` valida limite + frozen, insere order+tickets pending, chama InfinityPay API, retorna URL de redirect

## Fase 5 — Webhook + Confirmação
- `src/routes/api/public/webhook-infinitypay.ts` (POST): valida payload, atualiza order para `confirmed`, dispara email Resend com ingressos
- `/confirmacao?order_id=...`: polling/leitura do status, mostra sucesso (confetes), pendente ou erro
- Template de email tropical com bloco por participante adulto

## Fase 6 — Admin (`/admin`)
- `/admin/login`: Supabase Auth email+senha
- Layout `_authenticated/admin` com gate
- Dashboard: 4 cards (arrecadado, vendidos, restantes, % ocupação)
- Config: editar `ticket_limit`, toggle `sales_frozen`
- Tabela inscritos com filtros (status/tipo/busca) + CPF mascarado
- Export CSV server-side
- Usuário admin: crio via SQL com email/senha que você me passar depois, ou você pode se cadastrar e eu te promovo

## Fase 7 — Polimento
- SEO em cada rota, sitemap, robots
- Estados vazios/erro
- QA do fluxo completo via invoke-server-function

## O que vou precisar de você durante a construção
1. **Secrets**: `INFINITYPAY_HANDLE` e `RESEND_API_KEY` (vou pedir via formulário seguro na hora certa)
2. **Domínio de email Resend**: preciso saber qual domínio verificado usar como remetente, ou usamos `onboarding@resend.dev` para teste
3. **Email do admin inicial**: para eu criar/promover

Posso seguir?
