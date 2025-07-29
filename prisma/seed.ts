import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create expense categories
  const categories = [
    { id: 'transport', name: '交通費', color: '#3B82F6', icon: '🚗' },
    { id: 'accommodation', name: '宿泊費', color: '#10B981', icon: '🏨' },
    { id: 'food', name: '食事', color: '#F59E0B', icon: '🍽️' },
    { id: 'entertainment', name: '観光・娯楽', color: '#EF4444', icon: '🎡' },
    { id: 'shopping', name: '買い物', color: '#8B5CF6', icon: '🛍️' },
    { id: 'other', name: 'その他', color: '#6B7280', icon: '📝' },
  ];

  for (const category of categories) {
    await prisma.expenseCategory.upsert({
      where: { id: category.id },
      update: {},
      create: category,
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
