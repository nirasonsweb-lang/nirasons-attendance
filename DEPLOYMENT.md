# Nirasons Attendance Management - Deployment Guide

## 🚀 Production Deployment to attendance.nirasons.com

This guide walks you through deploying the Nirasons Attendance Management System to your VPS server.

---

## Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04 LTS or later
- **RAM**: Minimum 2GB
- **Storage**: Minimum 10GB
- **Node.js**: Version 18.x or later
- **PostgreSQL**: Version 14.x or later
- **Nginx**: Latest stable version
- **Domain**: attendance.nirasons.com pointing to your server IP

### Local Requirements
- SSH access to your server
- Git repository access

---

## Part 1: Server Setup

## 1.1 Initial Server Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git nginx certbot python3-certbot-nginx
```

### 1.2 Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version
```

### 1.3 Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

---

## Part 2: Database Setup

### 2.1 Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL prompt, run:
CREATE DATABASE nirasons_attendance;
CREATE USER nirasons_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE nirasons_attendance TO nirasons_user;
ALTER DATABASE nirasons_attendance OWNER TO nirasons_user;

# Grant schema permissions
\c nirasons_attendance
GRANT ALL ON SCHEMA public TO nirasons_user;

# Exit PostgreSQL
\q
```

**🔒 Security Note**: Replace `YOUR_SECURE_PASSWORD_HERE` with a strong password. Save this password securely.

### 2.2 Configure PostgreSQL for Local Access

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add this line after the existing local connections:
local   nirasons_attendance   nirasons_user                     md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Part 3: Application Deployment

### 3.1 Create Application User

```bash
# Create dedicated user for the application  
sudo adduser --disabled-password --gecos "" nirasons

# Switch to the user
sudo su - nirasons
```

### 3.2 Clone and Setup Application

```bash
# Clone repository (replace with your repo URL)
git clone https://github.com/yourusername/nirasons-attendance.git
cd nirasons-attendance

# Install dependencies
npm install

# Copy and configure environment
cp .env.production.template .env
nano .env
```

**Configure `.env` file:**
```env
DATABASE_URL="postgresql://nirasons_user:YOUR_SECURE_PASSWORD@localhost:5432/nirasons_attendance?schema=public"
JWT_SECRET="GENERATE_STRONG_SECRET_WITH: openssl rand -base64 32"
NEXT_PUBLIC_APP_URL="https://attendance.nirasons.com"
NODE_ENV="production"
```

### 3.3 Database Migration and Seeding

```bash
# Run database migrations
npx prisma migrate deploy

# Run production seed (creates admin user)
npm run db:seed:production

# Follow the interactive prompts to create your admin account
```

### 3.4 Build Application

```bash
# Build for production
npm run build

# Test production build locally
npm start

# If successful, stop with Ctrl+C
```

### 3.5 Setup PM2 Process Manager

```bash
# Exit from nirasons user
exit

# Install PM2 globally
sudo npm install -g pm2

# Switch back to nirasons user
sudo su - nirasons
cd nirasons-attendance

# Start application with PM2
pm2 start npm --name "nirasons-attendance" -- start

# Save PM2 configuration
pm2 save

# Exit nirasons user
exit

# Setup PM2 to start on system boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u nirasons --hp /home/nirasons
```

---

## Part 4: Nginx Configuration

### 4.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/attendance.nirasons.com
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name attendance.nirasons.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

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

    # Increase upload size if needed for avatars
    client_max_body_size 10M;
}
```

### 4.2 Enable Site and Test

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/attendance.nirasons.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

---

## Part 5: SSL Certificate (HTTPS)

### 5.1 Install SSL Certificate with Certbot

```bash
# Obtain and install certificate
sudo certbot --nginx -d attendance.nirasons.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

### 5.2 Auto-renewal Test

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# If successful, certbot will auto-renew before expiry
```

---

## Part 6: Post-Deployment Steps

### 6.1 Verify Application

1. **Access**: Open `https://attendance.nirasons.com`
2. **Login**: Use admin credentials created during seeding
3. **Test Features**:
   - Add an employee
   - Employee login
   - Check-in/check-out
   - View reports
   - Export CSV

### 6.2 Setup Database Backup

```bash
# Create backup script
sudo nano /home/nirasons/backup-db.sh
```

**Add this content:**
```bash
#!/bin/bash
BACKUP_DIR="/home/nirasons/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/nirasons_attendance_$DATE.sql"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump -U nirasons_user nirasons_attendance > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

```bash
# Make executable
chmod +x /home/nirasons/backup-db.sh

# Add to crontab (daily backup at 2 AM)
crontab -e
# Add this line:
0 2 * * * /home/nirasons/backup-db.sh >> /home/nirasons/backup.log 2>&1
```

### 6.3 Monitoring

```bash
# Check application status
pm2 status

# View application logs
pm2 logs nirasons-attendance

# Monitor in real-time
pm2 monit

# Check nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Part 7: Maintenance

### Update Application

```bash
sudo su - nirasons
cd nirasons-attendance

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run migrations if any
npx prisma migrate deploy

# Rebuild
npm run build

# Restart application
pm2 restart nirasons-attendance

# Exit
exit
```

### Restart Services

```bash
# Restart application
pm2 restart nirasons-attendance

# Restart nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs nirasons-attendance

# Check if port 3000 is in use
sudo netstat -tlnp | grep 3000

# Check environment variables
cat /home/nirasons/nirasons-attendance/.env
```

### Database connection errors
```bash
# Test database connection
psql -U nirasons_user -d nirasons_attendance -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Nginx errors
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx logs
sudo tail -100 /var/log/nginx/error.log
```

---

## Security Checklist

- [ ] Strong database password set
- [ ] Strong JWT_SECRET generated (32+ characters)
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Firewall configured (allow ports 80, 443, 22 only)
- [ ] SSH key-based authentication enabled
- [ ] Regular backups configured
- [ ] PostgreSQL accessible only from localhost
- [ ] Demo credentials removed from code
- [ ] Server packages up to date

---

## Support & Maintenance

For issues or questions:
1. Check logs: `pm2 logs nirasons-attendance`
2. Review this deployment guide
3. Check server resource usage: `htop` or `free -h`

**Regular Maintenance:**
- Weekly: Review logs and monitor resource usage
- Monthly: Update server packages (`sudo apt update && sudo apt upgrade`)
- Quarterly: Review and rotate backup storage
