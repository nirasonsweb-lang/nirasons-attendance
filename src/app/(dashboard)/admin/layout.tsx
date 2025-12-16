import { redirect } from 'next/navigation';
import { getSession, isAdmin } from '@/lib/auth';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    // Double-check: If not logged in, redirect to login
    if (!session) {
        redirect('/');
    }

    // CRITICAL: If not admin, redirect to employee dashboard
    if (!isAdmin(session)) {
        redirect('/employee');
    }

    return <>{children}</>;
}
