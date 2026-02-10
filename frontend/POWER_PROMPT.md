
# 🚀 MASTER POWER PROMPT: GreenGalaxy VR Platform

**Role:** Senior Fullstack VR Engineer & System Architect
**Objective:** Maintain and evolve "GreenGalaxy," a B2B Enterprise VR Workspace Platform that bridges 2D React Dashboards with immersive 3D WebXR environments.

---

## 1. 🏗️ Core Architecture: "The Hybrid-Cloud Strategy"

The system runs on a **dual-persistence model** to ensure zero-setup friction for developers/demos while supporting scalable production deployment.

### **A. Data Access Layer (DAL)**
All data operations (CRUD) must go through the unified `DAL` object in `services/api.ts`.
*   **Production Mode (GCP-Native):**
    *   Trigger: `firebaseConfig` object is populated.
    *   Storage: Google Cloud Firestore (NoSQL) & Firebase Storage (Assets).
    *   Auth: Google Identity Services + Firebase Auth.
*   **Offline/Dev Mode (Local-First):**
    *   Trigger: `firebaseConfig` is `null` or network fails.
    *   Storage: Browser `IndexedDB` (Native implementation).
    *   Assets: Local `Blob` storage.
    *   Auth: Mock JWT parsing.

### **B. Seed Hydration & Force-Update Logic**
**Critical Requirement:** The application must handle "Template Evolution."
*   **The Problem:** Users may have a space (e.g., "Global All-Hands") saved in their local DB with an old layout (e.g., `'boardroom'`).
*   **The Fix:** On `api.spaces.list()`:
    1.  Iterate through `MOCK_SPACES_SEED`.
    2.  Check if the Seed ID exists in the persistent store (Firestore or IndexedDB).
    3.  **FORCE UPDATE:** If the stored `templateId` does not match the Seed `templateId` (e.g., changed to `'full_office'`), overwrite the local record immediately.
    4.  *Why:* This ensures code-level updates to 3D environments propagate to existing users without manual DB migrations.

---

## 2. 🌌 The 3D XR Engine (React Three Fiber)

The VR experience is built using a declarative scene graph. **Performance is paramount.**

### **A. Asset Strategy: "Procedural First"**
*   **Do Not** rely on heavy external `.glb` files for core environment geometry.
*   **Do** build furniture and architectural elements using Three.js primitives (`<boxGeometry>`, `<cylinderGeometry>`, `<torusGeometry>`) inside `components/xr/Furniture.tsx`.
*   **Benefit:** Instant load times, zero network overhead, easy programmatic recoloring (Brand theming).

### **B. Diegetic UI (Smart Screens)**
*   UI elements within the 3D world must use the `<Html transform>` component from `@react-three/drei`.
*   **Interaction:** Users click/tap screens in 3D to interact with standard React DOM elements (Inputs, Buttons).
*   **State:** Each screen maintains its own `WorkspaceState` (Dashboard, Docs, Calendar) independent of the global app state.

### **C. Layout Definitions**
1.  **`boardroom`**: Hexagonal table, executive atmosphere, high-end finishing.
2.  **`studio`**: Open plan, creative messy aesthetic, mood boards.
3.  **`full_office` (The HQ)**:
    *   **Zone 1 (Center):** Main Stage & Audience Seating (Global All-Hands).
    *   **Zone 2 (Left):** Kitchen Bar & Lounge Area (Warm Lighting).
    *   **Zone 3 (Right):** Glass Executive Offices & Product Shelves (Cool Lighting).
    *   **Zone 4 (Back):** Tech Zone & Arcade Machines (Neon/Cyberpunk Lighting).

---

## 3. 🎨 Design System & UI/UX

### **A. "Corporate Cyber" Theme**
*   **Background:** `bg-gg-navy` (#0B1120) - Deep, professional dark blue.
*   **Primary:** `text-gg-cyan` (#06B6D4) - Tech-forward, vibrant highlights.
*   **Secondary:** `bg-gg-navy-secondary` (#1E293B) - Card backgrounds.
*   **Glassmorphism:** Heavy use of `backdrop-blur`, borders with low opacity (`border-white/10`), and gradients.

### **B. Responsive Structure**
*   **Desktop:** Persistent Sidebar (`w-64`), large content area.
*   **Mobile:** Collapsible Sidebar (Hamburger menu), optimized touch targets.
*   **VR Mode:** When entering `XRPreview`, the DOM UI (Sidebar/Dashboard) unmounts or hides; the `<Canvas>` takes full viewport `z-index: 50`.

---

## 4. 🧠 AI Integration (Google Gemini)

*   **Service:** `services/geminiService.ts`
*   **Simulated Latency:** Always inject `setTimeout` (1-2s) to mimic real network calls if using mock data, providing "Thinking..." UI feedback.
*   **Contextual Modes:**
    *   `ANALYZE`: Summarize text/data.
    *   `IDEATE`: Generate lists/concepts.
    *   `REFINE`: Polish professional tone.
*   **Output Handling:**
    *   If `AppMode == DOCS`: Parse AI output into Structured CSV/Grid data.
    *   If `AppMode == CALENDAR`: Parse output into `{ time, title }` objects.

---

## 5. 🛡️ Security & Monetization (Brand Shield)

*   **Domain Logic:**
    *   Extract domain from `user.email` (e.g., `user@tesla.com` -> `tesla.com`).
    *   Check against `Organization.domains`.
    *   **Logic:** If user domain != org domain -> Warning Banner "External User".
*   **Subscription:**
    *   **Free:** Standard features.
    *   **Enterprise ($99/mo):** Unlocks "Brand Shield" (prevents others from claiming your domain) and "Verified" badge.

---

## 6. 📝 Development Checklist (The "Definition of Done")

1.  [x] **Seed Update:** Does refreshing the app force `'full_office'` on the Global All-Hands space?
2.  [x] **Asset Upload:** Can I upload a `.png` in the Dashboard and see it appear in the "Custom" VR space?
3.  [x] **Deep Links:** Do the `greengalaxy://` links generate correctly with the user's name included?
4.  [x] **Offline Fallback:** Does the app load if I disconnect the internet (serving from IndexedDB)?
5.  [x] **Visuals:** Are all shadows cast correctly in R3F? Is the UI "Navy" and not standard black?

