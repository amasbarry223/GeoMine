import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/db/custom.db';
}

// Create .env file if it doesn't exist
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `# Database
DATABASE_URL="file:./prisma/db/custom.db"

# NextAuth
NEXTAUTH_SECRET="${process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production'}"
NEXTAUTH_URL="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}"
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file');
}

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Initializing GeoMine RC-Insight database...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@geomine.com' },
  });

  if (!existingAdmin) {
    const hashedPassword = await hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@geomine.com',
        name: 'Administrateur',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created:', admin.email);
    console.log('📝 Default password: admin123');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  // Get admin user
  const admin = existingAdmin || await prisma.user.findUnique({
    where: { email: 'admin@geomine.com' },
  });

  // Create sample project
  const existingProject = await prisma.project.findFirst({
    where: { name: 'Projet de démonstration' },
  });

  if (!existingProject && admin) {
    const project = await prisma.project.create({
      data: {
        name: 'Projet de démonstration',
        description: 'Projet exemple pour tester les fonctionnalités de GeoMine RC-Insight',
        siteLocation: 'Zone de test',
        gpsCoordinates: JSON.stringify({ lat: 45.234, lng: 2.567 }),
        tags: JSON.stringify(['demo', 'test']),
        status: 'ACTIVE',
        createdBy: admin.id,
      },
    });

    console.log('✅ Sample project created:', project.name);

    // Create sample campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: 'Campagne de test',
        description: 'Campagne pour démonstration',
        projectId: project.id,
        startDate: new Date(),
        fieldTeam: 'Équipe Alpha',
        weatherConditions: 'Ensoleillé',
        equipmentUsed: 'ABEM Terrameter LS',
      },
    });

    console.log('✅ Sample campaign created:', campaign.name);

    // Create sample survey line
    const surveyLine = await prisma.surveyLine.create({
      data: {
        name: 'Ligne RC-001',
        campaignId: campaign.id,
        lineType: 'DIPOLE_DIPOLE',
        azimuth: 45,
        electrodeSpacing: 10,
        numberOfElectrodes: 64,
        totalLength: 640,
      },
    });

    console.log('✅ Sample survey line created:', surveyLine.name);

    // Create sample dataset
    const sampleData = Array.from({ length: 100 }, (_, i) => ({
      x: (i % 10) * 10,
      y: Math.floor(i / 10) * 10,
      value: 100 + Math.random() * 900,
      electrodeA: i,
      electrodeB: i + 1,
      electrodeM: i + 2,
      electrodeN: i + 3,
    }));

    const dataset = await prisma.dataset.create({
      data: {
        name: 'Données de test',
        surveyLineId: surveyLine.id,
        dataType: 'RESISTIVITY',
        sourceFormat: 'CSV',
        fileName: 'test_data.csv',
        fileSize: 1024,
        rawData: JSON.stringify(sampleData),
        metadata: JSON.stringify({
          source: 'generated',
          description: 'Données synthétiques pour démonstration',
        }),
        isProcessed: false,
      },
    });

    console.log('✅ Sample dataset created:', dataset.name);
  }

  console.log('\n✨ Database initialization complete!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: admin@geomine.com');
  console.log('   Password: admin123');
  console.log('\n⚠️  Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Error initializing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
