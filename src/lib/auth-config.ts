import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare, hash } from 'bcrypt';
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
        console.log('[AUTH] ===== AUTHORIZE CALLED =====');
        console.log('[AUTH] Credentials received:', {
          email: credentials?.email,
          emailType: typeof credentials?.email,
          emailLength: credentials?.email?.length,
          passwordProvided: !!credentials?.password,
          passwordLength: credentials?.password?.length,
        });

        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] ❌ Missing credentials');
          return null;
        }

        try {
          console.log('[AUTH] Attempting login for:', credentials.email);
          
          // Find user by email (exact match, normalize email to lowercase)
          const normalizedEmail = credentials.email.toLowerCase().trim();
          const user = await db.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!user) {
            console.log('[AUTH] User not found:', normalizedEmail);
            // List all users for debugging
            try {
              const allUsers = await db.user.findMany({ select: { email: true } });
              console.log('[AUTH] Available users:', allUsers.map(u => u.email));
            } catch (e) {
              console.log('[AUTH] Could not list users:', e);
            }
            return null;
          }

          if (!user.password) {
            console.log('[AUTH] User has no password set:', credentials.email);
            console.log('[AUTH] User ID:', user.id);
            return null;
          }

          console.log('[AUTH] User found:', user.email);
          console.log('[AUTH] Password hash length:', user.password.length);
          console.log('[AUTH] Password hash preview:', user.password.substring(0, 20) + '...');
          console.log('[AUTH] Verifying password...');
          console.log('[AUTH] Password provided:', credentials.password.length, 'characters');

          // Verify password
          let isValid = false;
          try {
            isValid = await compare(credentials.password, user.password);
            console.log('[AUTH] Password comparison result:', isValid);
          } catch (compareError) {
            console.error('[AUTH] Error comparing password:', compareError);
            return null;
          }

          if (!isValid) {
            console.log('[AUTH] ❌ Invalid password for:', credentials.email);
            console.log('[AUTH] Password provided:', credentials.password);
            console.log('[AUTH] Password hash in DB:', user.password.substring(0, 30) + '...');
            
            // Test bcrypt functionality
            if (credentials.email.toLowerCase() === 'admin@geomine.com') {
              console.log('[AUTH] Debug: Testing bcrypt functionality...');
              try {
                const testHash = await hash('admin123', 10);
                const testCompare = await compare('admin123', testHash);
                console.log('[AUTH] Debug: Bcrypt test hash/compare:', testCompare ? '✅ WORKS' : '❌ FAILED');
                
                // Try to compare with a fresh hash of admin123
                const freshHash = await hash('admin123', 10);
                const freshCompare = await compare('admin123', freshHash);
                console.log('[AUTH] Debug: Fresh hash comparison:', freshCompare ? '✅ WORKS' : '❌ FAILED');
              } catch (bcryptError) {
                console.error('[AUTH] Debug: Bcrypt error:', bcryptError);
              }
            }
            return null;
          }

          console.log('[AUTH] ✅ Login successful for:', credentials.email);

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
