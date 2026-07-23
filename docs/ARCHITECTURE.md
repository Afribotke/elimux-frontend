# ElimuX Architecture

## Overview
ElimuX is a global education discovery platform built with Next.js, Supabase, and Railway.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Express.js, TypeScript (deployed on Railway)
- **Database:** PostgreSQL (Supabase) with pgvector for semantic search
- **Auth:** Supabase Auth with custom RBAC
- **Payments:** Paystack (with M-Pesa planned)
- **AI:** Anthropic Claude (intent extraction), OpenAI (embeddings)
- **Hosting:** Vercel (frontend), Railway (backend)

## System Architecture
```
User -> Vercel (Next.js) -> Supabase (DB + Auth)
                        -> Railway (API)
                        -> Paystack (Payments)
                        -> Anthropic (AI Search)
                        -> OpenAI (Embeddings)
```

## Database Schema
- `auth.users` - Supabase managed users
- `user_roles` - RBAC role assignments
- `institutions` - University/institution data
- `programs` - Education programs
- `partners` - Partner portal users
- `referrals` - Referral tracking
- `commissions` - Partner commissions
- `ad_campaigns` - Advertiser campaigns
- `reviews` - User reviews

## API Structure
- `/api/programs` - Program CRUD
- `/api/institutions` - Institution CRUD
- `/api/search/*` - AI + semantic search
- `/api/partners/*` - Partner portal
- `/api/ads/*` - Advertiser campaigns
- `/api/payments/*` - Payment processing
- `/api/auth/*` - Authentication + RBAC
