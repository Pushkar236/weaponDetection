# 🚀 CCTV Weapon Detection Dashboard - Production Deployment Guide

## 📋 Overview

This guide covers deploying your CCTV Dashboard to production with httpsS support for camera access and proper RTSP server configuration.

## ⚠️ **Important: httpsS Requirement**

**Camera access (getUserMedia API) requires httpsS in production.** Local development works on `localhost`, but production deployment needs SSL certificates.

## 🌐 **Deployment Options**

### Option 1: Vercel + External Servers (Recommended)

#### Step 1: Prepare Frontend for Vercel

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Update Next.js Configuration**
   ```bash
   # In your project root
   npm install
   npm run build  # Test build locally
   ```

#### Step 2: Set Up External Servers

Since Vercel is serverless, you need separate servers for RTSP/WebRTC:

**Option A: DigitalOcean Droplet ($6/month)**

```bash
# 1. Create Ubuntu droplet
# 2. Install Node.js and FFmpeg
sudo apt update
sudo apt install nodejs npm ffmpeg

# 3. Clone your servers
git clone <your-repo>
cd cctv-dashboard

# 4. Install dependencies
cd rtsp-server && npm install
cd ../webrtc-server && npm install

# 5. Install PM2 for process management
sudo npm install -g pm2

# 6. Start servers with PM2
pm2 start rtsp-server/server.js --name "rtsp-server"
pm2 start webrtc-server/server.js --name "webrtc-server"
pm2 startup
pm2 save
```

**Option B: Railway.app (Alternative)**

```bash
# Deploy each server separately on Railway
# 1. Create two Railway projects
# 2. Deploy rtsp-server to first project
# 3. Deploy webrtc-server to second project
```

#### Step 3: Update Frontend Configuration

Create `next.config.ts` for production:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    RTSP_SERVER_URL:
      process.env.NODE_ENV === "production"
        ? "httpss://your-rtsp-server.com"
        : "https://localhost:3002",
    WEBRTC_SERVER_URL:
      process.env.NODE_ENV === "production"
        ? "httpss://your-webrtc-server.com"
        : "https://localhost:3003",
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob:;
              media-src 'self' blob: httpss: wss:;
              connect-src 'self' httpss: wss: ${
                process.env.WEBRTC_SERVER_URL || ""
              };
            `
              .replace(/\\s+/g, " ")
              .trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

#### Step 4: Deploy to Vercel

```bash
# In your project root
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your username)
# - Link to existing project? N
# - Project name: cctv-weapon-detection
# - Directory: ./
# - Override settings? N

# Add environment variables in Vercel dashboard:
# - RTSP_SERVER_URL: httpss://your-droplet-ip:3002
# - WEBRTC_SERVER_URL: httpss://your-droplet-ip:3003
```

### Option 2: Full VPS Deployment

#### Step 1: Set Up VPS with SSL

**DigitalOcean/Linode/AWS Setup:**

```bash
# 1. Create Ubuntu 22.04 server
# 2. Point your domain to server IP
# 3. Install dependencies
sudo apt update
sudo apt install nodejs npm nginx ffmpeg certbot python3-certbot-nginx

# 4. Clone and setup project
git clone <your-repo>
cd cctv-dashboard
npm install
npm run build

# 5. Install PM2
sudo npm install -g pm2

# 6. Start all services
pm2 start npm --name "nextjs" -- start
pm2 start rtsp-server/server.js --name "rtsp-server"
pm2 start webrtc-server/server.js --name "webrtc-server"

# 7. Configure Nginx
sudo nano /etc/nginx/sites-available/cctv-dashboard
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 httpss://$server_name$request_uri;
}

server {
    listen 443 ssl https2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Main app
    location / {
        proxy_pass https://localhost:3000;
        proxy_https_version 1.1;
        proxy_set_header Upgrade $https_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $https_upgrade;
    }

    # RTSP Server
    location /rtsp-api/ {
        proxy_pass https://localhost:3002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebRTC Server
    location /webrtc-api/ {
        proxy_pass https://localhost:3003/;
        proxy_https_version 1.1;
        proxy_set_header Upgrade $https_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# 8. Enable site and get SSL
sudo ln -s /etc/nginx/sites-available/cctv-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.com

# 9. Setup PM2 startup
pm2 startup
pm2 save
```

## 🔧 **Local httpsS Development**

For local development with camera access:

```bash
# Install mkcert for local SSL
npm install -g mkcert
mkcert -install
mkcert localhost 127.0.0.1

# Update package.json
{
  "scripts": {
    "dev": "next dev",
    "dev:httpss": "next dev --experimental-httpss --experimental-httpss-key ./localhost-key.pem --experimental-httpss-cert ./localhost.pem"
  }
}

# Run with httpsS
npm run dev:httpss
# Access at httpss://localhost:3000
```

## 📱 **Testing Camera Access**

After deployment with httpsS:

1. **Desktop Browsers**: Should work automatically
2. **Mobile Browsers**: May need additional permissions
3. **Chrome**: Requires user gesture (click to start)
4. **Safari**: May need additional webkit prefixes

## 🔒 **Security Considerations**

1. **CORS Configuration**: Update server CORS for production domain
2. **CSP Headers**: Configure Content Security Policy
3. **Environment Variables**: Never commit secrets
4. **RTSP Security**: Consider VPN or authentication for camera streams

## 🚨 **Troubleshooting**

### Camera Issues:

- ✅ **httpsS Required**: Ensure site is served over httpsS
- ✅ **Permissions**: Browser must allow camera access
- ✅ **User Gesture**: Camera access needs user interaction

### RTSP Issues:

- ✅ **Firewall**: Ensure ports 3002, 3003 are open
- ✅ **CORS**: Configure server CORS for your domain
- ✅ **Network**: Verify RTSP server is reachable

### Deployment Issues:

- ✅ **Build**: Test `npm run build` locally first
- ✅ **Environment**: Set all environment variables
- ✅ **Domains**: Ensure DNS is properly configured

## 📊 **Production Checklist**

- [ ] httpsS certificate installed and working
- [ ] Camera permissions working on httpsS
- [ ] RTSP server deployed and accessible
- [ ] WebRTC server deployed and accessible
- [ ] Environment variables configured
- [ ] CORS properly configured
- [ ] CSP headers allowing necessary resources
- [ ] PM2 or similar process manager running
- [ ] Nginx or reverse proxy configured
- [ ] Firewall rules allowing necessary ports
- [ ] Domain DNS pointing to server
- [ ] SSL certificates auto-renewal setup

## 🎯 **Quick Production Test**

```bash
# After deployment, test these URLs:
httpss://your-domain.com                    # Main dashboard
httpss://your-domain.com/webrtc            # WebRTC mode
httpss://your-domain.com/test              # Test page
httpss://your-domain.com/rtsp-api/health   # RTSP server health
httpss://your-domain.com/webrtc-api/health # WebRTC server health
```

---

**📅 Updated**: September 24, 2025  
**🔧 Status**: Production deployment ready with httpsS support  
**📋 Note**: httpsS is mandatory for camera access in production
