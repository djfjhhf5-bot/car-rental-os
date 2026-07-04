"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getClients, deleteClient } from "@/lib/actions/client-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/language-context";
import { t } from "@/lib/i18n/translations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Mail,
  Phone,
  User,
  Edit,
  Trash2,
  Users,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

function ClientsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const search = searchParams.get("search") || "";

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getClients(search);
      if (result.data) {
        setClients(result.data);
      } else {
        setError(result.error ?? t("clients.loadError", lang));
      }
    } catch {
      setError(t("clients.loadError", lang));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteClient(deleteId);
    setDeleting(false);
    if (result.success) {
      toast({ title: t("clients.deleted", lang), description: t("clients.deletedDesc", lang), variant: "success" as const });
      setDeleteId(null);
      loadClients();
    } else {
      toast({ title: "Error", description: result.error || "Failed to delete", variant: "destructive" as const });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("clients.title", lang)}</h1>
          <p className="text-sm text-muted-foreground">
            {t("clients.subtitle", lang)}
          </p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            {t("clients.addClient", lang)}
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                defaultValue={search}
                placeholder={t("common.searchByNameEmail", lang)}
                className="pl-10"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">{t("clients.name", lang)}</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">{t("clients.phone", lang)}</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">{t("clients.email", lang)}</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">{t("clients.license", lang)}</th>
                    <th className="text-center text-sm font-medium text-muted-foreground px-6 py-4">{t("clients.bookings", lang)}</th>
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">{t("common.actions", lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-full bg-destructive/10 mb-4">
            <Users className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t("clients.errorTitle", lang)}</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={loadClients}>{t("common.tryAgain", lang)}</Button>
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {search ? t("clients.noResults", lang) : t("clients.noClients", lang)}
          </h2>
          <p className="text-muted-foreground mb-6">
            {search
              ? t("clients.noResultsDesc", lang)
              : t("clients.noClientsDesc", lang)}
          </p>
          {!search && (
            <Button asChild>
              <Link href="/clients/new">
                <Plus className="h-4 w-4 mr-2" />
                {t("clients.addClient", lang)}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      {t("clients.name", lang)}
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      {t("clients.phone", lang)}
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      {t("clients.email", lang)}
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      {t("clients.license", lang)}
                    </th>
                    <th className="text-center text-sm font-medium text-muted-foreground px-6 py-4">
                      {t("clients.bookings", lang)}
                    </th>
                    <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">
                      {t("common.actions", lang)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client: any) => (
                    <tr key={client.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/clients/${client.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                            {client.firstName[0]}
                            {client.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium">
                              {client.firstName} {client.lastName}
                            </p>
                            {client.city && (
                              <p className="text-xs text-muted-foreground">
                                {client.city}
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {client.phone ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {client.phone}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">&mdash;</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {client.email ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {client.email}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">&mdash;</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {client.licenseNumber ? (
                          <span className="text-sm">{client.licenseNumber}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">&mdash;</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="secondary">
                          {client._count.bookings}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/clients/${client.id}`}>
                              <User className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/clients/${client.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(client.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("clients.deleteTitle", lang)}</DialogTitle>
            <DialogDescription>
              {t("clients.deleteDesc", lang)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {t("common.cancel", lang)}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete", lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ClientsContent />
    </Suspense>
  );
}
