<p align="center">
  <img src="./public/logo.png" alt="Arasi Iceland & Computers Logo" width="130" height="130" />
</p>

<h1 align="center">🍨 Arasi Iceland & Computers 🖥️ ✂️</h1>

<p align="center">
  <strong>A purpose-built, super-intuitive shop management app crafted with love for my Mom.</strong>
</p>

<p align="center">
  <a href="https://arasiiceland.vercel.app">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-arasiiceland.vercel.app-0284c7?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/Made_with_❤️_for-My_Mom-ff69b4?style=for-the-badge" alt="Made for Mom" />
  <img src="https://img.shields.io/badge/Status-Production_Ready-10b981?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Next.js-14_(App_Router)-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL_(Neon)-00e599?style=for-the-badge&logo=postgresql&logoColor=black" alt="PostgreSQL" />
</p>

---

## 🌟 Live Application

> **🔗 Experience the live application:** **[https://arasiiceland.vercel.app](https://arasiiceland.vercel.app)**  
> *Optimized for mobile smartphones, tablets, and desktop counter screens.*

---

## 💖 Built with Love for My Mom

<p align="center">
  <em>"Behind every successful local business is a hardworking mother doing everything from sunrise to midnight."</em>
</p>

My mother runs **Arasi Iceland & Computers** in Modakurichi (Erode, Tamil Nadu). Under a single roof, she independently manages three completely different customer businesses:

1. **🍨 Arun Ice Creams Parlour**: Retail sales of nearly 100 ice cream cups, cones, bars, and family tubs.
2. **🖥️ Internet & Online Service Centre**: Xerox, color printouts, typing, and essential government services (Aadhaar cards, PAN cards, community certificates, and exam applications).
3. **✂️ Tailoring & Boutique**: Custom women's blouse stitching, lining blouses, churidars, and garment alterations.

Watching her run the shop every single day, I saw how stressful manual record-keeping was for her. I built this software specifically around **her daily routine, her workflow, and her peace of mind**.

---

## 🛑 The Pain Points She Faced (Before)

Before this software, running the shop meant juggling multiple physical notebooks, loose receipts, and stressful calculations:

| # | Daily Challenge | What Happened in Real Life |
|---|---|---|
| 📝 | **Scattered Paper Diaries** | She had to write entries across 3 different physical notebooks. Pages would get torn, stained, or misplaced during busy evening rush hours. |
| 🧮 | **Manual Mental Math Under Pressure** | When 4 to 5 customers crowded the counter, calculating multiple printouts, xerox copies, and ice creams in her head caused fatigue and accidental undercharging. |
| 📦 | **Ice Cream Box vs Unit Confusion** | Arun Ice Creams vendors sell in master boxes (e.g., 24 cups/box), but customers buy single units. Calling the vendor and calculating how many boxes to order was confusing and time-consuming. |
| 🧵 | **Lost Tailoring Measurements & Due Dates** | Tailoring measurements written on paper slips often got mixed up. Tracking which blouse was *Received*, *Stitched*, or *Due for Delivery* was a constant headache. |
| 📖 | **Customer Credit (Udhar) Disputes** | Customers who took items on credit often forgot past payments. Tracking partial cash and UPI payments in small diaries led to uncomfortable balance disagreements. |
| 🖥️ | **Complex Existing POS Software** | Mainstream POS systems (like Tally or generic retail apps) are packed with complicated accounting jargon (Debit, Credit, Ledger reconciliation) that felt overwhelming on a mobile screen. |

---

## 💡 How We Solved It For Her (After)

We stripped away all unnecessary complexity and designed a **clean, 1-tap mobile experience** tailored directly to her hands:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   HOW THE SOLUTION WORKS FOR MOM                       │
│                                                                        │
│   🍨 1-Tap Bill Entry   ──►  Auto-Token (#1, #2..)  ──► Instant Total  │
│   📦 Vendor Re-order    ──►  1-Click WhatsApp Msg   ──► A4 Print PDF   │
│   ✂️ Tailoring Pipeline ──►  Received ➔ Ready ➔ Delivered              │
│   📊 Mom-Friendly Stats ──►  No confusing jargon    ──► Pure Clarity   │
└────────────────────────────────────────────────────────────────────────┘
```

- **⚡ 1-Tap Quick Counter Billing**:
  - Big, easy-to-tap buttons for all 111 items.
  - Automatic token number generation (`#1`, `#2`, `#3`...) reset daily for easy customer queue management.
  - Cart sits right at the top on mobile so she can review items instantly without scrolling.

- **📦 1-Click Vendor Purchase Orders**:
  - Pre-programmed with Arun Ice Cream box conversion rates (e.g., units per box).
  - Automatically generates ready-to-send **WhatsApp order text** with one button tap.
  - Automatically generates an official **A4 PDF Purchase Order** with shop branding and dispatch breakdown.

- **✂️ Tailoring Workflow Made Visual**:
  - Visual status pipeline: **Received** ➔ **Ready for Delivery** ➔ **Delivered**.
  - Customer phone numbers, custom measurements, and promised delivery dates are organized on interactive cards.

- **📊 Mom-Friendly Reports (Zero Jargon)**:
  - Removed confusing terms like *"Net Realized Profit"*, *"Expected Margin"*, and *"Drawer Cash Net"*.
  - Replaced with crystal-clear bar charts: **Today vs Yesterday**, **This Week vs Last Week**, **Sales by Category**, and **Most Bought Ice Creams**.

- **📱 Mobile-First PWA (Installable on Phone)**:
  - Works like a native mobile app directly on her phone home screen with offline resilience.
  - Smooth slide-out navigation drawer designed for quick single-thumb navigation.

---

## 🚀 Key Features Breakdown

```
✨ Arasi Iceland & Computers Architecture
├── 📱 Counter POS (Fast Billing & Token Queue)
├── 🍨 Arun Ice Cream Catalog (98 SKUs with box metrics)
├── 🖥️ Internet Centre Services (Printout, Xerox, Govt Forms)
├── ✂️ Tailoring Tracker (Measurements & Delivery Dates)
├── 📦 Vendor Management (WhatsApp Orders & PDF Generator)
├── 📒 Customer Ledger (Udhar / Credit with Partial Payments)
├── 💸 Expense Tracker (Shop Utilities, Stock & Maintenance)
└── 📈 Clear Analytics (Daily, Weekly & Monthly comparisons)
```

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies Used |
|---|---|
| **Frontend Framework** | **Next.js 14** (App Router, React Server Components) |
| **Language** | **TypeScript** (Strict mode enabled) |
| **Styling & Design** | **Tailwind CSS**, SF Pro Display Typography, Lucide Icons |
| **Database** | **PostgreSQL (Neon Serverless)** with connection pooling |
| **State Management** | **TanStack Query (React Query)** & SWR for real-time sync |
| **PDF Generation** | **jsPDF** (Automated A4 Official Purchase Orders) |
| **Testing** | **Vitest** (29 comprehensive unit & integration tests) |
| **Deployment** | **Vercel** with automatic edge CDN caching |

---

## 🧪 Testing & Verification

The application is protected with automated test suites verifying pricing algorithms, report aggregations, date-time formatting (locked to `Asia/Kolkata` IST), and box conversion logic:

```bash
# Run unit & integration tests
npx vitest run
```

```
✓ tests/reports.test.ts (5 tests)
✓ tests/pricing.test.ts (15 tests)
✓ tests/icecream.test.ts (4 tests)
✓ tests/dates.test.ts (5 tests)

Test Files  4 passed (4)
     Tests  29 passed (29)
```

---

## 💻 Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/dineesh07/ArasiIceLand.git
cd ArasiIceLand
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the project root:
```env
DATABASE_URL=postgresql://user:password@ep-your-database-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-secure-jwt-secret-key-ist
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

<p align="center">
  <sub>Crafted with ❤️ by Dineesh for my Mom · Arasi Iceland & Computers</sub>
</p>
