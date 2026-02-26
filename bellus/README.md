# Bellus — Sistema de Gestão para Salão de Beleza

Sistema de gestão completo para salões de beleza, com agenda online, controle de caixa, emissão fiscal e lembretes automáticos via WhatsApp/SMS.

## Requisitos

- **Node.js** 18+
- **npm** 9+
- **Supabase CLI** (para desenvolvimento local com banco de dados)

## Setup

### 1. Clonar o repositório

```bash
git clone <repo-url>
cd bellus
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (apenas server-side) |
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação |

### 4. Iniciar banco de dados local (opcional)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Iniciar instância local
supabase start

# Aplicar migrations
supabase db push
```

As credenciais locais são exibidas após `supabase start`.

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | Verificar código com ESLint |
| `npm run lint:fix` | Corrigir problemas automaticamente |
| `npm run format` | Formatar código com Prettier |
| `npm run typecheck` | Verificar tipos TypeScript |

## Stack

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 16.x | Framework web (App Router + SSR) |
| React | 19.x | UI |
| TypeScript | 5.x | Type safety |
| Supabase | 2.x | PostgreSQL + Auth + Realtime |
| Tailwind CSS | 4.x | Estilo utilitário |
| shadcn/ui | 3.x | Componentes acessíveis |
| Zustand | 5.x | Estado global |
| TanStack Query | 5.x | Cache e sincronização de dados |
| Zod | 4.x | Validação de schema |

## Deploy

O projeto está configurado para deploy automático na **Vercel**.

```bash
# Configurar projeto na Vercel (primeira vez)
npx vercel link

# Deploy manual
npx vercel --prod
```

Configure as variáveis de ambiente no dashboard da Vercel antes do primeiro deploy.

## Estrutura do Projeto

```
bellus/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Rotas: login, signup, reset
│   │   └── (dashboard)/        # Rotas: painel interno
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   └── shared/             # Componentes do Bellus
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   ├── supabase/           # Supabase clients (client, server, middleware)
│   │   ├── env.ts              # Validação de variáveis de ambiente
│   │   └── query-client.ts     # Configuração React Query
│   ├── locales/                # Arquivos de tradução (PT/ES/EN/RU)
│   ├── providers/              # React context providers
│   ├── stores/                 # Zustand stores
│   └── types/                  # TypeScript types e interfaces
├── supabase/
│   ├── migrations/             # Migrations SQL
│   └── seed.sql                # Dados de desenvolvimento
├── .env.example                # Template de variáveis de ambiente
└── README.md
```

## Idiomas Suportados

| Código | Idioma | Padrão |
|--------|--------|--------|
| `pt` | Português | ✅ |
| `es` | Español | |
| `en` | English | |
| `ru` | Русский | |
