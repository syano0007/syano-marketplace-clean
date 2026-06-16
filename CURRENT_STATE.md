# SYANO — Current State
Last updated: June 16, 2026

## Project Identity
- Name: SYANO — سوق سوريا
- Type: Multi-vendor marketplace
- Domain: syanomarket.online
- GitHub: https://github.com/syano0007/syano07007
- Status: Pre-launch — Phase 11 in progress

## Active Phase
Phase 11 — Launch Preparation
Completed: Prompts 1, 2, 3, 4, 5, 6, 7
Remaining: Prompt 8 (SEO Layer), Prompt 9 (Accessibility), Prompt 10 (Performance Baseline)

## Last Session Work — June 16, 2026
1. Resend email service — artifacts/api-server/src/services/emailService.ts
   - sendWelcomeEmail() ✅
   - sendPasswordResetEmail() ✅
   - sendOtpEmail() ✅ — routes through verification.ts → dispatchOtp()
   - resend npm package installed via pnpm
   - Lazy initialization — graceful degradation if RESEND_API_KEY is missing

2. Domain syanomarket.online verified on Resend:
   - DKIM ✅  SPF ✅  MX ✅

3. Email OTP verification on registration:
   - DB columns added: users.email_otp, users.email_otp_expires_at, users.email_verified
   - POST /api/auth/register → sends OTP email when ENABLE_EMAIL_VERIFICATION=true
   - POST /api/auth/verify-email → verifies OTP, issues JWT
   - POST /api/auth/resend-otp → resends OTP (60s rate limit enforced)
   - Frontend OTP verification screen added

4. Required Replit Secrets — ALL must be set before starting:
   SESSION_SECRET
   RESEND_API_KEY
   EMAIL_FROM              = noreply@syanomarket.online
   CORS_ORIGIN             = https://syanomarket.online
   SITE_URL                = https://syanomarket.online
   ROOT_ADMIN_PASSWORD
   VAPID_EMAIL             = mailto:admin@syanomarket.online
   VAPID_PRIVATE_KEY
   VAPID_PUBLIC_KEY
   VITE_SUPPORT_PHONE
   EMBEDDING_SERVICE_URL   = http://localhost:8001
   ENABLE_EMAIL_VERIFICATION = true

5. Embedding Service:
   - Status: Running on TF-IDF fallback — INTENTIONAL
   - Do NOT install sentence-transformers or torch during development
   - Full model (449MB) will be installed once during final pre-launch testing only
   - Model: paraphrase-multilingual-MiniLM-L12-v2 (384 dimensions)

## Database State
- 33 tables, fully migrated
- 42 products with vector embeddings
- pgvector enabled — vector(384) on products table
- Additive-only migrations — never drop or alter columns

## Test Accounts
- Admin:   delewatiamer7@gmail.com
- Seller:  delewatiamer8@gmail.com
- Courier: delewatiamer9@gmail.com
