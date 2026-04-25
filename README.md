# 🚗 CarGo — منصة كراء السيارات

> A full-stack vehicle rental marketplace for Algeria, built with React Native (Expo) + Supabase.

---

## 📱 Screens Included

| Screen | Description |
|--------|-------------|
| Onboarding | 3-slide animated intro |
| Login | Email/password auth |
| Register | Role selection (Renter / Owner) |
| Home | Browse cars, search, filter by category |
| Car Detail | Full info, gallery, booking form |
| Add Car | Photo upload, specs, pricing |
| Bookings | Accept/reject requests (owner), track status (renter) |
| Profile | Stats, verification, settings |
| Messages | Placeholder (ready to extend) |

---

## 🚀 Getting Started

### Step 1 — Install dependencies

```bash
npm install
```

### Step 2 — Set up Supabase

1. Go to **https://supabase.com** → Create a free account
2. Click **New Project** → choose a name and strong password
3. Wait ~2 minutes for it to provision
4. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon public` key

5. Open `src/services/supabase.ts` and replace:
```ts
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

### Step 3 — Run the SQL schema

1. In Supabase Dashboard → **SQL Editor** → **New Query**
2. Paste the entire contents of `supabase_schema.sql`
3. Click **Run**

This creates all tables, RLS policies, and storage buckets.

### Step 4 — Start the app

```bash
npx expo start
```

Then scan the QR code with **Expo Go** (iOS/Android) or press:
- `a` for Android emulator
- `i` for iOS simulator
- `w` for web browser

---

## 🗂 Project Structure

```
CarRentalApp/
├── app/                        # Expo Router pages
│   ├── _layout.tsx             # Root layout + auth guard
│   ├── onboarding.tsx
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/                 # Bottom tab navigator
│   │   ├── index.tsx           # Home
│   │   ├── bookings.tsx
│   │   ├── messages.tsx
│   │   ├── profile.tsx
│   │   └── add.tsx             # Owner: add car
│   └── cars/
│       ├── [id].tsx            # Car detail
│       └── add.tsx
│
├── src/
│   ├── components/
│   │   └── UI.tsx              # Button, Input, Card, Badge, etc.
│   ├── constants/
│   │   └── theme.ts            # Colors, Typography, Spacing
│   ├── hooks/
│   │   └── useAuth.tsx         # Auth context + profile
│   ├── screens/                # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── BookingsScreen.tsx
│   │   ├── AddCarScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   └── auth/
│   │       ├── LoginScreen.tsx
│   │       └── RegisterScreen.tsx
│   └── services/
│       └── supabase.ts         # Supabase client
│
├── supabase_schema.sql         # Full DB schema — run this first!
├── app.json
├── babel.config.js
├── package.json
└── tsconfig.json
```

---

## 🎨 Design System

**Color Palette:**
- Primary: `#E8FF47` (Electric Lime)
- Background: `#0A0A0F` (Deep Black)
- Surface: `#12121C`
- Text Primary: `#FFFFFF`
- Text Secondary: `#9090B0`

**All design tokens are in:** `src/constants/theme.ts`

---

## 🔧 What to Build Next

### High Priority
- [ ] **Date picker** — Install `expo-datetimepicker` for car booking dates
- [ ] **Push notifications** — `expo-notifications` for booking alerts
- [ ] **Real-time chat** — Supabase Realtime for owner/renter messages
- [ ] **Payment** — Integrate [Chargily Pay](https://chargily.com) (Algerian gateway)

### Medium Priority
- [ ] **Map view** — `react-native-maps` to show car locations
- [ ] **ID verification** — Upload CNI + permis photos to Supabase Storage
- [ ] **PDF contracts** — `react-native-html-to-pdf`
- [ ] **Rating system** — After rental completion
- [ ] **My Cars** screen for owners

### Nice to Have
- [ ] Dark/Light mode toggle
- [ ] Arabic RTL layout
- [ ] Admin dashboard (Vercel + Next.js)

---

## 🌐 Deployment

### Mobile (Android)
```bash
npx expo build:android
# OR with EAS:
npx eas build --platform android
```

### Mobile (iOS)
```bash
npx eas build --platform ios
```

### Web Dashboard (optional)
Deploy a Next.js admin panel on **Vercel** (free tier).

---

## 💰 Free Tier Limits

| Service | Free Limit |
|---------|-----------|
| Supabase DB | 500 MB |
| Supabase Storage | 1 GB |
| Supabase Auth | Unlimited users |
| Expo | Free for development |
| Vercel | Free for hobby projects |

---

## 📞 Support

Built with ❤️ for the Algerian market. 
Questions? Open an issue or extend the code!

**Tech Stack:** React Native · Expo · TypeScript · Supabase · Expo Router
