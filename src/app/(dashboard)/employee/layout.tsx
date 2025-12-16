import { redirect } from 'next/navigation';
import { getSession, isEmployee } from '@/lib/auth';

export default async function EmployeeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    // Double-check: If not logged in, redirect to login
    if (!session) {
        redirect('/');
    }

    // If admin trying to access employee routes, redirect to admin dashboard
    if (!isEmployee(session)) {
        redirect('/admin');
    }

    return <>{children}</>;
}
