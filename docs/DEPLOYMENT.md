# ElimuX Deployment Guide

## Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account
- Vercel account
- Railway account
- Paystack account

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://elimux.ke
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
PAYSTACK_PUBLIC_KEY=
```

### Backend (.env)
```
PORT=3001
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PAYSTACK_SECRET_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
RAILWAY_STATIC_URL=
```

## Deployment Steps

### 1. Database Setup
1. Create Supabase project
2. Run all SQL migration files in order
3. Enable pgvector extension
4. Configure RLS policies

### 2. Frontend Deployment (Vercel)
```bash
cd elimux-frontend
vercel --prod
```

### 3. Backend Deployment (Railway)
```bash
cd elimux-backend
railway up
```

### 4. Configure Webhooks
- Paystack webhook URL: `https://your-backend.railway.app/api/payments/webhook`
- Supabase auth redirect: `https://elimux.ke/auth/callback`

## Monitoring
- Vercel Analytics (frontend)
- Railway Metrics (backend)
- Supabase Dashboard (database)
