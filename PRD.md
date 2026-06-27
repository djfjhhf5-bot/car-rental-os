# Car Rental OS - Product Requirements Document

## Overview
An all-in-one car rental operating system that centralizes reservations, fleet management, client management, contracts, payments, maintenance, and AI-powered guidance in a single platform. Designed for independent rental agencies to replace scattered Excel files, paper, and WhatsApp chats.

## Core Philosophy
- **User-friendly**: A baby can understand and use it
- **Guided**: Step-by-step walkthrough from section to section
- **Data-driven**: AI provides summaries and helps make decisions
- **Flexible**: Configurable LLM, swappable AI models, editable fields
- **Self-hosted**: Sold per agency, owned forever (not SaaS)

## Target Users
- Car rental agency owners and operators
- Rental agents handling daily operations
- Small to medium rental fleets (5-200 vehicles)

## Key Features

### 1. Fleet Management
- CRUD for vehicles with images, specs, documents
- Real-time availability status (available/booked/maintenance)
- License plate, VIN, insurance tracking
- Fuel type, transmission, seats, doors, etc.

### 2. Client Management
- Customer profiles with contact details
- License/ID document upload and verification
- Rental history per client
- WhatsApp contact integration

### 3. Reservations & Bookings
- Calendar-based availability view
- Create/modify/cancel bookings
- Automated conflict detection
- Status workflow: inquiry → confirmed → active → completed → cancelled

### 4. Contracts
- Auto-generated rental contracts
- Pickup and return checklists
- Damage and mileage logging
- Digital signature support
- Contract templates (editable)

### 5. Payments
- Deposit tracking
- Payment milestones (booking deposit, full payment, refunds)
- Multiple payment methods tracking
- Outstanding balance alerts

### 6. Maintenance
- Service scheduling and history
- Maintenance alerts and reminders
- Mileage-based service intervals
- Cost tracking per vehicle

### 7. WhatsApp Integration (Wassender API)
- Automated booking confirmations
- Payment reminders
- Contract sharing via WhatsApp
- Two-way communication
- AI-powered lead response

### 8. AI Chat & Guidance (#1 Priority)
- Chat interface for agency staff
- Data-aware: answers based on actual fleet/booking data
- Sales framework-based lead closing (feedough.com frameworks)
- App usage guidance
- Business decision support
- Configurable LLM (OpenAI, Anthropic, local, etc.)

### 9. Dashboard & Analytics
- Real-time fleet overview
- Utilization rates
- Revenue tracking
- Booking pipeline
- AI-generated summaries

### 10. Settings & Configuration
- Agency branding (name, logo, colors)
- LLM configuration
- WhatsApp integration setup
- User management
- Contract templates

## Non-Goals
- Online customer-facing booking portal (Phase 2)
- Payment gateway integration (Phase 2)
- Mobile apps (Phase 2)
- Multi-language support (Phase 2)
- Advanced accounting/ERP integration (Phase 2)
- GPS tracking integration (Phase 2)
- Automated billing/invoicing (Phase 2)
- Customer loyalty program (Phase 2)

## Technical Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions, Prisma ORM
- **Database**: SQLite (via Prisma)
- **Auth**: NextAuth.js v5 (Auth.js)
- **UI**: Custom components with Radix UI primitives
- **Charts**: Recharts
- **Validation**: Zod
- **AI**: Configurable LLM API (OpenAI, Anthropic, etc.)
- **WhatsApp**: Wassender REST API

## Security Requirements
- Password hashing with bcrypt
- CSRF protection via Server Actions
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS protection via React escaping
- Session management via NextAuth.js
- Environment variable based secrets
- Rate limiting on auth endpoints
- No client-side secrets exposure

## Performance Requirements
- SQLite with proper indexing for fast queries
- React Server Components for minimal JS
- Optimistic UI updates for mutations
- Debounced search inputs
- Lazy loading for images
- Efficient pagination
