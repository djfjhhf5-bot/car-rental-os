"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, FileText, AlertCircle, CheckCircle, Download } from "lucide-react";
import { importLeadsFromFile } from "@/lib/actions/lead-actions";
import { useToast } from "@/components/ui/toast";

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors?: string[];
}

export function LeadImportDialog({ onImportComplete }: { onImportComplete?: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (!["csv", "txt"].includes(ext || "")) {
        toast({ title: "Invalid file", description: "Please upload a .csv or .txt file", variant: "destructive" });
        return;
      }
      setFile(f);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);

    const res = await importLeadsFromFile(fd);
    setImporting(false);

    if (res.success && res.data) {
      setResult(res.data);
      toast({ title: "Import complete", description: `${res.data.imported} leads imported, ${res.data.skipped} skipped`, variant: "success" });
      onImportComplete?.();
    } else {
      toast({ title: "Import failed", description: res.error || "Unknown error", variant: "destructive" });
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Import Leads
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Leads from File</DialogTitle>
          <DialogDescription>
            Upload a WhatsApp export (.txt) or CSV file to import leads
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input id="file" ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileChange} />
          </div>

          {file && !result && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <div className="space-y-3">
              <Card className={result.imported > 0 ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    {result.imported > 0 ? <CheckCircle className="h-8 w-8 text-green-600" /> : <AlertCircle className="h-8 w-8 text-amber-600" />}
                    <div>
                      <p className="text-sm font-medium">Import Results</p>
                      <p className="text-xs text-muted-foreground">
                        {result.total} total · {result.imported} imported · {result.skipped} skipped
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {result.errors && result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg border p-3">
                  <p className="text-xs font-medium text-destructive mb-1">Errors:</p>
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-muted-foreground">• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <Separator />

          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium mb-2">Accepted formats:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>📄 <strong>CSV</strong> — columns: customer_name, phone, whatsapp, email, vehicle_requested, pickup_date, return_date, total_amount, deposit_amount, notes</p>
              <p>💬 <strong>WhatsApp export (.txt)</strong> — exported chat with customers</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {result ? (
            <Button onClick={() => { setOpen(false); reset(); }}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleImport} disabled={!file || importing}>
                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {importing ? "Importing..." : "Import"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
