import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const tables = [
  'conversation', 'lead', 'leadImport', 'chatMessage', 'activity',
  'payment', 'contract', 'booking', 'maintenance',
  'client', 'vehicle', 'wassenderConfig', 'llmConfig',
  'contractTemplate', 'user',
];

try {
  const agencies = await prisma.agency.findMany({
    select: { id: true, name: true, slug: true }
  });

  const keepSlugs = ['demo', 'admin'];
  const toDelete = agencies.filter(a => !keepSlugs.includes(a.slug));
  const keepIds = agencies.filter(a => keepSlugs.includes(a.slug)).map(a => a.id);

  for (const agency of toDelete) {
    console.log(`Deleting: ${agency.name} (${agency.slug})`);
    const id = agency.id;
    for (const table of tables) {
      const model = prisma[table];
      if (model && typeof model.deleteMany === 'function') {
        await model.deleteMany({ where: { agencyId: id } });
      }
    }
    await prisma.agency.deleteMany({ where: { id } });
  }

  if (keepIds.length > 0) {
    const dl = await prisma.lead.deleteMany({ where: { agencyId: { in: keepIds } } });
    console.log(`Deleted ${dl.count} leads`);
    const dc = await prisma.chatMessage.deleteMany({ where: { agencyId: { in: keepIds } } });
    console.log(`Deleted ${dc.count} messages`);
  }

  console.log('\n=== FINAL STATE ===');
  console.log(`Agencies: ${await prisma.agency.count()}`);
  console.log(`Vehicles: ${await prisma.vehicle.count()}`);
  console.log(`Users: ${await prisma.user.count()}`);
  console.log(`Leads: ${await prisma.lead.count()}`);
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
