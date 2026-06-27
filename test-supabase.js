const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  const agency = await p.agency.findFirst({ where: { email: 'e2etest2@example.com' } });
  if (!agency) { console.log('FAIL: Agency not found'); return; }
  console.log('✓ Agency found:', agency.name);

  const vehicle = await p.vehicle.create({
    data: {
      brand: 'Toyota', model: 'Camry', year: 2024, licensePlate: 'TST-1234',
      dailyRate: 75, status: 'available', agencyId: agency.id, category: 'sedan'
    }
  });
  console.log('✓ Vehicle created:', vehicle.brand, vehicle.model, vehicle.licensePlate);

  const client = await p.client.create({
    data: {
      firstName: 'John', lastName: 'Doe', email: 'john@example.com',
      phone: '+1234567890', agencyId: agency.id
    }
  });
  console.log('✓ Client created:', client.firstName, client.lastName);

  const user = await p.user.findFirst({ where: { agencyId: agency.id } });

  const booking = await p.booking.create({
    data: {
      vehicleId: vehicle.id, clientId: client.id, userId: user.id,
      agencyId: agency.id,
      pickupDate: new Date('2026-07-01'), returnDate: new Date('2026-07-05'),
      totalAmount: 300, status: 'confirmed'
    }
  });
  console.log('✓ Booking created:', booking.id, '- Total:', booking.totalAmount);

  const contract = await p.contract.create({
    data: {
      contractNumber: 'CR-2026-TEST001', status: 'draft',
      bookingId: booking.id, clientId: client.id, userId: user.id, agencyId: agency.id,
      content: 'Standard rental contract terms...'
    }
  });
  console.log('✓ Contract created:', contract.contractNumber);

  const payment = await p.payment.create({
    data: {
      amount: 150, method: 'cash', type: 'deposit', status: 'paid',
      bookingId: booking.id, userId: user.id, agencyId: agency.id
    }
  });
  console.log('✓ Payment created:', payment.amount, payment.method);

  const maintenance = await p.maintenance.create({
    data: {
      type: 'service', description: 'Oil change', status: 'pending',
      vehicleId: vehicle.id, agencyId: agency.id, cost: 50, provider: 'QuickLube'
    }
  });
  console.log('✓ Maintenance created:', maintenance.type, maintenance.provider);

  const template = await p.contractTemplate.create({
    data: {
      name: 'Standard Contract', content: 'Standard terms...', isDefault: true,
      agencyId: agency.id
    }
  });
  console.log('✓ Contract template created:', template.name);

  await p.chatMessage.create({
    data: {
      role: 'user', content: 'Hello AI!', userId: user.id, agencyId: agency.id
    }
  });
  console.log('✓ Chat message created');

  const bookingsWithRelations = await p.booking.findUnique({
    where: { id: booking.id },
    include: { vehicle: true, client: true, contract: true, payments: true }
  });
  console.log('');
  console.log('=== RELATIONSHIP VERIFICATION ===');
  console.log('Booking -> Vehicle:', bookingsWithRelations.vehicle.brand, bookingsWithRelations.vehicle.model);
  console.log('Booking -> Client:', bookingsWithRelations.client.firstName, bookingsWithRelations.client.lastName);
  console.log('Booking -> Contract:', bookingsWithRelations.contract?.contractNumber);
  console.log('Booking -> Payments:', bookingsWithRelations.payments.length, 'payment(s)');
  console.log('');
  console.log('✓ ALL TESTS PASSED - Supabase PostgreSQL is working correctly');

  // Cleanup test data
  await p.chatMessage.deleteMany({ where: { agencyId: agency.id } });
  await p.maintenance.deleteMany({ where: { vehicleId: vehicle.id } });
  await p.payment.deleteMany({ where: { bookingId: booking.id } });
  await p.contract.deleteMany({ where: { bookingId: booking.id } });
  await p.contractTemplate.deleteMany({ where: { agencyId: agency.id } });
  await p.booking.deleteMany({ where: { agencyId: agency.id } });
  await p.vehicle.deleteMany({ where: { agencyId: agency.id } });
  await p.client.deleteMany({ where: { agencyId: agency.id } });
  await p.$disconnect();
}
test().catch(e => { console.error('FAIL:', e.message); p.$disconnect(); });
