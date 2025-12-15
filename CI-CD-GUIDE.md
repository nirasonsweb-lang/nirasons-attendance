# Complete CI/CD Pipeline Guide for Beginners
# Nirasons Attendance - Auto Deploy to Hostinger VPS

## What You'll Achieve

Push code to GitHub → Automatic deployment to your VPS → Live on attendance.nirasons.com

---

## Step 1: Setup GitHub Repository (5 minutes)

### 1.1 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `nirasons-attendance`
3. Set to **Private** (recommended)
4. Click "Create repository"

### 1.2 Push Your Code to GitHub

Open terminal in your project folder:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit - Production ready"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/nirasons-attendance.git

# Push to GitHub
git branch -M main
git push -u origin main
```

✅ Your code is now on GitHub!

---

## Step 2: Create Docker Setup (10 minutes)

We'll containerize your app with Docker for easy deployment.

### 2.1 Create Dockerfile

Already created as `Dockerfile` in your project root.

### 2.2 Create docker-compose.yml

Already created as `docker-compose.prod.yml` in your project root.

### 2.3 Create .dockerignore

Already created in your project root.

---

## Step 3: Setup GitHub Actions CI/CD (15 minutes)

This will automatically deploy when you push to GitHub.

### 3.1 Create GitHub Actions Workflow

Already created as `.github/workflows/deploy.yml`

### 3.2 Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these secrets one by one:

| Secret Name | Value | Where to get it |
|------------|--------|-----------------|
| `VPS_HOST` | Your VPS IP address | Hostinger panel |
| `VPS_USERNAME` | Usually `root` or your SSH user | Hostinger panel |
| `VPS_SSH_KEY` | Your private SSH key | Generate in Step 4 |
| `DATABASE_URL` | `postgresql://nirasons_user:YOUR_DB_PASS@localhost:5432/nirasons_attendance` | Your production DB |
| `JWT_SECRET` | Generate with: `openssl rand -base64 32` | Run command |
| `DOCKER_USERNAME` | Your Docker Hub username | https://hub.docker.com |
| `DOCKER_PASSWORD` | Your Docker Hub password/token | Docker Hub settings |

---

## Step 4: Setup VPS for Auto-Deployment (20 minutes)

### 4.1 Generate SSH Key Pair

On your **local computer** (not VPS):

```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/nirasons_vps -C "deploy@nirasons"

# Press Enter for no passphrase (for automation)

# View public key (add to VPS)
cat ~/.ssh/nirasons_vps.pub
```

Copy the **public key** output.

### 4.2 Add SSH Key to VPS

**Login to Hostinger VPS:**

```bash
ssh root@YOUR_VPS_IP
```

**On VPS, run:**

```bash
# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh

# Add your public key
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Exit VPS
exit
```

### 4.3 Add Private Key to GitHub

**On your local computer:**

```bash
# View private key
cat ~/.ssh/nirasons_vps
```

Copy the ENTIRE output (including `-----BEGIN` and `-----END` lines).

Go to GitHub → Settings → Secrets → Add `VPS_SSH_KEY` with this private key.

### 4.4 Install Docker on VPS

**SSH back to VPS:**

```bash
ssh root@YOUR_VPS_IP
```

**Install Docker:**

```bash
# Update packages
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version

# Enable Docker to start on boot
systemctl enable docker
```

### 4.5 Create Deployment Directory

On VPS:

```bash
# Create app directory
mkdir -p /var/www/nirasons-attendance
cd /var/www/nirasons-attendance

# Create environment file
nano .env.production
```

**Paste this and edit with your values:**

```env
DATABASE_URL="postgresql://nirasons_user:YOUR_DB_PASSWORD@localhost:5432/nirasons_attendance"
JWT_SECRET="YOUR_GENERATED_SECRET_HERE"
NEXT_PUBLIC_APP_URL="https://attendance.nirasons.com"
NODE_ENV="production"
```

Save: `Ctrl+X`, `Y`, `Enter`

---

## Step 5: Setup Database on VPS (10 minutes)

**On VPS:**

```bash
# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE nirasons_attendance;
CREATE USER nirasons_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE nirasons_attendance TO nirasons_user;
ALTER DATABASE nirasons_attendance OWNER TO nirasons_user;
\q

# Exit postgres
exit
```

---

## Step 6: Setup Nginx & Domain (15 minutes)

### 6.1 Install Nginx

```bash
apt install nginx -y
systemctl start nginx
systemctl enable nginx
```

### 6.2 Configure Domain

Create Nginx config:

```bash
nano /etc/nginx/sites-available/attendance.nirasons.com
```

**Paste this:**

```nginx
server {
    listen 80;
    server_name attendance.nirasons.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

**Enable site:**

```bash
ln -s /etc/nginx/sites-available/attendance.nirasons.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 6.3 Setup SSL (HTTPS)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d attendance.nirasons.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Redirect HTTP to HTTPS: Yes
```

---

## Step 7: First Deployment (Manual)

Before automation works, do first deployment manually:

### 7.1 Initial App Deployment

**On VPS:**

```bash
cd /var/www/nirasons-attendance

# Clone your repository (replace YOUR_USERNAME)
git clone https://github.com/YOUR_USERNAME/nirasons-attendance.git app

cd app

# Copy environment file
cp ../.env.production .env

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (creates admin)
npm run db:seed:production

# Build application
npm run build

# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "nirasons-attendance" -- start

# Save PM2 list
pm2 save

# Setup PM2 startup
pm2 startup
# Copy and run the command it shows

# Check status
pm2 status
```

✅ Visit `https://attendance.nirasons.com` - Your app should be live!

---

## Step 8: Test Auto-Deployment

Now test the CI/CD pipeline:

### 8.1 Make a Change

On your local computer:

```bash
# Make a small change (e.g., edit README.md)
echo "# Auto-deployed!" >> README.md

# Commit and push
git add .
git commit -m "Test auto-deployment"
git push origin main
```

### 8.2 Watch Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. You'll see the deployment running
4. Wait for it to complete (green checkmark)

✅ Your changes are now live automatically!

---

## How Auto-Deployment Works

```
You push to GitHub
    ↓
GitHub Actions triggers
    ↓
Runs tests & builds Docker image
    ↓
Pushes to Docker Hub
    ↓
SSH to your VPS
    ↓
Pulls new image
    ↓
Restarts containers
    ↓
✅ Live on attendance.nirasons.com
```

---

## Daily Workflow (After Setup)

```bash
# Make changes to your code
# Edit files...

# Commit and push
git add .
git commit -m "Added new feature"
git push origin main

# ✨ Auto-deploys in ~5 minutes!
```

---

## Monitoring & Troubleshooting

### Check App Logs

```bash
ssh root@YOUR_VPS_IP
pm2 logs nirasons-attendance
```

### Check Nginx Logs

```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Restart App Manually

```bash
pm2 restart nirasons-attendance
```

### Check GitHub Actions

Go to: `https://github.com/YOUR_USERNAME/nirasons-attendance/actions`

---

## Summary Checklist

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] GitHub Secrets added (all 7)
- [ ] SSH keys generated and configured
- [ ] Docker installed on VPS
- [ ] Database setup on VPS
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] First manual deployment successful
- [ ] Auto-deployment tested

---

## Support

If deployment fails:
1. Check GitHub Actions logs
2. Check `pm2 logs nirasons-attendance`
3. Check Nginx logs
4. Verify all GitHub secrets are correct

---

**You're done!** 🎉 Now you have professional auto-deployment!
