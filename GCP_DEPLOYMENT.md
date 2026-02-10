# ☁️ GreenGalaxy Google Cloud & Firebase Deployment Guide

This guide outlines the enterprise-grade deployment strategy using Google Cloud Platform (GCP) and Firebase.

## 🏗️ Architecture Overview

1.  **Frontend**: Firebase Hosting (CDN, HTTPS, Integrated Auth)
2.  **API Backend**: Google Cloud Run (Serverless FastAPI)
3.  **Multiplayer**: Google Cloud Run (Serverless Colyseus with Session Affinity)
4.  **Database/Auth**: Firebase (Firestore, Auth, Storage)

---

## 🛰️ Phase 1: Deploy API Backend (Cloud Run)

1.  **Build and Push**:
    ```bash
    cd backend
    gcloud builds submit --tag gcr.io/greengalaxyvr-3c624/backend-api
    ```
2.  **Deploy**:
    ```bash
    gcloud run deploy backend-api \
      --image gcr.io/greengalaxyvr-3c624/backend-api \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars="ALLOW_UNVERIFIED_AUTH=false"
    ```
3.  **Note the URL**: It will look like `https://backend-api-xyz-uc.a.run.app`.

---

## 🎮 Phase 2: Deploy Multiplayer Server (Cloud Run)

Colyseus requires **Session Affinity** to maintain WebSocket connections to the same instance.

1.  **Build and Push**:
    ```bash
    cd MVP/server
    gcloud builds submit --tag gcr.io/greengalaxyvr-3c624/colyseus-server
    ```
2.  **Deploy with Session Affinity**:
    ```bash
    gcloud run deploy colyseus-server \
      --image gcr.io/greengalaxyvr-3c624/colyseus-server \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --session-affinity
    ```
3.  **Note the URL**: Change `https://` to `wss://` for your frontend config.

---

## 🎨 Phase 3: Deploy Frontend (Firebase Hosting)

1.  **Initialize Firebase** (if not done):
    ```bash
    cd frontend
    firebase init hosting
    ```
2.  **Configure Environment**:
    Update `frontend/.env.production` with your new Cloud Run URLs:
    ```env
    VITE_API_URL=https://backend-api-xyz-uc.a.run.app
    VITE_COLYSEUS_URL=wss://colyseus-server-xyz-uc.a.run.app
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_PROJECT_ID=greengalaxyvr-3c624
    ```
3.  **Build and Deploy**:
    ```bash
    npm run build
    firebase deploy --only hosting
    ```

---

## 🛡️ Security Posture

*   **CORS**: Update `backend/app/main.py` with your Firebase Hosting URL to allow requests.
*   **Service Accounts**: Ensure the `backend-api` has a service account with `Firebase Admin` permissions.
*   **WAF**: Consider enabling **Google Cloud Armor** for the API to prevent DDoS.
*   **Secrets**: Move Firebase keys from `.env` to **GCP Secret Manager** for production.

---

## 📊 Monitoring

*   **Logs**: Use `gcloud logging read` or the GCP Console to view logs from both services.
*   **Costs**: All services listed above scale to zero when not in use, keeping costs minimal for initial deployment.
