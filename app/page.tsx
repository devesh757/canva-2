import { requireUser } from '@/lib/auth';
import { activePlan } from '@/lib/entitlements';
import HomeClient from '@/components/HomeClient';

export default async function HomePage() {
  const user = await requireUser();
  const plan = await activePlan(user.id);
  return <HomeClient user={{ name: user.name || user.email, email: user.email }} plan={plan} />;
}
