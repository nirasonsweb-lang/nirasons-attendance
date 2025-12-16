# Manual VPS Deployment Guide
## Deploy Nirasons Attendance to attendance.nirasons.com

Simple step-by-step guide to deploy your app to Hostinger VPS.

---

## Prerequisites

- Hostinger VPS with SSH access
- Domain: attendance.nirasons.com pointing to your VPS IP
- Your local code is production-ready (npm run build works)

---

## Part 1: Server Setup (One-Time)

### Step 1: Connect to VPS

```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Update System

```bash
apt update && apt upgrade -y
```

### Step 3: Install Node.js

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify
node --version  # Should show v18.x
npm --version
```

### Step 4: Install PostgreSQL

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start service
systemctl start postgresql
systemctl enable postgresql
```

### Step 5: Install Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### Step 6: Install PM2 (Process Manager)

```bash
npm install -g pm2
```

---

## Part 2: Database Setup

### Step 1: Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL, run these commands:
CREATE DATABASE nirasons_attendance;
CREATE USER nirasons_user WITH ENCRYPTED PASSWORD 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE nirasons_attendance TO nirasons_user;
ALTER DATABASE nirasons_attendance OWNER TO nirasons_user;

# Grant schema permissions
\c nirasons_attendance
GRANT ALL ON SCHEMA public TO nirasons_user;

# Exit
\q
```

**⚠️ Important**: Save your database password somewhere safe!

---

## Part 3: Deploy Application

### Step 1: Upload Your Code

**On your LOCAL computer**, zip your project:

```bash
# In your project folder
npm run build  # Make sure build works

# Create a zip (excluding node_modules)
# On Windows PowerShell:
Compress-Archive -Path * -DestinationPath nirasons-app.zip -Exclude node_modules,.next,.git
```

**Transfer to VPS** (choose one method):

**Method A - Using SCP:**
```bash
scp nirasons-app.zip root@YOUR_VPS_IP:/root/
```

**Method B - Using FileZilla/WinSCP:**
1. Download WinSCP: https://winscp.net
2. Connect to your VPS
3. Upload `nirasons-app.zip` to `/root/`

**Method C - Using Git:**
```bash
# On VPS
cd /var/www
git clone YOUR_GITHUB_REPO_URL nirasons-attendance
```

### Step 2: Extract and Setup

**On VPS:**

```bash
# Create app directory
mkdir -p /var/www/nirasons-attendance
cd /var/www/nirasons-attendance

# Extract (if using zip)
unzip /root/nirasons-app.zip

# Or if using git, you're already here
```

### Step 3: Configure Environment

```bash
# Create .env file
nano .env
```

**Paste this (update with your values):**

```env
# Database - Use the password you set earlier
DATABASE_URL="postgresql://nirasons_user:YourStrongPassword123!@localhost:5432/nirasons_attendance?schema=public"

# JWT Secret - Generate with: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"

# Domain
NEXT_PUBLIC_APP_URL="https://attendance.nirasons.com"

# Environment
NODE_ENV="production"
```

**Save**: Press `Ctrl+X`, then `Y`, then `Enter`

### Step 4: Install and Build

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Create admin account
npm run db:seed:production

# Build application
npm run build
```

### Step 5: Start Application

```bash
# Start with PM2
pm2 start npm --name "nirasons-attendance" -- start

# Save PM2 configuration
pm2 save

# Make PM2 start on server reboot
pm2 startup
# Copy and run the command it shows

# Check status
pm2 status
```

✅ Your app is now running on port 3000!

---

## Part 4: Setup Nginx & Domain

### Step 1: Configure Nginx

```bash
# Create nginx config
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

**Save and enable:**

```bash
# Enable site
ln -s /etc/nginx/sites-available/attendance.nirasons.com /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

### Step 2: Setup SSL (HTTPS)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d attendance.nirasons.com

# Follow the prompts:
# 1. Enter your email
# 2. Agree to terms (Y)
# 3. Redirect HTTP to HTTPS: Yes (2)
```

---

## ✅ Your App is Live!

Visit: **https://attendance.nirasons.com**

**Login with:**
- Email: `nirasons.web@gmail.com`
- Password: `Nirasons@8269577642`

---

## Part 5: When You Need to Update

When you make changes to your code:

### Method 1: Upload New Files

```bash
# On local: Build and zip
npm run build
Compress-Archive -Path * -DestinationPath update.zip -Exclude node_modules,.next,.git

# Upload to VPS
scp update.zip root@YOUR_VPS_IP:/root/

# On VPS: Extract and restart
cd /var/www/nirasons-attendance
unzip -o /root/update.zip
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart nirasons-attendance
```

### Method 2: Using Git

```bash
# On VPS
cd /var/www/nirasons-attendance
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart nirasons-attendance
```

---

## Common Commands

### Check App Status
```bash
pm2 status
pm2 logs nirasons-attendance
```

### Restart App
```bash
pm2 restart nirasons-attendance
```

### Stop App
```bash
pm2 stop nirasons-attendance
```

### Start App
```bash
pm2 start nirasons-attendance
```

### View Logs
```bash
# App logs
pm2 logs nirasons-attendance

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Database Backup
```bash
# Create backup
pg_dump -U nirasons_user nirasons_attendance > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U nirasons_user nirasons_attendance < backup_20241215.sql
```

---

## Troubleshooting

### App won't start
```bash
# Check logs
pm2 logs nirasons-attendance

# Check if port 3000 is already in use
netstat -tlnp | grep 3000

# Restart
pm2 delete nirasons-attendance
pm2 start npm --name "nirasons-attendance" -- start
```

### Can't access website
```bash
# Check nginx
nginx -t
systemctl status nginx

# Check if app is running
pm2 status

# Check firewall
ufw status
```

### Database connection error
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test database connection
psql -U nirasons_user -d nirasons_attendance -h localhost

# Check .env file has correct credentials
cat /var/www/nirasons-attendance/.env
```

---

## Security Checklist

- [x] HTTPS enabled (SSL certificate)
- [x] Strong database password
- [x] Strong JWT secret (32+ characters)
- [x] Firewall configured (only ports 22, 80, 443 open)
- [x] Regular backups scheduled
- [x] Server packages updated

---

## That's It!

Your app is deployed and running on **attendance.nirasons.com**! 🎉

For support, check the logs and troubleshooting section above.
