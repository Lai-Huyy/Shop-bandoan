import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/index.js';

const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@shop-bandoan.local';
const ADMIN_PASSWORD = 'huy123456';
const ADMIN_FULL_NAME = 'Shop-bandoan Administrator';
const BCRYPT_SALT_ROUNDS = 12;

const prisma = new PrismaClient();

async function seedAdministrator(): Promise<void> {
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Shop-bandoan administrator account',
    },
  });

  const existingAdmin = await prisma.user.findUnique({
    where: { username: ADMIN_USERNAME },
  });
  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { roleId: adminRole.id },
    });
    return;
  }

  const userWithAdminEmail = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });
  if (userWithAdminEmail) {
    throw new Error(
      `Cannot seed ${ADMIN_USERNAME}: ${ADMIN_EMAIL} is already assigned to another username`,
    );
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);
  await prisma.user.create({
    data: {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      passwordHash,
      fullName: ADMIN_FULL_NAME,
      roleId: adminRole.id,
    },
  });
}

async function seedCatalog(): Promise<void> {
  const category = await prisma.category.upsert({
    where: { slug: 'mon-chinh' },
    update: { isDisplayed: true },
    create: { name: 'Món chính', slug: 'mon-chinh', description: 'Món ăn phục vụ hằng ngày' },
  });
  await prisma.product.upsert({
    where: { slug: 'com-tam-suon-nuong' },
    update: { status: 'AVAILABLE' },
    create: {
      name: 'Cơm tấm sườn nướng', slug: 'com-tam-suon-nuong',
      description: 'Cơm tấm truyền thống với sườn nướng.', basePrice: '65000.00',
      categoryId: category.id, status: 'AVAILABLE',
      images: { create: { url: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?auto=format&fit=crop&w=900&q=80', altText: 'Cơm tấm sườn nướng', isPrimary: true } },
    },
  });
}

Promise.all([seedAdministrator(), seedCatalog()])
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    process.stderr.write(`Administrator seed failed: ${message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
