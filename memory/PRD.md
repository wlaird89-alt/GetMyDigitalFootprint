# Instagoogleface.com - Product Requirements Document

## Original Problem Statement
Build a modern SaaS web application called Instagoogleface.com that combines username OSINT search, content discovery, and risk analysis with a monetization layer. Users enter a username to discover their presence across the internet, surface search results, show teaser snippets, generate a risk score, and lock full analysis behind a €4.99 paywall.

## Architecture
- **Frontend**: React 19 + TailwindCSS + Shadcn/UI
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: Emergent Google OAuth
- **Payments**: Stripe Checkout (€4.99 one-time)
- **Search**: SerpAPI (optional, graceful fallback)

## User Personas
1. **Privacy-Conscious Individual**: Wants to check their own digital footprint
2. **HR Professional**: Screening candidates' online presence
3. **Parent**: Monitoring children's social media exposure
4. **Security Researcher**: Investigating username patterns

## Core Requirements (Static)

### Features Implemented
1. **Username OSINT Scan** ✅
   - Scans 12 platforms: Instagram, Twitter/X, TikTok, GitHub, Reddit, LinkedIn, YouTube, Pinterest, Twitch, Snapchat, Medium, Tumblr
   - HTTP-based existence checking with intelligent response parsing
   - Platform badges with found/not-found/unknown status

2. **Search Results Aggregation** ✅
   - SerpAPI integration with site-specific queries
   - Graceful fallback when API key missing
   - Results grouped by platform

3. **Risk Scoring Engine** ✅
   - 0-100 score based on: platforms found, mentions, personal identifiers, contact patterns
   - Visual circular progress indicator
   - Risk levels: Low (0-30), Medium (30-60), High (60-100)

4. **Teaser + Paywall System** ✅
   - Free: Risk score, platform badges, 3 search result previews
   - Paid: Full report with all results and recommendations
   - Blur effect on premium content

5. **Stripe Checkout** ✅
   - €4.99 one-time payment
   - Checkout session flow
   - Payment status polling
   - Webhook support

6. **Google Authentication** ✅
   - Emergent-managed Google OAuth
   - Session-based auth with httpOnly cookies
   - Scan history for logged-in users

7. **Dashboard** ✅
   - Scan history view
   - Premium report access for paid scans

## What's Been Implemented (March 2026)

### Backend (`/app/backend/server.py`)
- Username scan endpoint with platform checking
- Risk scoring algorithm
- Stripe checkout integration
- Emergent Google OAuth
- Scan history endpoints
- Payment transaction tracking

### Frontend
- Landing page with username input and platform filter
- Scanning animation with terminal-style output
- Results page with risk score, platform badges, paywall
- Full report page for premium users
- Dashboard for authenticated users
- Payment success page with polling

### Design
- Dark cybersecurity theme (#020617 background)
- Cyan accent (#00E5FF)
- Glassmorphism cards
- Outfit/Manrope/JetBrains Mono fonts

## Prioritized Backlog

### P0 (Critical for Launch)
- [x] Core scanning functionality
- [x] Stripe payment flow
- [x] Paywall system
- [x] Basic auth

### P1 (Important)
- [ ] Add SerpAPI key for live search results
- [ ] Email report delivery after payment
- [ ] Export report as PDF

### P2 (Nice to Have)
- [ ] Historical scan comparison
- [ ] Username suggestions/variations
- [ ] Scheduled re-scans with alerts
- [ ] Team/enterprise pricing

## Next Action Items
1. **Add SerpAPI Key**: Set `SERPAPI_API_KEY` in `/app/backend/.env` to enable live search results
2. **Test Full Payment Flow**: Complete a test payment on Stripe to verify report unlock
3. **Consider Email Integration**: Send premium reports via email after payment
4. **Add Analytics**: Track conversion rates from scan to payment

## Technical Notes
- Platform scanning uses HTTP HEAD/GET with intelligent response parsing
- Some platforms (LinkedIn, Reddit) block automated requests → shows "unknown"
- Risk score formula: platforms(40) + mentions(30) + personal(10) + contact(10) + visibility(10)
- All scan data stored in MongoDB `scans` collection
- Payment transactions stored in `payment_transactions` collection
