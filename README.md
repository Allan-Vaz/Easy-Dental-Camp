# AVM Smiles Dental Camp & Report System

A clinical screening and reporting web application tailored for school dental camps, developed for **AVM Smiles Dental Wellness**, Mangaon, Raigad, Maharashtra.

---

## 🌟 Key Features & Improvements

1. **Firebase + Vercel Architecture (Multi-Location & Multi-Doctor Ready)**
   - **Firestore Real-Time Cloud Sync**: Run multiple doctors/assistants simultaneously on different laptops or tablets at the camp.
   - **Offline Persistence**: Multi-tab IndexedDB cache + automatic `localStorage` backup. The camp team can examine hundreds of students offline in schools without losing a single record.
   - **Vercel Optimized**: Includes `vercel.json` and client-side routing rewrites for 1-click deployment.

2. **Tamper-Proof Official School Dental Health Audit Report (PDF)**
   - Generates an official, non-editable **PDF audit report** for school principals and education inspectors.
   - Features executive metrics, class-wise breakdown, full student ledger with clinical findings, and examining dental surgeon's sign & stamp block.

3. **Palmer / FDI Anatomical Dental Chart (Corrected Orientation)**
   - Top-Left: **Upper Right (UR / वरचे-उजवे)**
   - Top-Right: **Upper Left (UL / वरचे-डावे)**
   - Bottom-Left: **Lower Right (LR / खालचे-उजवे)**
   - Bottom-Right: **Lower Left (LL / खालचे-डावे)**
   - Standard midline orientation: Central incisors (1 or A) meet at the center line; molars expand outward.

4. **In-Browser Local QR Code Generator**
   - WhatsApp appointment booking QR codes are generated directly in-browser using local vector algorithms.
   - Zero rate limits, zero external dependencies when batch-printing cards at the clinic office.

5. **Direct Excel (.xlsx, .xls) & CSV Roster Importer**
   - Drag-and-drop school spreadsheets directly without converting to CSV.
   - Handles quoted names with commas (e.g. `"Chavan, Snehal"`) and Marathi Devanagari script.
   - Smart header detection: recognizes English and Marathi columns (`Roll No`, `अनुक्रमांक`, `Student Name`, `विद्यार्थ्याचे नाव`, `Class`, `इयत्ता`).

6. **2-Up A5 Student Report Card on A4**
   - Pairs two A5 report cards side-by-side on A4 landscape (for 220 GSM paper).
   - Top 2/3: Clinical findings, tooth arch diagram, checklist, doctor stamp.
   - Bottom 1/3: Perforated tear-away family discount voucher (*Free Consultation + 50% Off Scaling*) with auto-filled WhatsApp QR code.

---

## 🚀 Quick Start (Local Development)

### 1. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Build for Production
```bash
npm run build
```

---

## ☁️ Connecting Firebase for Cloud Storage

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project (e.g., `avm-smiles-camps`).
2. Add a **Web App** under Project Settings.
3. Enable **Cloud Firestore Database** (Start in production mode or test mode).
4. Enable **Authentication** -> Sign-in method -> Enable **Anonymous**.
5. Copy your credentials into a `.env` file in the project root:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

*(Note: If Firebase credentials are not provided, the app runs in full offline auto-save mode via `localStorage` with zero setup).*

---

## 🚀 Deploying to Vercel

### Option 1: Via GitHub (Recommended)
1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of AVM Smiles Dental Camp System"
   git remote add origin https://github.com/your-username/dental-camp.git
   git push -u origin main
   ```
2. Log into [Vercel](https://vercel.com).
3. Click **Add New Project** -> Import your GitHub repository.
4. Under **Environment Variables**, add the 6 `VITE_FIREBASE_*` keys from your `.env`.
5. Click **Deploy**. Your app will be live with free SSL!

### Option 2: Via Vercel CLI
```bash
npx vercel
```
Follow the CLI prompts to deploy directly.
