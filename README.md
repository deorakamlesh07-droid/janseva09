# जनसेवा 09 — Ward 9 Civic Portal

> A full-stack civic engagement portal for **Ward No. 9, Jodhpur (Rajasthan)**.  
> Built for residents to file complaints, track resolution, find emergency numbers, register lost/found items, and connect with blood donors — all in Hindi.

---

## 🌐 Live Features

| Feature | Route | Description |
|---|---|---|
| **Home** | `/` | Hero section with stats, quick services, complaint categories |
| **शिकायत दर्ज** | `/new` | File a new complaint with photo upload & GPS location |
| **शिकायत ट्रैक** | `/s/[code]` | Track complaint status by unique code |
| **शिकायतें देखें** | `/register` | Browse all active complaints publicly |
| **आपातकाल / नंबर** | `/numbers` | Emergency helplines + departmental contact numbers |
| **सरकारी सेवाएँ** | `/sewaye` | Government scheme & service directory |
| **खोया–पाया** | `/khoya` | Lost and found board for the ward |
| **ब्लड डोनर** | `/blood` | Blood donor registry and request board |
| **संचालक** | `/adm` | Password-protected admin dashboard |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, React Server Components) |
| **Language** | TypeScript 5 |
| **UI / Styling** | Vanilla CSS (no Tailwind) — custom design system in `globals.css` |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Storage** | Supabase Storage (complaint photos, after-photos) |
| **Email Alerts** | Nodemailer via Gmail SMTP (new complaint notifications) |
| **Maps** | Leaflet.js (CDN) via custom `LocationPicker` component |
| **Fonts** | Google Fonts — Mukta, Anek Devanagari |
| **Deployment** | Vercel (recommended) |

---

## 📁 Project Structure

```
ward9/
├── app/
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Root layout + nav
│   ├── globals.css           # Full design system (single CSS file)
│   ├── NavClient.tsx         # Sticky navigation bar
│   ├── new/                  # Complaint submission form
│   │   ├── page.tsx
│   │   └── LocationPicker.tsx
│   ├── register/             # Public complaints list
│   ├── s/[code]/             # Complaint tracking by code
│   ├── numbers/              # Emergency & dept numbers
│   ├── sewaye/               # Government services directory
│   ├── khoya/                # Lost & found
│   ├── blood/                # Blood donor registry
│   └── adm/                  # Admin/Sanchalak dashboard
│       └── page.tsx
├── app/api/
│   ├── shikayat/             # Complaint CRUD API
│   ├── adm/                  # Admin auth + complaint update API
│   ├── blood/                # Blood donor API
│   └── khoya/                # Lost & found API
├── lib/
│   ├── supabase.ts           # Supabase client + TypeScript types
│   └── mailer.ts             # Nodemailer email utility
├── public/
│   └── images/               # Static images (fort, representative)
├── supabase-schema.sql       # Full DB schema (run once on Supabase)
└── .env.local                # Environment variables (create manually)
```

---

## 🗄️ Database (Supabase / PostgreSQL)

Four main tables are used:

| Table | Purpose |
|---|---|
| `shikayat` | Complaints — stores code, name, phone, category, detail, photo, status, location |
| `khoya_paya` | Lost & found items |
| `blood_donors` | Blood donor registrations |
| `blood_requests` | Blood requests from residents |

> The full schema is in [`supabase-schema.sql`](./supabase-schema.sql). Run it once in your Supabase SQL editor to create all tables, indexes, and RLS policies.

---

## ⚙️ Environment Variables

Create a `.env.local` file in the project root with the following keys:

```env
# ── Supabase ────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ── Admin Dashboard ─────────────────────────────────────────
ADMIN_PASSWORD=your_secure_password

# ── Email Notifications (SMTP via Gmail) ────────────────────
SANCHALAK_EMAIL=your@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM="वार्ड मित्र 09" <your@gmail.com>

# ── App URL ─────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Gmail App Password:** Go to Google Account → Security → 2-Step Verification → App Passwords → generate one for "Mail".

---

## 🚀 Running Locally — Step by Step

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) **v18 or higher**
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A [Supabase](https://supabase.com/) account (free tier works)

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/ward9.git
cd ward9
```

---

### Step 2 — Install dependencies

```bash
npm install
```

---

### Step 3 — Set up Supabase

1. Go to [supabase.com](https://supabase.com/) and create a new project.
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the contents of [`supabase-schema.sql`](./supabase-schema.sql).
4. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon / public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

### Step 4 — Set up Supabase Storage

1. In your Supabase dashboard, go to **Storage**.
2. Create a new bucket named **`photos`**.
3. Set the bucket to **Public** so uploaded images can be displayed.

---

### Step 5 — Configure environment variables

```bash
# Create .env.local file
cp .env.local.example .env.local   # or create manually
```

Fill in all values as described in the [Environment Variables](#️-environment-variables) section above.

---

### Step 6 — Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Step 7 — Access the Admin Dashboard

Navigate to [http://localhost:3000/adm](http://localhost:3000/adm) and enter the `ADMIN_PASSWORD` you set in `.env.local`.

The dashboard includes:
- View, filter, and update complaint status
- **आँकड़े** tab with live charts and histograms
- Citizen directory (phone book)
- Khoya–Paya and Blood Donor management

---

## 🏗️ Production Build

```bash
npm run build
npm run start
```

---

## ☁️ Deploy to Vercel (Recommended)

1. Push the code to a GitHub repository.
2. Go to [vercel.com](https://vercel.com/) → **Add New Project** → import your repo.
3. In **Environment Variables**, add all keys from `.env.local`.
4. Click **Deploy**. Done.

> Update `NEXT_PUBLIC_APP_URL` to your Vercel domain after deployment.

---

## 🔐 Security Notes

- The admin dashboard is protected by a server-side password check (`/api/adm`).
- Supabase **Row Level Security (RLS)** is enabled — the service role key is only used server-side in API routes.
- Never commit `.env.local` to version control. It is already listed in `.gitignore`.

---

## 📸 Key Pages — Quick Reference

```
/ ................. होम — हीरो, त्वरित सेवाएँ, सांख्यिकी
/new .............. शिकायत दर्ज करें (फ़ोटो + GPS)
/register ......... सभी शिकायतें देखें
/s/[code] ......... शिकायत ट्रैक करें
/numbers .......... आपातकालीन व विभागीय नंबर
/sewaye ........... सरकारी सेवाएँ
/khoya ............ खोया–पाया बोर्ड
/blood ............ ब्लड डोनर
/adm .............. संचालक डैशबोर्ड (पासवर्ड से सुरक्षित)
```

---

## 🙏 About

Built with ❤️ for the residents of **Ward 9, Jodhpur** by the local ward team.  
Representative: **संजय बिश्नोई (जाणी)** — पार्षद, वार्ड नं. 09, जोधपुर नगर निगम।
