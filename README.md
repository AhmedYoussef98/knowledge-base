# Daleel (دليل) - AI Knowledge Base Platform

**Your AI Path to Clarity** • دليلك الذكي نحو الوضوح

A self-service SaaS platform for creating AI-powered customer service knowledge bases. Built with the Daleel brand identity featuring a dark, neon-accented design inspired by circuit boards and electrified knowledge.

## ✨ Features

- 🔐 **Multi-tenant architecture** - Each client gets their own isolated knowledge base
- 🤖 **AI-powered** - Tenant-provided Gemini API keys for smart search and auto-generated answers
- 🎨 **Custom branding** - Each tenant can customize their primary color
- 🌐 **Bilingual support** - Full Arabic (RTL) and English with language switching
- 📊 **Analytics dashboard** - View top questions, keywords, and search trends
- 🔍 **Smart search** - AI-powered full-text search across questions, answers, and keywords
- ⚡ **Circuit Glow UI** - Dark theme with neon accents and glow effects
- 🎯 **Space Grotesk + Tajawal** - Typography optimized for English and Arabic

## 🎨 Brand Identity

**Daleel** features the "Circuit Glow" design system:

### Color Palette
- **Daleel Neon** (`#A3FF47`) - Primary CTAs, logo glow
- **Circuit Cyan** (`#00C2CB`) - Secondary accents, links
- **Core Green** (`#4ADE80`) - Success states
- **Deep Space** (`#0F172A`) - Main background
- **Tech Slate** (`#1E293B`) - Secondary backgrounds

### Typography
- **Headings**: Space Grotesk (geometric, technical)
- **Body**: Tajawal (supports both English and Arabic)

### Visual Elements
- Neon glow effects on buttons and interactive elements
- Circuit board patterns in backgrounds
- Gradient overlays (Cyan → Green)
- RTL layout support for Arabic

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 with custom design system
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **AI**: Google Gemini API (tenant-provided keys)
- **Auth**: Supabase Auth
- **Animations**: GSAP + Framer Motion

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google Gemini API key (for tenants)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/daleel-knowledge-base.git
   cd daleel-knowledge-base
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

4. **Set up the database**

   Run the SQL migration in your Supabase SQL Editor:
   - Open `supabase_schema.sql` and execute it in Supabase Dashboard → SQL Editor

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `VITE_GEMINI_API_KEY` | ❌ | Optional fallback Gemini API key |

## 📂 Project Structure

```
├── App.tsx                      # Main routing and context providers
├── index.css                    # Daleel design system & Tailwind config
├── pages/
│   ├── Landing.tsx              # Daleel landing page
│   ├── Dashboard.tsx            # User KB management dashboard
│   ├── Home.tsx                 # Public knowledge base view
│   ├── Admin.tsx                # Tenant admin panel
│   ├── SignUp.tsx               # User registration
│   ├── Login.tsx                # User authentication
│   ├── ForgotPassword.tsx       # Password reset
│   ├── UpdatePassword.tsx       # Password update
│   ├── Onboarding.tsx           # 3-step tenant setup wizard
│   └── Settings.tsx             # Tenant configuration
├── components/
│   ├── Navbar.tsx               # Bilingual navigation with language toggle
│   ├── AIAssistant.tsx          # Chat interface
│   ├── KnowledgeCard.tsx        # Q&A display cards
│   ├── AnalyticsDashboard.tsx   # Analytics modal
│   └── Admin/                   # Admin components
├── contexts/
│   ├── AuthContext.tsx          # Supabase auth state
│   ├── TenantContext.tsx        # Current tenant state
│   └── LanguageContext.tsx      # i18n and RTL support
├── i18n/
│   ├── translations.ts          # All bilingual strings
│   └── useTranslation.ts        # Translation hook
├── services/
│   ├── api.ts                   # Data API (tenant-aware)
│   ├── ai.ts                    # Gemini AI integration
│   ├── supabase.ts              # Supabase client
│   └── tenantApi.ts             # Tenant CRUD operations
└── supabase_schema.sql          # Database migration script
```

## 🌍 Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Daleel landing page | Public |
| `/signup` | User registration | Public |
| `/login` | User authentication | Public |
| `/forgot-password` | Password reset request | Public |
| `/update-password` | Password update form | Authenticated |
| `/dashboard` | User KB management | Authenticated |
| `/onboarding` | Tenant setup wizard (3 steps) | Authenticated |
| `/settings` | Tenant configuration | Owner only |
| `/kb/:slug` | Public knowledge base | Public |
| `/kb/:slug/admin` | Tenant admin panel | Admin/Owner |
| `/invite/:token` | Team invitation acceptance | Public w/ token |
| `/gemini-guide` | Gemini API key setup guide | Public |

## 🔒 Security

- **Row-Level Security (RLS)** enforces tenant isolation at the database level
- **Supabase Auth** handles user authentication with email verification
- **Environment variables** store sensitive configuration
- **Client-side API keys** are used for Gemini (tenants provide their own)
- **Role-based access control** (Owner, Admin, Viewer roles)

## 🌐 Internationalization

Daleel is fully bilingual with:
- Complete English and Arabic translations
- RTL (Right-to-Left) layout support for Arabic
- Language switcher in all pages
- Tajawal font for optimal Arabic rendering
- Context-aware translations with `useTranslation` hook

## 🎯 Design System Classes

Custom Tailwind classes for the Daleel brand:

```css
/* Colors */
bg-daleel-neon          /* Neon green #A3FF47 */
bg-daleel-cyan          /* Circuit cyan #00C2CB */
bg-daleel-green         /* Core green #4ADE80 */
bg-daleel-deep-space    /* Deep space background #0F172A */
bg-daleel-tech-slate    /* Tech slate #1E293B */
text-daleel-pure-light  /* Pure light text #F8FAFF */

/* Effects */
glow-neon               /* Neon glow shadow */
glow-cyan               /* Cyan glow shadow */
border-glow-hover       /* Glowing border on hover */
bg-daleel-gradient      /* Cyan to Green gradient */
circuit-pattern         /* Circuit board background pattern */
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ⚡ by the Daleel Team**

*Knowledge, Electrified. • المعرفة.. بذكاء.*
