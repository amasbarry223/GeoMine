import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-config';

const handler = NextAuth(authOptions);

// Ensure proper export for Next.js App Router
export { handler as GET, handler as POST };

// For debugging in development
if (process.env.NODE_ENV === 'development') {
  console.log('[NextAuth] Route handler initialized');
  console.log('[NextAuth] NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'not set');
  console.log('[NextAuth] NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'set' : 'not set');
}
