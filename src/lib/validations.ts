import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const vehicleSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().int().min(2000).max(2030),
  color: z.string().optional(),
  licensePlate: z.string().min(1, "License plate is required"),
  vin: z.string().optional(),
  category: z.string().default("standard"),
  transmission: z.string().default("automatic"),
  fuelType: z.string().default("gasoline"),
  seats: z.coerce.number().int().min(1).max(20).default(5),
  doors: z.coerce.number().int().min(1).max(10).default(4),
  dailyRate: z.coerce.number().min(0).default(0),
  weeklyRate: z.coerce.number().min(0).optional(),
  monthlyRate: z.coerce.number().min(0).optional(),
  depositAmount: z.coerce.number().min(0).default(0),
  mileageLimit: z.coerce.number().int().min(0).optional(),
  mileageUnit: z.string().default("km"),
  location: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  registrationExpiry: z.string().optional(),
  serviceInterval: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
  published: z.boolean().optional(),
});

export const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  idNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const bookingSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  clientId: z.string().min(1, "Client is required"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  returnDate: z.string().min(1, "Return date is required"),
  pickupLocation: z.string().optional(),
  returnLocation: z.string().optional(),
  totalAmount: z.coerce.number().min(0).default(0),
  depositAmount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export const paymentSchema = z.object({
  bookingId: z.string().min(1, "Booking is required"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  method: z.string().default("cash"),
  type: z.string().default("deposit"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().optional(),
});

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  type: z.string().default("service"),
  description: z.string().optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional(),
  mileage: z.coerce.number().int().min(0).optional(),
  cost: z.coerce.number().min(0).optional(),
  provider: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("pending"),
});

export const agencySchema = z.object({
  name: z.string().min(1, "Agency name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  currency: z.string().default("DZD"),
  timezone: z.string().default("America/New_York"),
  primaryColor: z.string().default("#2563eb"),
  secondaryColor: z.string().default("#1e40af"),
});

export const llmConfigSchema = z.object({
  provider: z.string().default("openai"),
  apiKey: z.string().optional(),
  model: z.string().default("gpt-4"),
  apiUrl: z.string().optional(),
});

export const wassenderConfigSchema = z.object({
  apiKey: z.string().optional(),
  sessionId: z.string().optional(),
  webhookSecret: z.string().optional(),
  active: z.boolean().default(false),
});
