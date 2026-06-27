import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data for demo agency (for idempotent re-runs)
  const existingAgency = await prisma.agency.findUnique({ where: { slug: "demo" } });
  if (existingAgency) {
    await prisma.payment.deleteMany({ where: { agencyId: existingAgency.id } });
    await prisma.contract.deleteMany({ where: { agencyId: existingAgency.id } });
    await prisma.chatMessage.deleteMany({ where: { agencyId: existingAgency.id } });
    await prisma.maintenance.deleteMany({ where: { agencyId: existingAgency.id } });
    await prisma.activity.deleteMany({ where: { agencyId: existingAgency.id } });
    await prisma.booking.deleteMany({ where: { agencyId: existingAgency.id } });
    await prisma.client.deleteMany({ where: { agencyId: existingAgency.id } });
    await prisma.vehicle.deleteMany({ where: { agencyId: existingAgency.id } });
    await prisma.wassenderConfig.deleteMany({ where: { agencyId: existingAgency.id } });
    await prisma.llmConfig.deleteMany({ where: { agencyId: existingAgency.id } });
    await prisma.contractTemplate.deleteMany({ where: { agencyId: existingAgency.id } });
    await prisma.user.deleteMany({ where: { agencyId: existingAgency.id } });
    await prisma.agency.deleteMany({ where: { id: existingAgency.id } });
  }

  const agency = await prisma.agency.create({
    data: {
      name: "Demo Rental Agency",
      slug: "demo",
      phone: "+1-555-0100",
      email: "info@demorental.com",
      address: "123 Main Street, New York, NY 10001",
      currency: "DZD",
    },
  });
  console.log(`Agency created: ${agency.name}`);

  const hashedPassword = await bcrypt.hash("password123", 12);
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@demo.com",
      password: hashedPassword,
      role: "admin",
      agencyId: agency.id,
    },
  });
  console.log(`Admin user created: ${adminUser.email}`);

  const vehiclesData = [
    { brand: "Toyota", model: "Camry", year: 2024, color: "White", licensePlate: "ABC-1234", vin: "1HGCM82633A004352", category: "sedan", transmission: "automatic", fuelType: "gasoline", seats: 5, doors: 4, dailyRate: 65, weeklyRate: 390, monthlyRate: 1400, mileageLimit: 200, status: "available" },
    { brand: "Honda", model: "Civic", year: 2024, color: "Blue", licensePlate: "DEF-5678", vin: "2HGFG3B53GH550001", category: "sedan", transmission: "automatic", fuelType: "gasoline", seats: 5, doors: 4, dailyRate: 55, weeklyRate: 330, monthlyRate: 1200, mileageLimit: 200, status: "available" },
    { brand: "Ford", model: "Explorer", year: 2023, color: "Black", licensePlate: "GHI-9012", vin: "1FM5K7D84JGA00001", category: "suv", transmission: "automatic", fuelType: "gasoline", seats: 7, doors: 4, dailyRate: 95, weeklyRate: 570, monthlyRate: 2100, mileageLimit: 250, status: "booked" },
    { brand: "Nissan", model: "Altima", year: 2024, color: "Silver", licensePlate: "JKL-3456", vin: "1N4AL3AP2JC000001", category: "sedan", transmission: "automatic", fuelType: "gasoline", seats: 5, doors: 4, dailyRate: 60, weeklyRate: 360, monthlyRate: 1300, mileageLimit: 200, status: "available" },
    { brand: "Chevrolet", model: "Tahoe", year: 2023, color: "Red", licensePlate: "MNO-7890", vin: "1GNSKKE00AR000001", category: "suv", transmission: "automatic", fuelType: "gasoline", seats: 8, doors: 4, dailyRate: 110, weeklyRate: 660, monthlyRate: 2500, depositAmount: 500, mileageLimit: 300, status: "available" },
  ];

  const vehicles = [];
  for (const v of vehiclesData) {
    const vehicle = await prisma.vehicle.upsert({
      where: { agencyId_licensePlate: { agencyId: agency.id, licensePlate: v.licensePlate } },
      update: { ...v },
      create: { ...v, agencyId: agency.id },
    });
    vehicles.push(vehicle);
  }
  console.log(`${vehicles.length} vehicles created`);

  const clientsData = [
    { firstName: "John", lastName: "Doe", email: "john.doe@email.com", phone: "+1-555-1001", whatsapp: "+15551001", address: "456 Oak Avenue", city: "New York", country: "USA", licenseNumber: "NY-1234567", licenseExpiry: new Date("2027-05-15"), idNumber: "ID-987654" },
    { firstName: "Jane", lastName: "Smith", email: "jane.smith@email.com", phone: "+1-555-1002", whatsapp: "+15551002", address: "789 Pine Road", city: "Brooklyn", country: "USA", licenseNumber: "NY-2345678", licenseExpiry: new Date("2026-11-20"), idNumber: "ID-876543" },
    { firstName: "Robert", lastName: "Johnson", email: "robert.j@email.com", phone: "+1-555-1003", whatsapp: "+15551003", address: "321 Elm Street", city: "Manhattan", country: "USA", licenseNumber: "NY-3456789", licenseExpiry: new Date("2025-09-10"), idNumber: "ID-765432" },
  ];

  const clients = [];
  for (const c of clientsData) {
    const client = await prisma.client.create({
      data: { ...c, agencyId: agency.id },
    });
    clients.push(client);
  }
  console.log(`${clients.length} clients created`);

  const now = new Date();

  const activePickup = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const activeReturn = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  const upcomingPickup = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const upcomingReturn = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const activeBooking = await prisma.booking.create({
    data: {
      status: "active",
      pickupDate: activePickup,
      returnDate: activeReturn,
      pickupLocation: agency.address || "123 Main Street",
      returnLocation: agency.address || "123 Main Street",
      totalAmount: 7 * 95,
      depositAmount: 200,
      depositPaid: true,
      fullyPaid: false,
      agencyId: agency.id,
      vehicleId: vehicles[2].id,
      clientId: clients[0].id,
      userId: adminUser.id,
    },
  });
  console.log(`Active booking created: ${activeBooking.id}`);

  const upcomingBooking = await prisma.booking.create({
    data: {
      status: "confirmed",
      pickupDate: upcomingPickup,
      returnDate: upcomingReturn,
      pickupLocation: agency.address || "123 Main Street",
      returnLocation: agency.address || "123 Main Street",
      totalAmount: 4 * 65,
      depositAmount: 150,
      depositPaid: true,
      fullyPaid: false,
      agencyId: agency.id,
      vehicleId: vehicles[0].id,
      clientId: clients[1].id,
      userId: adminUser.id,
    },
  });
  console.log(`Upcoming booking created: ${upcomingBooking.id}`);

  const contract = await prisma.contract.create({
    data: {
      contractNumber: "CR-2026-DEMO01",
      status: "signed",
      content: JSON.stringify({
        terms: "Standard rental terms apply.",
        vehicle: `${vehicles[2].brand} ${vehicles[2].model} (${vehicles[2].licensePlate})`,
        client: `${clients[0].firstName} ${clients[0].lastName}`,
        pickupDate: activePickup.toISOString(),
        returnDate: activeReturn.toISOString(),
        dailyRate: vehicles[2].dailyRate,
        totalAmount: 7 * 95,
        depositAmount: 200,
      }),
      pickupOdometer: 15000,
      fuelLevel: "full",
      signedByClient: true,
      signedByAgency: true,
      signedAt: activePickup,
      agencyId: agency.id,
      bookingId: activeBooking.id,
      clientId: clients[0].id,
      userId: adminUser.id,
    },
  });
  console.log(`Contract created: ${contract.contractNumber}`);

  const payment = await prisma.payment.create({
    data: {
      amount: 200,
      method: "credit_card",
      type: "deposit",
      status: "paid",
      reference: "PAY-DEMO-001",
      notes: "Initial deposit for active booking",
      paidAt: activePickup,
      agencyId: agency.id,
      bookingId: activeBooking.id,
      userId: adminUser.id,
    },
  });
  console.log(`Payment created: ${payment.id}`);

  await prisma.llmConfig.create({
    data: {
      provider: "openai",
      apiKey: "",
      model: "gpt-4",
      active: true,
      agencyId: agency.id,
    },
  });
  console.log("Default LLM config created");

  await prisma.wassenderConfig.create({
    data: {
      apiKey: "",
      sessionId: "",
      active: false,
      agencyId: agency.id,
    },
  });
  console.log("Default Wassender config created");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
