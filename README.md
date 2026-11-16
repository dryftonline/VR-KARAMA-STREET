# VR STREET KARAMA
## Production-Ready Sales Tracking & Management System (PWA)

A mission-critical, real-time Sales Tracking and Shift Management Progressive Web Application engineered for **VR Street Karama**. Built with Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL with Row Level Security (RLS), Supabase Realtime, Supabase Private Storage, and Firebase Cloud Messaging (FCM) Web Push Notifications.

---

## 1. Key Business Rules & Architectural Highlights

### Currency: Indian Rupee (INR - ₹)
- Default currency: Indian Rupees (₹ / INR).
- Formatted strictly to the Indian numbering system: e.g., `₹1,25,000.00`.
- All monetary values are stored in PostgreSQL using `NUMERIC(12, 2)` (never floating point).
- Decimal-safe calculations prevent precision drift.

### Shared Shop Sales Model
- All sales belong to the business **VR Street Karama**.
- Staff record transactions into one shared sales ledger with server-verified timestamps.
- **Owner View:** Sees combined shop revenue across all staff, filterable by employee.
- **Staff View:** Access only to their own shift status and sales recorded during their shift.
- **Row Level Security (RLS):** Database-level security guarantees staff cannot query overall shop revenue, other employees' sales, or financial reports.

### Staff-Managed Opening & Closing Records
- Staff submit their opening and closing records with register photographs.
- Server automatically records the exact timestamp in the `Asia/Kolkata` timezone.
- Photos are stored in a private Supabase bucket (`shift-photos`).
- Access to photographs is protected using temporary signed URLs (no public URLs).
- Duplicate opening or closing records for the same shift are blocked by unique database constraints.

### Real-Time Sales Updates & Push Notifications
- Owner Dashboard subscribes to live Supabase Realtime changes (`sales` table `INSERT`).
- Firebase Cloud Messaging (FCM) sends web push notifications to the Owner's registered devices as soon as a sale is committed to the database.
- Multi-device support with active/inactive toggles and test notification dispatch.
- Idempotent notification delivery ensures no duplicate notifications are sent.

---

## 2. Technology Stack

- **Framework:** Next.js 14 (App Router, Server Actions, API Routes)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS (Navy & Gold luxury retail theme)
- **Icons:** Lucide React
- **Database:** Supabase PostgreSQL with RLS
- **Authentication:** Supabase Auth (Owner-provisioned staff, no public registration)
- **Real-Time Feed:** Supabase Realtime
- **Secure File Storage:** Supabase Storage (Private bucket `shift-photos` with signed URLs)
- **Push Notifications:** Firebase Cloud Messaging (FCM) Web Push & Firebase Admin SDK
- **Application Type:** Installable Progressive Web App (PWA) with Service Worker

---

## 3. Project Directory Structure

```
├── public/
│   ├── firebase-messaging-sw.js    # FCM background service worker
│   ├── sw.js                       # PWA offline & asset caching service worker
│   ├── manifest.json               # Web App Manifest
│   └── icons/                      # 192x192 & 512x512 PWA icons & SVG
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── create-staff/   # Owner creates staff accounts
│   │   │   │   ├── toggle-staff/   # Owner activates/deactivates staff
│   │   │   │   └── me/             # Profile & role verification
│   │   │   ├── sales/
│   │   │   │   ├── record/         # Staff commits sale & triggers FCM
│   │   │   │   ├── live/           # Real-time / filtered sales endpoint
│   │   │   │   └── correct/        # Owner transaction corrections with audit
│   │   │   ├── shifts/
│   │   │   │   ├── open/           # Staff submits opening with photo & server time
│   │   │   │   ├── close/          # Staff submits closing with photo & server time
│   │   │   │   ├── status/         # Shift status for today
│   │   │   │   └── photo-url/      # Generates signed URLs for private photos
│   │   │   ├── notifications/
│   │   │   │   ├── register-device/# Owner registers FCM device token
│   │   │   │   ├── toggle-device/  # Owner enables/disables device
│   │   │   │   ├── test/           # Owner sends test push alert
│   │   │   │   └── list/           # List devices and notification logs
│   │   │   ├── reports/
│   │   │   │   ├── summary/        # Aggregated KPI and period reports
│   │   │   │   └── export-csv/     # CSV export generator
│   │   │   ├── staff/list/         # Owner fetches staff list
│   │   │   ├── audit/list/         # Immutable audit log fetch
│   │   │   └── setup/              # Initial Owner initialization endpoint
│   │   ├── auth/
│   │   │   ├── login/              # Premium branded login page
│   │   │   └── callback/           # Auth session handler
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Dashboard shell & navigation
│   │   │   ├── page.tsx            # Role router (Owner vs Staff)
│   │   │   ├── owner/page.tsx      # Comprehensive Owner Dashboard
│   │   │   └── staff/page.tsx      # Mobile-first Staff Dashboard
│   │   ├── offline/page.tsx        # PWA offline fallback page
│   │   ├── globals.css             # Tailwind theme & variables
│   │   └── layout.tsx              # Root HTML layout with PWA meta
│   ├── components/
│   │   ├── ui/                     # Reusable UI primitives (Button, Card, Input, Modal, Badge, Toast)
│   │   ├── owner/                  # Owner Dashboard widgets (KPIs, Live Feed, Charts, Tables, FCM manager)
│   │   ├── staff/                  # Staff Dashboard widgets (Shift status, Sale keypad, Recent list)
│   │   └── shared/                 # Navbar with IST live clock, CurrencyDisplay, PWA Install Banner
│   └── lib/
│       ├── firebase/               # FCM Client and Admin SDK initialization
│       ├── supabase/               # Browser, Server, and Admin Supabase clients
│       ├── types/                  # Complete TypeScript definitions
│       └── utils/                  # Currency (INR) and Timezone (Asia/Kolkata) helpers
├── supabase/
│   ├── migrations/                 # Full SQL migration schema and RLS policies
│   └── seed.sql                    # Initial seed guidance
└── tests/
    └── verify-calculations.ts      # Automated test suite for calculations and timezones
```

---

## 4. Database Schema & Security Architecture

### Tables:
1. `profiles`: `id`, `full_name`, `email`, `role ('OWNER' | 'STAFF')`, `is_active`, `created_at`, `updated_at`.
2. `sales`: `id`, `transaction_number`, `staff_id`, `amount`, `payment_method ('CASH' | 'UPI')`, `business_date`, `notes`, `created_at`.
3. `staff_shifts`: `id`, `staff_id`, `business_date`, `opening_time`, `opening_photo_url`, `closing_time`, `closing_photo_url`, `created_at`, `updated_at`.
4. `notification_devices`: `id`, `owner_id`, `device_token`, `device_type`, `device_name`, `is_active`, `created_at`, `updated_at`.
5. `notification_logs`: `id`, `sale_id`, `owner_id`, `status ('SENT' | 'FAILED' | 'SKIPPED')`, `sent_at`, `error_message`.
6. `audit_logs`: `id`, `actor_id`, `action`, `target_type`, `target_id`, `details`, `created_at`.

### Row Level Security (RLS) Policies:
- Staff can insert only their own sales and view only their own transactions.
- Staff cannot query other employees' records or overall business revenue.
- Staff cannot alter transaction timestamps, update, or delete sales records.
- Owners can view the entire shared sales ledger and financial reports.
- Shift photos are placed in a private storage bucket (`shift-photos`). Viewing photos requires signed URLs generated on the server with user role checks.

---

## 5. Supabase Setup Instructions

1. **Create Supabase Project:**
   - Go to [database.new](https://database.new) and create a new project.
   - Note down your Project URL and Anon Key from **Project Settings -> API**.
   - Note down your `service_role` key (keep this strictly confidential!).

2. **Run SQL Migration:**
   - Go to the **SQL Editor** in your Supabase Dashboard.
   - Open and copy the contents of `supabase/migrations/20261115000000_init_vr_street_karama.sql`.
   - Click **Run** to execute the migration. This creates all tables, indexes, triggers, RLS policies, the private `shift-photos` storage bucket, and Realtime publications.

3. **Initialize the Owner Account:**
   - Use the `/api/setup` endpoint or create a user in Supabase Auth with email `owner@vrstreetkarama.com`.
   - Update their role to `OWNER` in the `profiles` table.

---

## 6. Firebase Cloud Messaging (FCM) Setup Instructions

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/) and create a project (e.g., `vr-street-karama`).
   - Under **Project Settings -> General -> Your Apps**, click the Web icon (`</>`) to register a web app.
   - Copy the `firebaseConfig` credentials into `.env.local`:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`

2. **Generate Web Push Certificate (VAPID Key):**
   - In Firebase Console, go to **Project Settings -> Cloud Messaging -> Web configuration**.
   - Under **Web Push certificates**, click **Generate key pair**.
   - Copy the key into `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

3. **Generate Admin Private Key (Server-Side):**
   - In Firebase Console, go to **Project Settings -> Service accounts**.
   - Click **Generate new private key** (JSON file).
   - Copy the `project_id`, `client_email`, and `private_key` into:
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY`

---

## 7. Local Development & Deployment

### Local Development:
```bash
# 1. Clone repository
git clone <repo-url>
cd "VR STREET KARAMA"

# 2. Configure environment
cp .env.example .env.local
# Fill in your Supabase and Firebase keys

# 3. Install dependencies
npm install

# 4. Run automated test suite
npx tsx tests/verify-calculations.ts

# 5. Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploying to Vercel:
1. Push your repository to GitHub.
2. In Vercel, click **Add New Project** and import the repository.
3. Add the environment variables from `.env.example` in Vercel's Project Settings.
4. Click **Deploy**. Vercel will build and launch your production Next.js PWA.

---

## 8. Verification & Testing Checklist

- [x] **Currency Formatting:** Displaying `₹1,25,000.00` with Indian numbering rules.
- [x] **Timezone Calculation:** Server timestamps generated in `Asia/Kolkata` (IST).
- [x] **Shared Ledger:** Staff entries flow into the single shop sales pool.
- [x] **RLS Enforcement:** Staff accounts cannot read total shop revenue or other staff sales.
- [x] **Live Realtime Feed:** New sales appear on the Owner dashboard without page refresh.
- [x] **Staff Shift Management:** Photo uploads and server-side opening/closing timestamps.
- [x] **Secure Photo Access:** Private storage bucket with short-lived signed URLs.
- [x] **FCM Web Push:** Push notification dispatched to Owner devices on committed sales.
- [x] **Audit Trail:** Mandatory reason and logging for all transaction corrections.
- [x] **PWA Installable:** Web app manifest, service worker, and home screen prompt.

