import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables before running this script.\n" +
        'Example: SEED_ADMIN_EMAIL="you@example.com" SEED_ADMIN_PASSWORD="a-strong-password" npm run db:seed-admin'
    );
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("SEED_ADMIN_PASSWORD should be at least 12 characters for a super-admin account.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { role: "SUPER_ADMIN", passwordHash },
    create: {
      firstName: "Super",
      lastName: "Admin",
      email: email.toLowerCase(),
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log(`SUPER_ADMIN ready: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
