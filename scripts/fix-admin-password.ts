import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcrypt';

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/db/custom.db';
}

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing admin password...\n');

  const email = 'admin@geomine.com';
  const password = 'admin123';

  try {
    // Check if admin exists
    let admin = await prisma.user.findUnique({
      where: { email },
    });

    if (!admin) {
      console.log('❌ Admin user not found. Creating...');
      const hashedPassword = await hash(password, 10);
      admin = await prisma.user.create({
        data: {
          email,
          name: 'Administrateur',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
      console.log('✅ Admin user created:', admin.email);
    } else {
      console.log('✅ Admin user found:', admin.email);
      
      // Test current password
      if (admin.password) {
        const isValid = await compare(password, admin.password);
        console.log(`   Current password verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        
        if (!isValid) {
          console.log('   🔄 Resetting password...');
          const hashedPassword = await hash(password, 10);
          admin = await prisma.user.update({
            where: { id: admin.id },
            data: { password: hashedPassword },
          });
          console.log('   ✅ Password reset successfully');
          
          // Verify new password
          const verifyNew = await compare(password, admin.password!);
          console.log(`   New password verification: ${verifyNew ? '✅ VALID' : '❌ INVALID'}`);
        }
      } else {
        console.log('   ⚠️  No password set. Setting password...');
        const hashedPassword = await hash(password, 10);
        admin = await prisma.user.update({
          where: { id: admin.id },
          data: { password: hashedPassword },
        });
        console.log('   ✅ Password set successfully');
      }
    }

    console.log('\n📝 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n✅ Admin password fixed! You can now login.');
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



