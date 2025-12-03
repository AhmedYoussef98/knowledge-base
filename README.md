# Knowledge Base Platform

A self-service SaaS platform for creating AI-powered customer service knowledge bases. Clients can register, create their own isolated knowledge base instances, configure branding, and provide their own Gemini API keys.

## Features

- 🔐 **Multi-tenant architecture** - Each client gets their own isolated knowledge base
- 🤖 **AI-powered** - Tenant-provided Gemini API keys for smart search and auto-generated answers
- 🎨 **Custom branding** - Each tenant can customize their primary color
- 📊 **Analytics dashboard** - View top questions and keywords
- 🔍 **Full-text search** - Search across questions, answers, and keywords
- 🌐 **Bilingual support** - Arabic (RTL) and English

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **AI**: Google Gemini API (tenant-provided keys)
- **Auth**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/knowledge-base.git
   cd knowledge-base
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

## Project Structure

```
├── App.tsx                 # Main routing and context providers
├── pages/
│   ├── Home.tsx            # Public knowledge base view
│   ├── Admin.tsx           # Tenant admin dashboard
│   ├── SignUp.tsx          # User registration
│   ├── Login.tsx           # User authentication
│   ├── Onboarding.tsx      # 3-step tenant setup wizard
│   └── Settings.tsx        # Tenant configuration
├── components/
│   ├── Navbar.tsx          # Navigation with branding
│   ├── AIAssistant.tsx     # Chat interface
│   └── Admin/              # Admin components
├── contexts/
│   ├── AuthContext.tsx     # Supabase auth state
│   └── TenantContext.tsx   # Current tenant state
├── services/
│   ├── api.ts              # Data API (tenant-aware)
│   ├── ai.ts               # Gemini AI integration
│   ├── supabase.ts         # Supabase client
│   └── tenantApi.ts        # Tenant CRUD operations
└── supabase_schema.sql     # Database migration script
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/signup` | User registration |
| `/login` | User authentication |
| `/onboarding` | Tenant setup wizard |
| `/settings` | Tenant configuration |
| `/kb/:slug` | Public knowledge base |
| `/kb/:slug/admin` | Tenant admin panel |

## Security

- **Row-Level Security (RLS)** enforces tenant isolation at the database level
- **Supabase Auth** handles user authentication
- **Environment variables** store sensitive configuration
- **Client-side API keys** are used for Gemini (tenants provide their own)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
