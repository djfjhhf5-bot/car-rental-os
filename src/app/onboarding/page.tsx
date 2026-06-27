"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserSession } from "@/components/providers";
import { getOnboardingStatus, saveAgencyProfile, saveFirstVehicle, skipVehicle, completeOnboarding } from "@/lib/actions/onboarding-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Building, Car, Sparkles, CheckCircle, ArrowRight, SkipForward, Users, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid",
  "Asia/Dubai", "Asia/Riyadh", "Asia/Qatar", "Asia/Kolkata",
  "Africa/Cairo", "Africa/Casablanca", "Africa/Johannesburg",
  "Australia/Sydney", "Pacific/Auckland",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refresh } = useUserSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const status = await getOnboardingStatus();
      if (!status) {
        router.push("/login");
        return;
      }
      if (status.completed) {
        router.push("/");
        return;
      }
      setStep(status.step);
      setLoading(false);
    }
    init();
  }, [router]);

  const steps = [
    { id: 0, title: "Agency Profile", icon: Building },
    { id: 1, title: "First Vehicle", icon: Car },
    { id: 2, title: "AI Assistant", icon: Sparkles },
    { id: 3, title: "Done", icon: CheckCircle },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-4">
            <Progress value={((step) / 3) * 100} className="h-2" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            {steps.map((s) => (
              <div key={s.id} className={`flex items-center gap-1 ${s.id <= step ? "text-primary" : ""}`}>
                <s.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{s.title}</span>
                {s.id < steps.length - 1 && <span className="mx-1">→</span>}
              </div>
            ))}
          </div>
          <CardTitle className="text-2xl">
            {step === 0 && "Set Up Your Agency"}
            {step === 1 && "Add Your First Vehicle"}
            {step === 2 && "Meet Your AI Assistant"}
            {step === 3 && "You're All Set!"}
          </CardTitle>
          <CardDescription>
            {step === 0 && "Tell us about your car rental business"}
            {step === 1 && "Add your first car or skip for now"}
            {step === 2 && "Discover how AI can help you grow"}
            {step === 3 && "Let's start managing your fleet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && <StepAgencyProfile onNext={async (data) => { setSaving(true); const r = await saveAgencyProfile(data); setSaving(false); if (r.success) setStep(1); else toast({ variant: "destructive", title: "Error", description: r.error }); }} saving={saving} />}
          {step === 1 && <StepFirstVehicle onNext={async (data) => { setSaving(true); const r = await saveFirstVehicle(data); setSaving(false); if (r.success) setStep(2); else toast({ variant: "destructive", title: "Error", description: r.error }); }} onSkip={async () => { setSaving(true); await skipVehicle(); setSaving(false); setStep(2); }} saving={saving} />}
          {step === 2 && <StepAIIntro onNext={async () => { setSaving(true); const r = await completeOnboarding(); setSaving(false); if (r.success) { await refresh(); setStep(3); } else toast({ variant: "destructive", title: "Error", description: r.error }); }} saving={saving} />}
          {step === 3 && <StepDone onNext={() => router.push("/")} />}
        </CardContent>
      </Card>
    </div>
  );
}

const CHALLENGES = [
  "Finding customers", "Managing bookings", "Vehicle maintenance",
  "Pricing optimization", "Paperwork & contracts", "Customer communication",
  "Fleet utilization",
];

const SOFTWARE_OPTIONS = [
  "None / pen & paper", "Excel / Google Sheets", "Another rental software",
  "WhatsApp / phone only", "Custom solution",
];

const REFERRAL_SOURCES = [
  "Google search", "Social media", "Friend / colleague",
  "Online ad", "Article / blog post",
];

function CheckboxGroup({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox checked={selected.includes(opt)} onCheckedChange={() => onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])} />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

function StepAgencyProfile({ onNext, saving }: { onNext: (d: { name: string; phone: string; address: string; timezone: string; fleetSize?: number; yearsInBusiness?: number; biggestChallenge?: string; currentSoftware?: string; referralSource?: string; monthlyBookings?: number }) => void; saving: boolean }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("Africa/Algiers");
  const [fleetSize, setFleetSize] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [monthlyBookings, setMonthlyBookings] = useState("");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [challengeOther, setChallengeOther] = useState("");
  const [software, setSoftware] = useState<string[]>([]);
  const [softwareOther, setSoftwareOther] = useState("");
  const [referrals, setReferrals] = useState<string[]>([]);
  const [referralOther, setReferralOther] = useState("");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Agency Name *</Label>
        <Input id="name" placeholder="My Car Rental Agency" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" placeholder="+213 555-000-000" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" placeholder="123 Main St, Algiers" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Tell us about your business</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fleetSize">Fleet Size (vehicles)</Label>
            <Input id="fleetSize" type="number" placeholder="5" value={fleetSize} onChange={(e) => setFleetSize(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsInBusiness">Years in Business</Label>
            <Input id="yearsInBusiness" type="number" placeholder="3" value={yearsInBusiness} onChange={(e) => setYearsInBusiness(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="monthlyBookings">Monthly Bookings (approx.)</Label>
          <Input id="monthlyBookings" type="number" placeholder="20" value={monthlyBookings} onChange={(e) => setMonthlyBookings(e.target.value)} />
        </div>

        <div className="mt-5 space-y-4">
          <CheckboxGroup label="Biggest Challenges (check all that apply)" options={CHALLENGES} selected={challenges} onChange={setChallenges} />
          <div className="space-y-1">
            <Label htmlFor="challengeOther" className="text-xs text-muted-foreground">Other challenge (describe)</Label>
            <Input id="challengeOther" placeholder="e.g. Insurance issues, staffing..." value={challengeOther} onChange={(e) => setChallengeOther(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <CheckboxGroup label="Current Software (check all that apply)" options={SOFTWARE_OPTIONS} selected={software} onChange={setSoftware} />
          <div className="space-y-1">
            <Label htmlFor="softwareOther" className="text-xs text-muted-foreground">Other software (describe)</Label>
            <Input id="softwareOther" placeholder="e.g. Salesforce, custom ERP..." value={softwareOther} onChange={(e) => setSoftwareOther(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <CheckboxGroup label="How did you find us? (check all that apply)" options={REFERRAL_SOURCES} selected={referrals} onChange={setReferrals} />
          <div className="space-y-1">
            <Label htmlFor="referralOther" className="text-xs text-muted-foreground">Other (describe)</Label>
            <Input id="referralOther" placeholder="e.g. Referral from a friend, conference..." value={referralOther} onChange={(e) => setReferralOther(e.target.value)} />
          </div>
        </div>
      </div>

      <Button className="w-full" onClick={() => onNext({
        name, phone, address, timezone,
        fleetSize: fleetSize ? parseInt(fleetSize) : undefined,
        yearsInBusiness: yearsInBusiness ? parseInt(yearsInBusiness) : undefined,
        monthlyBookings: monthlyBookings ? parseInt(monthlyBookings) : undefined,
        biggestChallenge: [...challenges, ...(challengeOther ? [`Other: ${challengeOther}`] : [])].join(", ") || undefined,
        currentSoftware: [...software, ...(softwareOther ? [`Other: ${softwareOther}`] : [])].join(", ") || undefined,
        referralSource: [...referrals, ...(referralOther ? [`Other: ${referralOther}`] : [])].join(", ") || undefined,
      })} disabled={!name || saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
        Continue
      </Button>
    </div>
  );
}

function StepFirstVehicle({ onNext, onSkip, saving }: { onNext: (d: { brand: string; model: string; year: number; licensePlate: string; dailyRate: number }) => void; onSkip: () => void; saving: boolean }) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [licensePlate, setLicensePlate] = useState("");
  const [dailyRate, setDailyRate] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand">Brand *</Label>
          <Input id="brand" placeholder="Toyota" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model *</Label>
          <Input id="model" placeholder="Camry" value={model} onChange={(e) => setModel(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Year *</Label>
          <Input id="year" placeholder="2025" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="plate">License Plate *</Label>
          <Input id="plate" placeholder="ABC-1234" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="rate">Daily Rate (DZD) *</Label>
        <Input id="rate" type="number" placeholder="50" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
      </div>
      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => onNext({ brand, model, year: parseInt(year), licensePlate, dailyRate: parseFloat(dailyRate) })} disabled={!brand || !model || !year || !licensePlate || !dailyRate || saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
          Add Vehicle
        </Button>
        <Button variant="outline" onClick={onSkip} disabled={saving}>
          <SkipForward className="mr-2 h-4 w-4" />
          Skip
        </Button>
      </div>
    </div>
  );
}

function StepAIIntro({ onNext, saving }: { onNext: () => void; saving: boolean }) {
  return (
    <div className="space-y-6 text-center">
      <div className="rounded-full bg-primary/10 p-4 mx-auto w-fit">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
        <p className="text-sm text-muted-foreground">
          Your AI assistant helps you optimize pricing, predict maintenance, 
          analyze customer trends, and automate responses — all from your dashboard.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-left">
        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">Smart Pricing</p>
          <p className="text-xs text-muted-foreground">Optimize rates based on demand</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">Lead Chatbot</p>
          <p className="text-xs text-muted-foreground">Convert visitors 24/7</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">Predictive Maint.</p>
          <p className="text-xs text-muted-foreground">Reduce downtime</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">WhatsApp Auto</p>
          <p className="text-xs text-muted-foreground">Automate communications</p>
        </div>
      </div>
      <Button className="w-full" onClick={onNext} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
        Start Using CarRental OS
      </Button>
    </div>
  );
}

function StepDone({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="rounded-full bg-green-100 p-4 mx-auto w-fit">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Your Agency Is Ready!</h3>
        <p className="text-sm text-muted-foreground">
          You can now manage your fleet, track bookings, and leverage AI insights.
        </p>
      </div>
      <Button className="w-full" onClick={onNext}>
        <ArrowRight className="mr-2 h-4 w-4" />
        Go to Dashboard
      </Button>
    </div>
  );
}
