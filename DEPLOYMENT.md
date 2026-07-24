# AeroDrop P2P — Deployment Guide (Vercel + AWS RDS PostgreSQL)

This guide walks you through deploying **AeroDrop P2P File Transfer** using **Vercel** for the React frontend, **AWS RDS PostgreSQL** for the database, and an AWS / Cloud service for the Socket.IO signaling server.

---

## 1. Setting up AWS RDS PostgreSQL Database

1. Open the [AWS Management Console](https://console.aws.amazon.com/rds/) and navigate to **RDS**.
2. Click **Create Database**.
3. Choose **Standard create** → **PostgreSQL**.
4. Select template **Free tier** (or Dev/Test).
5. Configure DB Settings:
   - **DB instance identifier**: `aerodrop-rds`
   - **Master username**: `postgres`
   - **Master password**: *Choose a strong password*
6. Connectivity settings:
   - **Publicly accessible**: Set to **Yes** (if connecting directly from Vercel/external server) or use VPC peering/security groups.
   - **VPC Security Group**: Create a new security group allowing inbound traffic on port `5432`.
7. Click **Create database**.
8. Once created, copy the **Endpoint URL** (e.g. `aerodrop-rds.c123456789.us-east-1.rds.amazonaws.com`).
9. Construct your `DATABASE_URL`:
   ```env
   DATABASE_URL="postgres://postgres:YOUR_PASSWORD@aerodrop-rds.c123456789.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=require"
   ```

---

## 2. Deploying the Node.js Socket.IO Signaling Server

> **Note**: Because Socket.IO requires persistent WebSocket connections, the signaling server must run on a server environment like **AWS App Runner**, **AWS EC2**, **Railway**, or **Render**.

### Option A: Deploy to AWS App Runner / EC2 / Railway / Render
1. Push your project code to a GitHub repository.
2. In Railway, Render, or AWS App Runner, select the `server/` directory.
3. Set the Environment Variables in your server dashboard:
   - `DATABASE_URL`: Your AWS RDS PostgreSQL connection string.
   - `PORT`: `3001` (or default assigned by host).
4. Once deployed, note down your live server URL (e.g. `https://aerodrop-signaling.onrender.com` or `https://xyz.apprunner.aws`).

---

## 3. Deploying Frontend to Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository containing the `client/` folder.
4. Configure Project Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - `VITE_SIGNALING_URL`: `https://your-deployed-signaling-server-url.com`
6. Click **Deploy**.

Vercel will build and deploy your React frontend with direct WebRTC P2P file transfer enabled worldwide!

---

## Database Schema Auto-Created in AWS RDS

When your signaling server starts up and connects to AWS RDS, it automatically creates the following PostgreSQL tables:

```sql
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS transfer_logs (
  id SERIAL PRIMARY KEY,
  file_id VARCHAR(100) NOT NULL,
  room_code VARCHAR(10) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  file_type VARCHAR(100),
  sender_alias VARCHAR(100),
  receiver_alias VARCHAR(100),
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
