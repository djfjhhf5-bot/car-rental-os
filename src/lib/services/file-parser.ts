export interface ParsedLead {
  customerName: string;
  phone?: string;
  whatsapp?: string;
  vehicleRequested?: string;
  pickupDate?: string;
  returnDate?: string;
  pickupLocation?: string;
  returnLocation?: string;
  totalAmount?: number;
  depositAmount?: number;
  contractNumber?: string;
  insuranceType?: string;
  driverLicenseNumber?: string;
  nationality?: string;
  email?: string;
  notes?: string;
}

export interface ParseResult {
  leads: ParsedLead[];
  errors: string[];
  fileName: string;
  fileType: string;
}

function extractPhone(text: string): string | undefined {
  const phoneRegex = /(?:\+|\b00)?(?:213|0)[5-7]\d{8}/g;
  const match = text.match(phoneRegex);
  return match?.[0];
}

function extractEmail(text: string): string | undefined {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const match = text.match(emailRegex);
  return match?.[0];
}

function extractAmount(text: string): number | undefined {
  const amountRegex = /(?:DZD|DA|دج|€|\$)?\s*(\d+(?:[.,]\d{3})*(?:\.\d{1,2})?)\s*(?:DZD|DA|دج|€|\$)?/gi;
  const matches = [...text.matchAll(amountRegex)];
  for (const m of matches) {
    const num = parseFloat(m[1].replace(/[.,]/g, ""));
    if (num > 100) return num;
  }
  return undefined;
}

function extractDate(text: string): string | undefined {
  const dateRegex = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g;
  const match = dateRegex.exec(text);
  if (match) {
    const d = match[3].length === 2 ? `20${match[3]}` : match[3];
    return `${d}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  return undefined;
}

function parseWhatsAppExport(text: string): ParsedLead[] {
  const leads: ParsedLead[] = [];
  const blocks = text.split(/(?=\d{1,2}\/\d{1,2}\/\d{2,4})/).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const fullText = block;

    const nameMatch = fullText.match(/^[^:]+/m);
    const msgMatch = fullText.match(/:?\s*(.+)$/m);

    const customerName = nameMatch?.[0]?.replace(/^\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}\s*(?:AM|PM)?\s*-\s*/, "").trim() || "Unknown";
    const messageText = msgMatch?.[1] || fullText;

    leads.push({
      customerName,
      phone: extractPhone(fullText),
      vehicleRequested: extractVehicleRequest(messageText),
      pickupDate: extractDate(messageText),
      notes: messageText.slice(0, 200),
    });
  }

  return leads;
}

function parseCSV(text: string): ParsedLead[] {
  const leads: ParsedLead[] = [];
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return leads;

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["']/g, ""));
  const dataLines = lines.slice(1);

  for (const line of dataLines) {
    const values = line.split(",").map(v => v.trim().replace(/["']/g, ""));
    const entry: Record<string, string> = {};
    headers.forEach((h, i) => { entry[h] = values[i] || ""; });

    leads.push({
      customerName: entry["customer_name"] || entry["name"] || entry["customer name"] || "Unknown",
      phone: entry["phone"] || entry["mobile"] || entry["telephone"],
      whatsapp: entry["whatsapp"] || entry["whatsapp number"],
      email: entry["email"],
      vehicleRequested: entry["vehicle_requested"] || entry["vehicle"] || entry["car"],
      pickupDate: entry["pickup_date"] || entry["pickup date"] || entry["start date"],
      returnDate: entry["return_date"] || entry["return date"] || entry["end date"],
      pickupLocation: entry["pickup_location"] || entry["pickup location"],
      returnLocation: entry["return_location"] || entry["return location"],
      totalAmount: parseFloat(entry["total_amount"] || entry["amount"] || entry["total"]) || undefined,
      depositAmount: parseFloat(entry["deposit_amount"] || entry["deposit"]) || undefined,
      contractNumber: entry["contract_number"] || entry["contract"],
      insuranceType: entry["insurance_type"] || entry["insurance"],
      driverLicenseNumber: entry["driver_license_number"] || entry["license"],
      nationality: entry["nationality"],
      notes: entry["notes"] || entry["remarks"],
    });
  }

  return leads;
}

function extractVehicleRequest(text: string): string | undefined {
  const vehicleKeywords = /\b(Toyota|Honda|Hyundai|Renault|Mercedes|BMW|Audi|Ford|Nissan|Kia|Peugeot|Citroen|Fiat|Volkswagen|Chevrolet|Dacia)\s+\w+/i;
  const match = text.match(vehicleKeywords);
  return match?.[0];
}

export async function parseFile(content: string, fileName: string): Promise<ParseResult> {
  const errors: string[] = [];
  const ext = fileName.split(".").pop()?.toLowerCase();
  const fileType = ext === "csv" ? "csv" : ext === "txt" ? "whatsapp" : "contract";

  let leads: ParsedLead[] = [];

  try {
    if (fileType === "csv") {
      leads = parseCSV(content);
    } else if (fileType === "whatsapp") {
      leads = parseWhatsAppExport(content);
    } else {
      leads = [{
        customerName: "Extracted from contract",
        notes: content.slice(0, 500),
      }];
    }
  } catch (e) {
    errors.push(`Failed to parse file: ${e instanceof Error ? e.message : "Unknown error"}`);
  }

  if (leads.length === 0) {
    errors.push("No leads could be extracted from the file");
  }

  return { leads, errors, fileName, fileType };
}
