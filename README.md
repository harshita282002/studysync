# StudySync

Campus peer-matching and team-building platform built for MBA and postgraduate university students to form balanced, skill-matched teams for case competitions, hackathons, semester projects, and peer study groups.

## Core Capabilities
- **Authentication & Onboarding**: Email/Password, Google Sign-In, and Quick Demo Guest Login, followed by an academic & skill-tagging Profile Setup Wizard (up to 6 skills with proficiency levels).
- **Smart Complementary Match Engine**: Ranks campus peers by **Complementary Match %**, prioritizing skills the current user lacks alongside availability and reliability.
- **Live Collaboration Noticeboard**: Real-time open calls across Case Competitions, Semester Projects, Hackathons, and Study Groups with deadline countdowns, matched-skill highlights, and one-click Apply to Join.
- **Persistent Team Workspaces**: Unlocked Kanban Task Board (*To Do*, *In Progress*, *Done*), shared resource links, and team scratchpad notes synced via Cloud Firestore.
- **StudySync Pro Tier (₹149/month)**: Simulated upgrade flow toggling Pro verification badge and priority discovery perks.

## Firebase Setup & Deployment

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and fill in your Firebase web app credentials:
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   VITE_FIREBASE_DATABASE_ID="(default)"
   VITE_RAZORPAY_KEY_ID="rzp_test_your_key_here"
   ```
   *(If deploying inside AI Studio, `firebase-applet-config.json` is automatically provisioned and used as fallback. Set `VITE_RAZORPAY_KEY_ID` to your Razorpay Test/Live Key ID for StudySync Pro ₹149/month checkout.)*

3. **Enable Firebase Authentication Providers**:
   In the Firebase Console → **Authentication → Sign-in method**, enable:
   - **Google** (enabled by default in AI Studio provisioning)
   - **Email/Password** (required for email sign-up/login)
   - **Anonymous** (optional, enables Firestore-backed Quick Demo Guest sessions; otherwise the app seamlessly persists demo sessions locally)

4. **Deploy Firestore Security Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Run locally or build for production**:
   ```bash
   npm run dev
   npm run build
   ```

## Static Hosting (GitHub Pages / Vercel / Netlify)
- `vite.config.ts` sets `base: './'` for relative asset resolution.
- Navigation uses state-based view switching, preventing 404 errors on page refresh across static hosts.
