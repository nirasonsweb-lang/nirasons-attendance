import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Production Database Setup\n');

    // Hardcoded admin credentials
    const name = 'Nirasons';
    const email = 'nirasons.web@gmail.com';
    const password = 'Nirasons@8269577642';

    console.log('📋 Creating admin account:');
    console.log(`Email: ${email}\n`);

    console.log('🔧 Setting up database...\n');

    // Create default settings
    const settings = [
        { key: 'work_start_time', value: '14:00', description: 'Official work start time' },
        { key: 'work_end_time', value: '20:00', description: 'Official work end time' },
        { key: 'late_threshold_minutes', value: '15', description: 'Minutes after start time to mark as late' },
        { key: 'company_name', value: 'Nirasons', description: 'Company name' },
        { key: 'company_email', value: email, description: 'Company contact email' },
        { key: 'timezone', value: 'Asia/Kolkata', description: 'Default timezone' },
    ];

    for (const setting of settings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting,
        });
    }
    console.log('✅ Settings created');

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            password: hashedPassword,
            name,
            role: 'ADMIN',
            department: 'Administration',
            position: 'Administrator',
        },
    });
    console.log('✅ Admin user created:', admin.email);

    console.log('\n🎉 Production setup completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Start the application: npm run start');
    console.log('2. Login with: nirasons.web@gmail.com');
    console.log('3. Add employees through the admin panel\n');
}

main()
    .catch((e) => {
        console.error('❌ Setup error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
