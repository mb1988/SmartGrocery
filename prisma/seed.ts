import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Dev user
  const user = await prisma.user.upsert({
    where: { email: "dev@smartgrocery.local" },
    update: {},
    create: {
      email: "dev@smartgrocery.local",
      name: "Dev User",
    },
  });

  // Stores (owned by dev user)
  const tesco = await prisma.store.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Tesco",
      userId: user.id,
    },
  });

  const lidl = await prisma.store.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Lidl",
      userId: user.id,
    },
  });

  // Global item catalogue (10 common items, names normalised to lowercase)
  const itemNames = [
    { name: "milk", category: "dairy" },
    { name: "bread", category: "bakery" },
    { name: "cheese", category: "dairy" },
    { name: "butter", category: "dairy" },
    { name: "eggs", category: "dairy" },
    { name: "apples", category: "produce" },
    { name: "pasta", category: "pantry" },
    { name: "rice", category: "pantry" },
    { name: "chicken", category: "meat" },
    { name: "orange juice", category: "drinks" },
  ];

  for (const item of itemNames) {
    await prisma.item.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }

  console.log(
    `Seeded: user "${user.email}", stores "${tesco.name}" + "${lidl.name}", ${itemNames.length} items`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
