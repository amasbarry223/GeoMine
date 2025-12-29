import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcrypt';

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Try to load .env.local first, then .env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  // Try common database paths
  const possiblePaths = [
    'file:./db/custom.db',
    'file:./prisma/db/custom.db',
  ];
  
  // Check which database file exists
  for (const dbPath of possiblePaths) {
    const filePath = dbPath.replace('file:', '');
    if (fs.existsSync(filePath)) {
      process.env.DATABASE_URL = dbPath;
      console.log('📝 Found database at:', dbPath);
      break;
    }
  }
  
  // Default if none found
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./db/custom.db';
    console.log('📝 Using default DATABASE_URL:', process.env.DATABASE_URL);
  }
} else {
  console.log('📝 Using DATABASE_URL from environment:', process.env.DATABASE_URL);
}

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Diagnosing authentication issue...\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected\n');

    // Check if admin user exists
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@geomine.com' },
    });

    if (!admin) {
      console.log('❌ Admin user NOT FOUND');
      console.log('💡 Creating admin user...\n');
      
      const password = 'admin123';
      const hashedPassword = await hash(password, 10);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@geomine.com',
          name: 'Administrateur',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      console.log('✅ Admin user created:', newAdmin.email);
      console.log('📝 Password hash length:', newAdmin.password?.length || 0);
      
      // Verify password works
      const verify = await compare(password, newAdmin.password!);
      console.log('🔐 Password verification test:', verify ? '✅ PASS' : '❌ FAIL');
      
      console.log('\n📝 Login credentials:');
      console.log('   Email: admin@geomine.com');
      console.log('   Password: admin123');
    } else {
      console.log('✅ Admin user found:');
      console.log('   ID:', admin.id);
      console.log('   Email:', admin.email);
      console.log('   Name:', admin.name);
      console.log('   Role:', admin.role);
      console.log('   Password exists:', admin.password ? 'YES' : 'NO');
      console.log('   Password hash length:', admin.password?.length || 0);
      console.log('');

      if (admin.password) {
        // Test password verification
        const password = 'admin123';
        console.log('🔐 Testing password verification...');
        const isValid = await compare(password, admin.password);
        console.log(`   Password 'admin123' is valid: ${isValid ? '✅ YES' : '❌ NO'}`);
        
        if (!isValid) {
          console.log('\n⚠️  Password verification FAILED!');
          console.log('💡 Resetting password...\n');
          
          const hashedPassword = await hash(password, 10);
          await prisma.user.update({
            where: { id: admin.id },
            data: { password: hashedPassword },
          });
          
          // Verify new password
          const updatedAdmin = await prisma.user.findUnique({
            where: { id: admin.id },
          });
          
          if (updatedAdmin?.password) {
            const verifyNew = await compare(password, updatedAdmin.password);
            console.log('✅ Password reset complete');
            console.log('🔐 New password verification:', verifyNew ? '✅ VALID' : '❌ INVALID');
          }
        }
      } else {
        console.log('⚠️  Admin has no password! Setting password...\n');
        const password = 'admin123';
        const hashedPassword = await hash(password, 10);
        await prisma.user.update({
          where: { id: admin.id },
          data: { password: hashedPassword },
        });
        console.log('✅ Password set');
      }
    }

    // List all users
    console.log('\n📋 All users in database:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    });

    if (allUsers.length === 0) {
      console.log('   No users found');
    } else {
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role})`);
        console.log(`      Password: ${user.password ? `SET (${user.password.length} chars)` : 'NOT SET'}`);
      });
    }

    console.log('\n✅ Diagnosis complete!');
    console.log('\n📝 Try logging in with:');
    console.log('   Email: admin@geomine.com');
    console.log('   Password: admin123');
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

