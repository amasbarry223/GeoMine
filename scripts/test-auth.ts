import { PrismaClient } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

console.log('🔍 COMPLETE AUTHENTICATION ANALYSIS\n');
console.log('=' .repeat(60));

// 1. Check environment variables
console.log('\n1️⃣ ENVIRONMENT VARIABLES:');
console.log('   DATABASE_URL:', process.env.DATABASE_URL || '❌ NOT SET');
console.log('   NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ SET (' + process.env.NEXTAUTH_SECRET.length + ' chars)' : '❌ NOT SET');
console.log('   NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ NOT SET');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');

async function main() {
// 2. Check database connection
console.log('\n2️⃣ DATABASE CONNECTION:');
const prisma = new PrismaClient({
  log: ['error'],
});

let dbConnected = false;
try {
  await prisma.$connect();
  dbConnected = true;
  console.log('   ✅ Database connection: SUCCESS');
} catch (error) {
  console.log('   ❌ Database connection: FAILED');
  console.log('   Error:', error instanceof Error ? error.message : String(error));
}

// 3. Check admin user
console.log('\n3️⃣ ADMIN USER CHECK:');
let adminExists = false;
let adminValid = false;

if (dbConnected) {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@geomine.com' },
    });

    if (admin) {
      adminExists = true;
      console.log('   ✅ Admin user exists');
      console.log('      ID:', admin.id);
      console.log('      Email:', admin.email);
      console.log('      Name:', admin.name);
      console.log('      Role:', admin.role);
      console.log('      Password hash:', admin.password ? `✅ SET (${admin.password.length} chars)` : '❌ NOT SET');
      console.log('      Created:', admin.createdAt);
      console.log('      Updated:', admin.updatedAt);

      if (admin.password) {
        // Test password verification
        const testPassword = 'admin123';
        const isValid = await compare(testPassword, admin.password);
        adminValid = isValid;
        console.log('      Password "admin123" verification:', isValid ? '✅ VALID' : '❌ INVALID');
        
        if (!isValid) {
          console.log('   ⚠️  Password hash does not match "admin123"');
          console.log('   🔄 Resetting password...');
          const newHash = await hash('admin123', 10);
          await prisma.user.update({
            where: { id: admin.id },
            data: { password: newHash },
          });
          console.log('   ✅ Password reset complete');
          adminValid = true;
        }
      } else {
        console.log('   ⚠️  Admin user has no password!');
        console.log('   🔄 Setting password...');
        const newHash = await hash('admin123', 10);
        await prisma.user.update({
          where: { id: admin.id },
          data: { password: newHash },
        });
        console.log('   ✅ Password set');
        adminValid = true;
      }
    } else {
      console.log('   ❌ Admin user NOT FOUND');
      console.log('   🔄 Creating admin user...');
      const hashedPassword = await hash('admin123', 10);
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@geomine.com',
          name: 'Administrateur',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
      console.log('   ✅ Admin user created:', newAdmin.email);
      adminExists = true;
      adminValid = true;
    }
  } catch (error) {
    console.log('   ❌ Error checking admin user');
    console.log('   Error:', error instanceof Error ? error.message : String(error));
  }
} else {
  console.log('   ⚠️  Skipping admin check (database not connected)');
}

// 4. List all users
console.log('\n4️⃣ ALL USERS IN DATABASE:');
if (dbConnected) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    });

    if (users.length === 0) {
      console.log('   ⚠️  No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Password: ${user.password ? '✅ SET' : '❌ NOT SET'}`);
      });
    }
  } catch (error) {
    console.log('   ❌ Error listing users');
    console.log('   Error:', error instanceof Error ? error.message : String(error));
  }
}

// 5. Test database path
console.log('\n5️⃣ DATABASE FILE CHECK:');
const dbPath = process.env.DATABASE_URL?.replace('file:', '')?.replace(/^"/, '').replace(/"$/, '');
if (dbPath) {
  const fs = await import('fs');
  const fullPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
  const exists = fs.existsSync(fullPath);
  console.log('   Database path:', fullPath);
  console.log('   File exists:', exists ? '✅ YES' : '❌ NO');
  if (exists) {
    const stats = fs.statSync(fullPath);
    console.log('   File size:', (stats.size / 1024).toFixed(2), 'KB');
  }
} else {
  console.log('   ⚠️  Could not determine database path');
}

// 6. Summary
console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY:');
console.log('   Database connection:', dbConnected ? '✅ OK' : '❌ FAILED');
console.log('   Admin user exists:', adminExists ? '✅ YES' : '❌ NO');
console.log('   Admin password valid:', adminValid ? '✅ YES' : '❌ NO');
console.log('   Environment variables:', 
  (process.env.DATABASE_URL && process.env.NEXTAUTH_SECRET) ? '✅ OK' : '❌ MISSING');

if (dbConnected && adminExists && adminValid && process.env.DATABASE_URL && process.env.NEXTAUTH_SECRET) {
  console.log('\n✅ ALL CHECKS PASSED! Authentication should work.');
  console.log('\n📝 Login credentials:');
  console.log('   Email: admin@geomine.com');
  console.log('   Password: admin123');
  console.log('\n💡 If login still fails:');
  console.log('   1. Restart the Next.js dev server');
  console.log('   2. Check browser console for errors');
  console.log('   3. Check server console for [AUTH] logs');
} else {
  console.log('\n❌ SOME CHECKS FAILED! Please fix the issues above.');
}

  await prisma.$disconnect();
}

main().catch(console.error);

