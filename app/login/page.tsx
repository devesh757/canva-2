import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import LoginClient from '@/components/LoginClient';

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect('/');
  return <LoginClient />;
}
