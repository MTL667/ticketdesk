import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ENTITY_NAMES = [
  "Marketing",
  "IT",
  "Operations",
  "Finance",
  "HR",
  "Sales",
  "Logistics",
];

async function main() {
  for (const name of ENTITY_NAMES) {
    await prisma.entity.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const marketing = await prisma.entity.findUnique({
    where: { name: "Marketing" },
  });

  if (!marketing) {
    throw new Error('Seed failed: entity "Marketing" was not created');
  }

  await prisma.item.upsert({
    where: { slug: "bakwagen" },
    update: {
      name: "Bakwagen",
      category: "Voertuig",
      location: "Depot",
      total: 1,
      minStock: 0,
      entityId: marketing.id,
      notes: "Bedrijfsbakwagen voor reserveringen via BookAVan",
    },
    create: {
      name: "Bakwagen",
      slug: "bakwagen",
      category: "Voertuig",
      location: "Depot",
      total: 1,
      available: 1,
      minStock: 0,
      entityId: marketing.id,
      notes: "Bedrijfsbakwagen voor reserveringen via BookAVan",
    },
  });

  console.log("Seed complete: entities + bakwagen item");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
