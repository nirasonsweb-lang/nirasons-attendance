# Nirasons Attendance Management System

A modern, secure attendance management system built with Next.js, Prisma, and PostgreSQL. Features role-based access control, real-time attendance tracking, analytics, and comprehensive reporting.

## 🌟 Features

- **Role-Based Access Control**: Separate admin and employee dashboards with appropriate permissions
- **Attendance Tracking**: Check-in/check-out with location tracking
- **Real-Time Analytics**: Comprehensive dashboard with charts and insights
- **Employee Management**: Full CRUD operations for employee management
- **Task Management**: Assign and track tasks with priorities and statuses
- **Reports & Export**: Generate and export attendance reports as CSV
- **Settings Configuration**: Customizable work hours, thresholds, and company settings
- **Secure Authentication**: JWT-based authentication with HttpOnly cookies
- **Responsive Design**: Mobile-friendly interface with modern UI/UX

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jose)
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library
- **Validation**: Zod
- **Password Hashing**: bcryptjs

## 📋 Prerequisites

- Node.js 18.x or later
- PostgreSQL 14.x or later
- npm or yarn

## 🚀 Quick Start (Development)

### 1. Clone and Install

```bash
git clone <repository-url>
cd nirasons-attendance
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and JWT secret:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/nirasons_attendance"
JWT_SECRET="your-secret-key-min-32-characters"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with demo data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and login with:
- **Admin**: admin@nirasons.com / admin123
- **Employee**: natashia@nirasons.com / employee123

## 🏭 Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive production deployment guide to VPS with:
- Server setup and configuration
- PostgreSQL database setup
- Nginx reverse proxy configuration
- SSL/HTTPS with Let's Encrypt
- PM2 process management
- Backup strategies
- Security hardening

### Production Quick Reference

```bash
# Build for production
npm run build

# Run migrations (no seed data)
npm run db:migrate:deploy

# Create admin user (interactive)
npm run db:seed:production

# Start production server
npm start
```

## 📁 Project Structure

```
nirasons-attendance/
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Development seed data
│   └── seed-production.ts      # Production setup script
├── public/                     # Static assets
│   ├── logo.png
│   └── favicon.ico
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/                # API routes
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   └── page.tsx            # Login page
│   ├── components/             # Reusable components
│   │   ├── dashboard/
│   │   ├── layout/
│   │   └── ui/
│   ├── lib/                    # Utilities and configurations
│   │   ├── auth.ts             # Authentication logic
│   │   ├── db.ts               # Prisma client
│   │   ├── utils.ts            # Helper functions
│   │   └── validations.ts      # Zod schemas
│   └── types/                  # TypeScript type definitions
├── .env.example                # Development environment template
├── .env.production.template    # Production environment template
├── DEPLOYMENT.md               # Production deployment guide
└── README.md                   # This file
```

## 🔐 Security Features

- ✅ JWT-based authentication with secure HttpOnly cookies
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Role-based access control (RBAC)
- ✅ Environment variable validation
- ✅ CSRF protection via SameSite cookies
- ✅ SQL injection protection (Prisma ORM)
- ✅ XSS protection (React)
- ✅ HTTPS enforcement in production
- ✅ Secure session management

## 📊 Database Schema

### Models
- **User**: Employee and admin accounts with roles
- **Attendance**: Daily check-in/check-out records with location
- **Task**: Task assignments with priorities and statuses
- **Setting**: System configuration key-value pairs

See `prisma/schema.prisma` for complete schema definition.

## 🧪 Development

### Available Scripts

```bash
npm run dev                # Start development server
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint
npm run db:generate        # Generate Prisma Client
npm run db:push            # Push schema changes to database
npm run db:migrate         # Create and run migrations
npm run db:seed            # Seed development data
npm run db:studio          # Open Prisma Studio
```

### Production Scripts

```bash
npm run db:migrate:deploy  # Deploy migrations (production)
npm run db:seed:production # Interactive admin setup
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

Copyright © 2024 Nirasons. All rights reserved.

## 💬 Support

For deployment issues or questions, refer to [DEPLOYMENT.md](./DEPLOYMENT.md) or contact the system administrator.

---

**Version**: 1.0.0  
**Status**: Production Ready ✅
