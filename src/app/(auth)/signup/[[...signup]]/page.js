import { redirect } from 'next/navigation';
import { authModalUrl } from '@/lib/authRoutes';

export default function SignUpPage() {
  redirect(authModalUrl('signup'));
}
