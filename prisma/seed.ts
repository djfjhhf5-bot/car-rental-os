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
      onboardingCompleted: true,
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
    { brand: "Renault", model: "Clio 4", year: 2023, color: "White", licensePlate: "ABC-1234", vin: "1HGCM82633A004352", category: "economy", transmission: "manual", fuelType: "gasoline", seats: 5, doors: 4, dailyRate: 4000, weeklyRate: 24000, monthlyRate: 90000, depositAmount: 15000, mileageLimit: 200, status: "available", imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80", published: true },
    { brand: "Renault", model: "Symbol", year: 2023, color: "Blue", licensePlate: "DEF-5678", vin: "2HGFG3B53GH550001", category: "economy", transmission: "manual", fuelType: "gasoline", seats: 5, doors: 4, dailyRate: 3500, weeklyRate: 21000, monthlyRate: 75000, depositAmount: 12000, mileageLimit: 200, status: "available", imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80", published: true },
    { brand: "Toyota", model: "Camry", year: 2024, color: "White", licensePlate: "GHI-9012", vin: "1FM5K7D84JGA00001", category: "sedan", transmission: "automatic", fuelType: "gasoline", seats: 5, doors: 4, dailyRate: 7000, weeklyRate: 42000, monthlyRate: 150000, depositAmount: 25000, mileageLimit: 250, status: "available", imageUrl: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80", published: true },
    { brand: "Honda", model: "Civic", year: 2024, color: "Silver", licensePlate: "JKL-3456", vin: "1N4AL3AP2JC000001", category: "sedan", transmission: "automatic", fuelType: "gasoline", seats: 5, doors: 4, dailyRate: 6000, weeklyRate: 36000, monthlyRate: 130000, mileageLimit: 200, status: "available", imageUrl: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80", published: true },
    { brand: "Ford", model: "Explorer", year: 2023, color: "Black", licensePlate: "MNO-7890", vin: "1GNSKKE00AR000001", category: "suv", transmission: "automatic", fuelType: "gasoline", seats: 7, doors: 4, dailyRate: 12000, weeklyRate: 72000, monthlyRate: 250000, depositAmount: 50000, mileageLimit: 300, status: "booked", imageUrl: "https://images.unsplash.com/photo-1469285994282-454ceb49e63c?w=800&q=80", published: true },
    { brand: "Mercedes", model: "Classe C", year: 2024, color: "Black", licensePlate: "PQR-1234", vin: "WDD2050421R000001", category: "luxury", transmission: "automatic", fuelType: "diesel", seats: 5, doors: 4, dailyRate: 18000, weeklyRate: 108000, monthlyRate: 400000, depositAmount: 80000, mileageLimit: 250, status: "available", imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80", published: true },
    { brand: "Hyundai", model: "Tucson", year: 2024, color: "White", licensePlate: "STU-5678", vin: "KM8J3CA46J0000001", category: "suv", transmission: "automatic", fuelType: "diesel", seats: 5, doors: 4, dailyRate: 10000, weeklyRate: 60000, monthlyRate: 220000, depositAmount: 35000, mileageLimit: 250, status: "available", imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80", published: true },
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
      provider: "custom",
      apiKey: "sk-or-v1-placeholder-replace-with-real-key",
      apiUrl: "https://openrouter.ai/api/v1/chat/completions",
      model: "openai/gpt-4o",
      active: true,
      agencyId: agency.id,
    },
  });
  console.log("Default LLM config created (OpenRouter)");

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
