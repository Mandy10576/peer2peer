# How to Fix "HTTPS (Vercel) to HTTP (AWS EC2)" Mixed Content Error

When your frontend is hosted on **Vercel** (`https://your-app.vercel.app`), modern browsers enforce strict security rules:
- **HTTPS sites CANNOT request HTTP or unencrypted WS (WebSockets)**.
- If Vercel tries to call `http://ec2-ip:3001` or `ws://ec2-ip:3001`, the browser blocks it with a **Mixed Content Error**.

Here are the **3 easiest solutions** to fix this permanently:

---

## Solution 1: Free SSL via Cloudflare (Recommended — Fast & Free)

If you own any custom domain (e.g., `yourdomain.com`):

1. Go to **Cloudflare** (Free Plan) and add your domain.
2. Go to **DNS Settings** and add an **A Record**:
   - **Name**: `api` (or `signaling`)
   - **IPv4 Address**: *Your AWS EC2 Public IP address* (e.g. `54.210.xx.xx`)
   - **Proxy status**: **Proxied (Orange Cloud 🧡)**
3. Go to **SSL/TLS Settings** in Cloudflare → Select **Flexible** or **Full**.
4. Now your EC2 server is accessible over secure HTTPS at:
   `https://api.yourdomain.com` (Cloudflare handles the SSL cert automatically!).
5. In **Vercel Settings** → **Environment Variables**, set:
   ```env
   VITE_SIGNALING_URL=https://api.yourdomain.com
   ```

---

## Solution 2: Automated Free SSL on EC2 using Caddy (Takes 2 Minutes)

If you want SSL directly on your EC2 instance without a load balancer:

1. Point your domain (e.g., `api.yourdomain.com`) to your EC2 IP address in your DNS provider.
2. SSH into your EC2 instance and install **Caddy** (a modern web server with auto-SSL):
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update
   sudo apt install caddy
   ```
3. Edit Caddy config: `sudo nano /etc/caddy/Caddyfile` and paste:
   ```caddy
   api.yourdomain.com {
       reverse_proxy localhost:3001
   }
   ```
4. Restart Caddy: `sudo systemctl restart caddy`.
5. Caddy automatically requests and installs a free Let's Encrypt SSL certificate! Your Socket.IO server is now securely live at `https://api.yourdomain.com`.

---

## Solution 3: Use AWS App Runner instead of raw EC2 (Easiest Managed AWS Solution)

Instead of manually setting up EC2 and NGINX/Certbot:

1. Go to **AWS App Runner** in the AWS Console.
2. Select **Source code repository** (your GitHub repo `server/` directory).
3. Set Port to `3001`.
4. AWS App Runner automatically provisions an **HTTPS domain with SSL built-in** (e.g. `https://xyz.us-east-1.awsapprunner.com`).
5. Copy that URL directly into Vercel's `VITE_SIGNALING_URL`!

---

## Summary Checklist for Vercel + EC2

| Environment | Vercel Frontend URL | EC2 Server Endpoint | Result |
| :--- | :--- | :--- | :--- |
| ❌ Broken | `https://your-app.vercel.app` | `http://54.210.xx.xx:3001` | 🔴 Blocked by Browser (Mixed Content) |
| ✅ Fixed | `https://your-app.vercel.app` | `https://api.yourdomain.com` | 🟢 Secure (WSS & HTTPS Connected) |
