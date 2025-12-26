import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/db/custom.db';
}

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Resetting admin password...\n');

  const email = 'admin@geomine.com';
  const newPassword = 'admin123';

  // Find admin user
  const admin = await prisma.user.findUnique({
    where: { email },
  });

  if (!admin) {
    console.log('❌ Admin user not found. Creating new admin user...');
    const hashedPassword = await hash(newPassword, 10);
    const newAdmin = await prisma.user.create({
      data: {
        email,
        name: 'Administrateur',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin user created:', newAdmin.email);
  } else {
    console.log('✅ Admin user found:', admin.email);
    console.log('🔄 Resetting password...');
    
    // Hash new password
    const hashedPassword = await hash(newPassword, 10);
    
    // Update password
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });
    
    console.log('✅ Password reset successfully!');
  }

  console.log('\n📝 Login credentials:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${newPassword}`);
  console.log('\n⚠️  Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

