import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials');
          return null;
        }

        try {
          console.log('[AUTH] Attempting login for:', credentials.email);
          
          // Find user by email
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log('[AUTH] User not found:', credentials.email);
            return null;
          }

          if (!user.password) {
            console.log('[AUTH] User has no password set:', credentials.email);
            return null;
          }

          console.log('[AUTH] User found, verifying password...');

          // Verify password
          const isValid = await compare(credentials.password, user.password);

          if (!isValid) {
            console.log('[AUTH] Invalid password for:', credentials.email);
            return null;
          }

          console.log('[AUTH] Login successful for:', credentials.email);

          // Return user object (without password)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('[AUTH] Error:', error);
          console.error('[AUTH] Error details:', {
            email: credentials?.email,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
          });
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Validate configuration on module load
if (process.env.NODE_ENV === 'development') {
  if (!process.env.NEXTAUTH_SECRET) {
    console.warn('⚠️  WARNING: NEXTAUTH_SECRET is not set! Authentication may not work properly.');
  }
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  WARNING: DATABASE_URL is not set! Database connection may fail.');
  } else {
    console.log('✅ DATABASE_URL:', process.env.DATABASE_URL);
  }
}
