# 🌌 GreenGalaxy VR Platform - Technical & Functional Documentation

## 1. Executive Summary
GreenGalaxy is an enterprise-grade **B2B VR Workspace Platform**. It allows organizations to manage VR headsets, deploy branded immersive 3D workspaces, and utilize Generative AI (Google Gemini) to enhance productivity. The platform bridges the gap between traditional web dashboards (2D) and immersive WebXR experiences (3D).

---

## 2. Technical Architecture

### **Stack Overview**
*   **Frontend Framework:** React 18.3.1 (TypeScript)
*   **Styling:** Tailwind CSS (Custom "GreenGalaxy" Design System)
*   **3D Engine:** Three.js + React Three Fiber (R3F)
*   **AI Engine:** Google Gemini API (`gemini-2.5-flash`)
*   **Identity:** Google Identity Services (OAuth 2.0)
*   **Database (Hybrid):**
    *   *Dev Mode:* IndexedDB (Browser Local Storage)
    *   *Prod Mode:* Google Cloud Firestore (NoSQL)

### **Key Modules**
1.  **Auth Layer (`services/api.ts`):** Handles JWT parsing, session management, and persistent user tracking.
2.  **XR Engine (`components/xr/`):**
    *   **Room.tsx:** The physics container, lighting, and environment logic.
    *   **SmartScreen.tsx:** A bridge component using `<Html transform>` to render React UI inside 3D space.
    *   **Furniture.tsx:** Procedural 3D assets using Three.js primitives and PBR materials.
3.  **State Management:** React Context-like pattern via `App.tsx` lifting state to top-level for Session/View control.

---

## 3. Functional Specification (User Journey)

### **A. Onboarding & Authentication**
*   **Flow:** User signs in via Google -> System checks DB.
*   **New Organization:** If email domain is new, launches **Onboarding Wizard**:
    1.  **Brand Identity:** Upload Logo, Hex Colors.
    2.  **Template Selection:** Boardroom, Studio, or Expo.
    3.  **Team Invite:** Add colleagues.
    4.  **Device Pairing:** Generate 6-digit VR code.

### **B. Workspace Management (2D Dashboard)**
*   **Dashboard:** High-level metrics (Active Sessions, Revenue).
*   **Assets:** Upload `.glb` models and `.png` textures. stored via Blob/Storage.
*   **Team:** Manage Roles (Owner/Admin/Viewer). Brand verification checks.
*   **Platform Admin:** "God Mode" view for SaaS owners to see global user audit logs and MRR.

### **C. The XR Experience (3D Mode)**
*   **Access:** Click "Enter 3D Space" on any Space card.
*   **Navigation:** Orbit Controls (Left Click Rotate, Right Click Pan, Scroll Zoom).
*   **Smart Screens:**
    *   **Dashboard Wall:** AI Chat Interface (Analyze/Ideate/Refine).
    *   **Docs Wall:** Interactive Spreadsheet with AI Formula generation.
    *   **Calendar Wall:** Read-only schedule view.
*   **Customization:** Room walls and lighting dynamically react to the Organization's `primaryColor`.

---

## 4. Google Cloud Integration Guide

To enable centralized cloud storage (so data persists across devices), you must connect a Firebase project.

### **Step-by-Step Configuration**
1.  Log in to [Firebase Console](https://console.firebase.google.com/).
2.  Create a project named **"GreenGalaxy"**.
3.  Navigate to **Firestore Database** and click **Create Database**.
    *   *Rules:* Start in **Test Mode** (allow read/write).
4.  Navigate to **Project Settings**.
5.  Scroll to **"Your Apps"** and select the **Web (</>)** icon.
6.  Register the app (no hosting needed).
7.  **COPY** the `firebaseConfig` object shown.
8.  **PASTE** it into `src/services/api.ts` replacing the `null` value.

**Code Location:**
```typescript
// services/api.ts
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "greengalaxy.firebaseapp.com",
  projectId: "greengalaxy",
  // ...
};
```

---

## 5. Deployment & Deep Links

*   **Deep Linking:** The platform generates custom protocol links:
    `greengalaxy://join?spaceId=s_123&sessionId=456&playerName=JohnDoe`
*   **Unity Integration:** These links are designed to be caught by a companion Unity Android App (using `DeepLinkManager.cs`) to launch the native VR experience.

---

## 6. Security & Brand Shield

*   **Domain Verification:** The platform checks the user's email domain against the Organization's allowed list.
*   **Brand Shield:** A subscription feature ($99/mo) that locks a domain (e.g., `@adidas.com`) so no other users can claim it.

