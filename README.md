# OmniAI

Plateforme IA multimédia tout-en-un : Chat IA, génération de code, création d'images et montage vidéo.

## Stack Technique

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Base de données**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Paiement**: Stripe
- **IA**: OpenAI (GPT-4, DALL-E 3)
- **Déploiement**: Vercel (Frontend), Railway (Backend)

## Structure du Projet

```
omniai/
├── frontend/          # Application Next.js
│   ├── app/           # Pages et layouts
│   ├── components/    # Composants React
│   ├── lib/           # Utilitaires et API
│   └── styles/        # Styles CSS
│
├── backend/           # API Express
│   ├── routes/        # Routes API
│   ├── controllers/   # Controllers
│   ├── services/      # Services métier (IA)
│   ├── middleware/    # Auth, quotas
│   ├── utils/         # DB, Auth, Stripe
│   └── server.js      # Point d'entrée
│
└── .env.example       # Variables d'environnement
```

## Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase
- Compte Stripe
- Clé API OpenAI

### Backend

```bash
cd backend
npm install
cp ../.env.example .env  # Configurer les variables
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local  # Configurer les variables
npm run dev
```

## API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/health` | GET | Health check |
| `/api/chat` | POST | Chat IA |
| `/api/code` | POST | Génération de code |
| `/api/code/fix` | POST | Correction de code |
| `/api/code/explain` | POST | Explication de code |
| `/api/image/generate` | POST | Génération d'image |
| `/api/video/generate` | POST | Génération de vidéo |

## Déploiement

### Backend (Railway)

```bash
railway login
railway link
railway up
```

### Frontend (Vercel)

```bash
vercel login
vercel
```

## Schéma Base de Données (Supabase)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  user_id UUID REFERENCES users(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Images
CREATE TABLE images (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  prompt TEXT NOT NULL,
  revised_prompt TEXT,
  url TEXT NOT NULL,
  style TEXT,
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos
CREATE TABLE videos (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  original_name TEXT,
  file_path TEXT,
  url TEXT,
  status TEXT DEFAULT 'uploaded',
  duration FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Logs
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Licence

MIT
