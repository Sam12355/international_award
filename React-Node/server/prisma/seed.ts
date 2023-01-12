import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed journals
  const journals = await Promise.all([
    prisma.journal.upsert({
      where: { issn: '2517-8382' },
      update: {},
      create: {
        name: 'Journal of Agricultural Sciences',
        description: 'A peer-reviewed journal covering all aspects of agricultural research.',
        issn: '2517-8382',
        isActive: true,
      },
    }),
    prisma.journal.upsert({
      where: { issn: '2523-1073' },
      update: {},
      create: {
        name: 'Journal of Sustainable Farming',
        description: 'Dedicated to sustainable and organic farming practices.',
        issn: '2523-1073',
        isActive: true,
      },
    }),
    prisma.journal.upsert({
      where: { issn: '2524-4523' },
      update: {},
      create: {
        name: 'Journal of Food & Biosystems Engineering',
        description: 'Focuses on food processing and biosystems engineering research.',
        issn: '2524-4523',
        isActive: true,
      },
    }),
  ]);

  console.log(`  ✅ ${journals.length} journals seeded`);

  // Seed admin user
  const hashedPassword = await bcrypt.hash('password', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sjp.dev' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@sjp.dev',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`  ✅ Admin user seeded (email: ${admin.email})`);

  // Seed reviewer user
  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@sjp.dev' },
    update: {},
    create: {
      name: 'Reviewer User',
      email: 'reviewer@sjp.dev',
      password: hashedPassword,
      role: 'REVIEWER',
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`  ✅ Reviewer user seeded (email: ${reviewer.email})`);

  // Seed author user
  const author = await prisma.user.upsert({
    where: { email: 'author@sjp.dev' },
    update: {},
    create: {
      name: 'Author User',
      email: 'author@sjp.dev',
      password: hashedPassword,
      role: 'AUTHOR',
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`  ✅ Author user seeded (email: ${author.email})`);

  console.log('\n🎉 Seeding complete! Default password for all users: "password"');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
