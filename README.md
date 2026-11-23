# Shop Manager (Arasi Shop)

A point-of-sale and shop management web application tailored for a single shop owner in India operating:
1. **Internet Centre**: Printouts, Xerox, Typing, and Government Applications (Community Certificate, Aadhaar, PAN, etc.)
2. **Ice Cream**: Arun Ice Creams menu
3. **Tailoring**: Custom blouse and churidar orders

---

## Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript (strict)
- **Styling**: Tailwind CSS + custom mobile-first UI components, Lucide icons
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) + `@supabase/ssr`
- **Form & Validation**: Zod, React Hook Form
- **State & Data Fetching**: TanStack Query (React Query)
- **Dates**: `date-fns` & `date-fns-tz` locked to `Asia/Kolkata` (IST)
- **Reporting & Charts**: Recharts
- **PDF**: jsPDF for A4 vendor orders
- **Testing**: Vitest

---

## Getting Started

### 1. Supabase Project Setup
1. Create a project at [supabase.com](https://supabase.com).
2. In Supabase Dashboard -> **Authentication** -> **Providers** -> **Email**:
   - Ensure Email provider is enabled.
3. In Supabase Dashboard -> **Authentication** -> **URL Configuration**:
   - Set Site URL to `http://localhost:3000` (or your production Vercel domain).
   - Set Redirect URLs to `http://localhost:3000/auth/callback` and `https://<your-vercel-app>.vercel.app/auth/callback`.
4. In Supabase Dashboard -> **Authentication** -> **Sign In / Up**:
   - **Disable "Allow new users to sign up"** (Owner-only application).
5. In Supabase Dashboard -> **Authentication** -> **Users**:
   - Click **Add user** -> **Create user** with the owner's email and password.

### 2. Apply Database Migrations & Seeds
Run the SQL migration scripts in order using the Supabase SQL Editor:
1. `supabase/migrations/20261122000001_initial_schema.sql` (Creates all 15 tables and indexes)
2. `supabase/migrations/20261122000002_rls_policies.sql` (Enables RLS on all tables with authenticated owner-only access)
3. `supabase/migrations/20261122000003_functions_and_rpc.sql` (Next token atomic generator, create_bill, deliver_tailoring_order, pay_vendor_order)
4. `supabase/migrations/20261122000004_report_views.sql` (Sales by category, cash vs UPI collected, expenses, customer ledger balance)
5. `supabase/seed.sql` (Seeds Categories, Expense Categories, Shop Settings, and initial Services)

### 3. Environment Variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Phase Roadmap
- **Phase 1 (Complete)**: Project setup, folder structure, SQL schema + RLS + DB functions, auth/login, responsive app shell.
- **Phase 2**: Price List management + `pricing.ts` calculation engine with Vitest unit tests.
- **Phase 3**: New Entry counter billing screen, atomic tokens (`#1, #2...`), today's list, edit/delete.
- **Phase 4**: Account customers, credit billing, cash/UPI partial payments, ledger timeline.
- **Phase 5**: Tailoring orders, status pipeline (Received -> Ready -> Delivered), delivery billing.
- **Phase 6**: Shop expense management and auto-linked vendor order expenses.
- **Phase 7**: Vendor orders with WhatsApp message format, A4 PDF generation, and payment flow.
- **Phase 8**: Reports & Dashboard, sales vs collected, day-close drawer cash reconciliation, CSV export.
- **Phase 9**: PWA setup (manifest + service worker), polish, Vercel deployment.

