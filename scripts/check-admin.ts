import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking admin user...\n');

  // Check if admin user exists
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@geomine.com' },
  });

  if (!admin) {
    console.log('❌ Admin user NOT FOUND in database');
    console.log('\n💡 Run: npm run db:init');
    return;
  }

  console.log('✅ Admin user found:');
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Name: ${admin.name}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Password hash exists: ${admin.password ? 'YES' : 'NO'}`);
  console.log(`   Password hash length: ${admin.password?.length || 0}`);

  // Test password verification
  if (admin.password) {
    console.log('\n🔐 Testing password verification...');
    const testPassword = 'admin123';
    const isValid = await compare(testPassword, admin.password);
    console.log(`   Password 'admin123' is valid: ${isValid ? '✅ YES' : '❌ NO'}`);
    
    if (!isValid) {
      console.log('\n⚠️  Password verification failed!');
      console.log('   The password hash in database does not match "admin123"');
      console.log('\n💡 Solution: Reset the admin password');
    }
  } else {
    console.log('\n❌ No password hash found for admin user!');
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

  allUsers.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.email} (${user.role}) - Password: ${user.password ? 'SET' : 'NOT SET'}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

