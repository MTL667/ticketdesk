import prisma from "@/lib/prisma";

export const BAKWAGEN_SLUG = "bakwagen";

export async function getBakwagenItem() {
  return prisma.item.findUnique({
    where: { slug: BAKWAGEN_SLUG },
  });
}
