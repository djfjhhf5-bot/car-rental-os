"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserSession } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadImportDialog } from "@/components/leads/lead-import-dialog";
import { getLeads, deleteLead, updateLeadPhase, sendLeadDm, convertLeadToClient, getWasenderConfig } from "@/lib/actions/lead-actions";
import { Loader2, Users, Trash2, Send, UserPlus, ArrowUpRight, MessageSquare, Download } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const PHASES = [
  { value: "inquiry", label: "Inquiry", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "quoted", label: "Quoted", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "follow-up", label: "Follow-up", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "booked", label: "Booked", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { value: "client", label: "Client", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "returned", label: "Returned", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
];

type LeadData = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  phase: string;
  source: string;
  vehicleRequested: string | null;
  notes: string | null;
  createdAt: Date;
};

export function LeadsPageClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: sessionLoading } = useUserSession();
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [wasenderOk, setWasenderOk] = useState(false);
  const [sendingDm, setSendingDm] = useState<string | null>(null);
  const [converting, setConverting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [leadsRes, wasenderRes] = await Promise.all([
      getLeads(),
      getWasenderConfig(),
    ]);
    if (leadsRes.success && leadsRes.data) setLeads(leadsRes.data as LeadData[]);
    if (wasenderRes.success && wasenderRes.data) setWasenderOk(wasenderRes.data.configured && wasenderRes.data.active);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!sessionLoading && !user) router.push("/login");
    if (user) load();
  }, [user, sessionLoading, router, load]);

  const filtered = leads.filter((l) => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search) || l.whatsapp?.includes(search);
    const matchPhase = phaseFilter === "all" || l.phase === phaseFilter;
    return matchSearch && matchPhase;
  });

  const handleDelete = async (id: string) => {
    const res = await deleteLead(id);
    if (res.success) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Deleted", description: "Lead removed", variant: "success" });
    } else {
      toast({ title: "Error", description: res.error || "Failed to delete", variant: "destructive" });
    }
  };

  const handlePhaseChange = async (id: string, phase: string) => {
    const res = await updateLeadPhase(id, phase);
    if (res.success) {
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, phase } : l));
      toast({ title: "Updated", description: `Phase changed to ${phase}`, variant: "success" });
    }
  };

  const handleSendDm = async (id: string) => {
    setSendingDm(id);
    const res = await sendLeadDm(id);
    setSendingDm(null);
    if (res.success) {
      toast({ title: "DM sent", description: "WhatsApp message sent to lead", variant: "success" });
    } else {
      toast({ title: "Failed", description: res.error || "Could not send message", variant: "destructive" });
    }
  };

  const handleConvert = async (id: string) => {
    setConverting(id);
    const res = await convertLeadToClient(id);
    setConverting(null);
    if (res.success) {
      toast({ title: "Converted", description: "Lead converted to client", variant: "success" });
      load();
    } else {
      toast({ title: "Error", description: res.error || "Failed to convert", variant: "destructive" });
    }
  };

  if (sessionLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Import and manage your leads</p>
        </div>
        <LeadImportDialog onImportComplete={load} />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All phases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All phases</SelectItem>
            {PHASES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium">No leads yet</p>
            <p className="text-sm text-muted-foreground mb-4">Import leads from a CSV or WhatsApp export file</p>
            <LeadImportDialog onImportComplete={load} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <Card key={lead.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{lead.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${PHASES.find(p => p.value === lead.phase)?.color || ""}`}>
                        {PHASES.find(p => p.value === lead.phase)?.label || lead.phase}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {(lead.phone || lead.whatsapp) && <span>📞 {lead.whatsapp || lead.phone}</span>}
                      {lead.vehicleRequested && <span>🚗 {lead.vehicleRequested}</span>}
                      {lead.source && <span>📌 {lead.source}</span>}
                      <span>🕐 {new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                    {lead.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{lead.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Select value={lead.phase} onValueChange={(v) => handlePhaseChange(lead.id, v)}>
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PHASES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSendDm(lead.id)} disabled={sendingDm === lead.id || !wasenderOk} title={!wasenderOk ? "Configure WhatsApp in Settings" : "Send WhatsApp DM"}>
                      {sendingDm === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                    {lead.phase !== "client" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleConvert(lead.id)} disabled={converting === lead.id} title="Convert to client">
                        {converting === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(lead.id)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!wasenderOk && leads.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <MessageSquare className="mr-2 inline h-4 w-4" />
                Configure WhatsApp in Settings to send automated DMs to leads
              </p>
              <Button variant="outline" size="sm" onClick={() => router.push("/settings")}>
                <ArrowUpRight className="mr-1 h-3 w-3" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
