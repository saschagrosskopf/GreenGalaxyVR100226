
# GreenGalaxy VR Platform - Product Requirements Document (PRD)

## 1. Executive Summary
GreenGalaxy is an enterprise B2B SaaS platform that enables organizations to deploy, manage, and customize immersive Virtual Reality (VR) workspaces. It bridges the gap between traditional web-based administration (React SPA) and immersive 3D experiences (WebXR), providing tools for collaboration, asset management, and AI-assisted productivity via Google Gemini.

## 2. System Architecture & Core Logic

### 2.1 Hybrid Architecture (GCP-Native + Offline First)
The application utilizes a unique **Hybrid Persistence Layer** to support both rapid local development/offline usage and scalable cloud production.

*   **Logic Hub (`services/api.ts`):**
    *   **Data Access Layer (DAL):** A unified interface that abstracts database operations.
    *   **Strategy Pattern:**
        *   *If `firebaseConfig` is present:* Connects to **Google Cloud Firestore** (NoSQL) and **Cloud Storage** (Blobs).
        *   *If `firebaseConfig` is missing/offline:* Fallback to **IndexedDB** (Browser Storage) to ensure the app works immediately without backend setup.
    *   **Seed Hydration:** On app load, the system checks `spaces.list()`. If critical seed templates (e.g., `'full_office'`) are updated in code, the logic forces a database update to ensure existing users receive the latest 3D layouts.

### 2.2 3D XR Engine (`components/xr/`)
The immersive view is built on **React Three Fiber (R3F)**, creating a declarative scene graph that bridges React state with Three.js rendering.

*   **Scene Composition:**
    *   **`Room.tsx`:** The root container. It manages the environment (skybox, stars, floor grid) and switches between layouts (`Boardroom`, `Studio`, `FullOffice`) based on the `templateId`.
    *   **`Furniture.tsx`:** Contains procedural 3D assets constructed from primitives (Box, Cylinder, Torus) to minimize external asset dependencies and loading times.
    *   **`SmartScreen.tsx` (Diegetic UI):** Uses the `<Html transform>` component to render interactive React DOM elements *inside* the 3D scene. This allows standard HTML forms, inputs, and text rendering to exist on "screens" within the VR world.

### 2.3 AI Integration Logic
*   **Service:** `services/geminiService.ts`
*   **Flow:**
    1.  User inputs text into a Smart Screen (e.g., "Analyze Q4 data").
    2.  System determines `AppMode` (Dashboard, Docs, Mail).
    3.  Request is sent to the AI service (simulated or real Gemini API).
    4.  Response is parsed:
        *   *Text:* Displayed in the UI.
        *   *Structured Data:* Parsed into CSV/Grid formats for the "Docs" spreadsheet view.

---

## 3. User Personas

1.  **Organization Owner:**
    *   Sets up the company brand (Logo, Colors).
    *   Invites team members.
    *   Manages subscription and billing.
2.  **Team Member:**
    *   Views scheduled meetings.
    *   Enters VR spaces for collaboration.
    *   Uploads 3D assets for review.
3.  **Platform Admin (Superuser):**
    *   Views global user base.
    *   Verifies/Rejects brand domains.
    *   Monitors MRR (Monthly Recurring Revenue).

---

## 4. Functional Requirements

### 4.1 Authentication & Onboarding
*   **Google Sign-In:** Users authenticate via OAuth 2.0.
*   **Onboarding Wizard:**
    *   If a user's email domain is new, trigger a 4-step wizard.
    *   Collect: Organization Name, Brand Colors, Team Invites.
    *   **Device Pairing:** Generate a 6-digit code to link a physical VR headset to the account.

### 4.2 2D Dashboard (Web Interface)
*   **Sidebar Navigation:** Persistent access to all modules.
*   **Asset Manager:**
    *   Support upload of `.glb`, `.gltf`, `.png`, `.jpg`.
    *   **Logic:** If Cloud is active, upload to Firebase Storage and store download URL. If Offline, store File Blob in IndexedDB.
*   **Spaces Manager:**
    *   Create/Edit/Delete VR spaces.
    *   **Deep Linking:** Generate `greengalaxy://` custom protocol links for native Unity app handoff.

### 4.3 3D Workspace (WebXR)
*   **Layouts:**
    *   *Boardroom:* Central table, hexagonal layout, executive screens.
    *   *Studio:* Open floor plan, creative mood boards.
    *   *Full HQ Office:* Complex multi-zone environment (Stage, Kitchen, Offices, Arcade).
*   **Customization:**
    *   Walls and accent lights must dynamically match the Organization's `primaryColor`.
    *   Logo must appear on the back wall if uploaded.
*   **Interactivity:**
    *   User can rotate/pan camera (OrbitControls).
    *   User can type into virtual screens.

### 4.4 Brand Shield & Monetization
*   **Domain Locking:** Users can pay ($99/mo) to "Claim" their email domain.
*   **Enforcement:**
    *   Unverified users get a warning banner.
    *   If a user tries to join with a locked domain (e.g., `@stark.com`) and is not in that Org, they are blocked or flagged.

---

## 5. Non-Functional Requirements
*   **Performance:** 3D Scene must load < 2 seconds. Furniture is procedural to reduce network payload.
*   **Responsiveness:** Dashboard must work on Mobile and Desktop. 3D view is optimized for Desktop/VR capability.
*   **Persistence:** User session and settings must persist on page reload.

