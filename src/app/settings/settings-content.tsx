"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n/language-context";
import { t } from "@/lib/i18n/translations";
import { toast } from "@/components/ui/toast";
import {
  getAgencySettings,
  updateAgency,
  getLlmConfigs,
  saveLlmConfig,
  getWassenderConfig,
  saveWassenderConfig,
  getContractTemplates,
  saveContractTemplate,
  deleteContractTemplate,
  getAgencyUsers,
  createAgencyUser,
} from "@/lib/actions/settings-actions";
import {
  Building2,
  Brain,
  MessageSquare,
  FileText,
  Users,
  Plus,
  Trash2,
  Check,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

type AgencyData = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  timezone: string;
};

type LlmConfigData = {
  id: string;
  provider: string;
  apiKey: string | null;
  model: string;
  apiUrl: string | null;
  active: boolean;
};

type WassenderConfigData = {
  id: string;
  apiKey: string | null;
  sessionId: string | null;
  webhookSecret: string | null;
  active: boolean;
};

type ContractTemplateData = {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
};

type AgencyUserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  createdAt: Date;
};

export default function SettingsPage() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState("agency");
  const [loading, setLoading] = useState(true);

  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [agencySaving, setAgencySaving] = useState(false);

  const [llmConfig, setLlmConfig] = useState<LlmConfigData | null>(null);
  const [llmSaving, setLlmSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [wassender, setWassender] = useState<WassenderConfigData | null>(null);
  const [wassenderSaving, setWassenderSaving] = useState(false);
  const [showWsApiKey, setShowWsApiKey] = useState(false);
  const [showWsWebhook, setShowWsWebhook] = useState(false);

  const [templates, setTemplates] = useState<ContractTemplateData[]>([]);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplateData | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [templateIsDefault, setTemplateIsDefault] = useState(false);

  const [users, setUsers] = useState<AgencyUserData[]>([]);
  const [userSaving, setUserSaving] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("staff");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [agencyRes, llmRes, wassenderRes, templatesRes, usersRes] =
          await Promise.all([
            getAgencySettings(),
            getLlmConfigs(),
            getWassenderConfig(),
            getContractTemplates(),
            getAgencyUsers(),
          ]);

        if (agencyRes.success && agencyRes.data) setAgency(agencyRes.data);
        if (llmRes.success && llmRes.data && llmRes.data.length > 0)
          setLlmConfig(llmRes.data[0]);
        if (wassenderRes.success && wassenderRes.data)
          setWassender(wassenderRes.data);
        if (templatesRes.success && templatesRes.data)
          setTemplates(templatesRes.data);
        if (usersRes.success && usersRes.data) setUsers(usersRes.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAgencySave = useCallback(async () => {
    if (!agency) return;
    setAgencySaving(true);
    const res = await updateAgency({
      name: agency.name,
      phone: agency.phone || "",
      email: agency.email || "",
      address: agency.address || "",
      currency: agency.currency,
      timezone: agency.timezone,
      primaryColor: agency.primaryColor,
      secondaryColor: agency.secondaryColor,
    });
    setAgencySaving(false);
    if (res.success) {
      toast({ title: t("settings.saved", lang), description: t("settings.savedDesc", lang), variant: "success" as const });
    } else {
      toast({ title: "Error", description: res.error || "Failed to save", variant: "destructive" as const });
    }
  }, [agency]);

  const handleLlmSave = useCallback(async () => {
    setLlmSaving(true);
    const res = await saveLlmConfig({
      provider: llmConfig?.provider || "openai",
      apiKey: llmConfig?.apiKey || "",
      model: llmConfig?.model || "gpt-4",
      apiUrl: llmConfig?.apiUrl || "",
    });
    setLlmSaving(false);
    if (res.success) {
      if (res.data) setLlmConfig(res.data as LlmConfigData);
      toast({ title: t("settings.saved", lang), description: t("settings.configUpdated", lang), variant: "success" as const });
    } else {
      toast({ title: "Error", description: res.error || "Failed to save", variant: "destructive" as const });
    }
  }, [llmConfig]);

  const handleWassenderSave = useCallback(async () => {
    setWassenderSaving(true);
    const res = await saveWassenderConfig({
      apiKey: wassender?.apiKey || "",
      sessionId: wassender?.sessionId || "",
      webhookSecret: wassender?.webhookSecret || "",
      active: wassender?.active || false,
    });
    setWassenderSaving(false);
    if (res.success) {
      toast({ title: t("settings.saved", lang), description: t("settings.whatsappUpdated", lang), variant: "success" as const });
    } else {
      toast({ title: "Error", description: res.error || "Failed to save", variant: "destructive" as const });
    }
  }, [wassender]);

  const handleTemplateSave = useCallback(async () => {
    if (!templateName || !templateContent) {
      toast({ title: "Error", description: t("settings.nameRequired", lang), variant: "destructive" as const });
      return;
    }
    setTemplateSaving(true);
    const res = await saveContractTemplate({
      id: editingTemplate?.id,
      name: templateName,
      content: templateContent,
      isDefault: templateIsDefault,
    });
    setTemplateSaving(false);
    if (res.success && res.data) {
      toast({ title: t("settings.saved", lang), description: t("settings.templateSaved", lang), variant: "success" as const });
      setTemplates((prev) => {
        const existing = prev.findIndex((t) => t.id === res.data!.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = res.data;
          return updated;
        }
        return [...prev, res.data!];
      });
      resetTemplateForm();
    } else {
      toast({ title: "Error", description: res.error || "Failed to save", variant: "destructive" as const });
    }
  }, [templateName, templateContent, templateIsDefault, editingTemplate]);

  const handleTemplateDelete = useCallback(async (id: string) => {
    const res = await deleteContractTemplate(id);
    if (res.success) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({ title: t("settings.saved", lang), description: t("settings.templateDeleted", lang), variant: "success" as const });
    } else {
      toast({ title: "Error", description: res.error || "Failed to delete", variant: "destructive" as const });
    }
  }, []);

  const handleUserCreate = useCallback(async () => {
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast({ title: "Error", description: t("settings.allFieldsRequired", lang), variant: "destructive" as const });
      return;
    }
    setUserSaving(true);
    const res = await createAgencyUser({
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole,
    });
    setUserSaving(false);
    if (res.success && res.data) {
      toast({ title: t("settings.saved", lang), description: t("settings.memberAdded", lang), variant: "success" as const });
      setUsers((prev) => [...prev, res.data!]);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("staff");
    } else {
      toast({ title: "Error", description: res.error || "Failed to create user", variant: "destructive" as const });
    }
  }, [newUserName, newUserEmail, newUserPassword, newUserRole]);

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateContent("");
    setTemplateIsDefault(false);
  };

  const editTemplate = (t: ContractTemplateData) => {
    setEditingTemplate(t);
    setTemplateName(t.name);
    setTemplateContent(t.content);
    setTemplateIsDefault(t.isDefault);
    setActiveTab("templates");
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("settings.title", lang)}</h1>
        <p className="text-sm text-muted-foreground">
          {t("settings.subtitle", lang)}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex-wrap justify-start h-auto gap-1">
          <TabsTrigger value="agency" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            {t("settings.agency", lang)}
          </TabsTrigger>
          <TabsTrigger value="llm" className="gap-1.5">
            <Brain className="h-4 w-4" />
            {t("settings.llm", lang)}
          </TabsTrigger>
          <TabsTrigger value="wassender" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            {t("settings.whatsapp", lang)}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <FileText className="h-4 w-4" />
            {t("settings.contracts", lang)}
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="h-4 w-4" />
            {t("settings.team", lang)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.agencySettings", lang)}</CardTitle>
              <CardDescription>
                {t("settings.agencySettingsDesc", lang)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("settings.agencyName", lang)}</Label>
                  <Input
                    id="name"
                    value={agency?.name || ""}
                    onChange={(e) =>
                      setAgency((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">{t("settings.slug", lang)}</Label>
                  <Input id="slug" value={agency?.slug || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("settings.email", lang)}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={agency?.email || ""}
                    onChange={(e) =>
                      setAgency((prev) =>
                        prev ? { ...prev, email: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("settings.phone", lang)}</Label>
                  <Input
                    id="phone"
                    value={agency?.phone || ""}
                    onChange={(e) =>
                      setAgency((prev) =>
                        prev ? { ...prev, phone: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">{t("settings.address", lang)}</Label>
                  <Input
                    id="address"
                    value={agency?.address || ""}
                    onChange={(e) =>
                      setAgency((prev) =>
                        prev ? { ...prev, address: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t("settings.currency", lang)}</Label>
                  <Select
                    value={agency?.currency || "USD"}
                    onValueChange={(v) =>
                      setAgency((prev) =>
                        prev ? { ...prev, currency: v } : null
                      )
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (&euro;)</SelectItem>
                      <SelectItem value="GBP">GBP (&pound;)</SelectItem>
                      <SelectItem value="MAD">MAD (DH)</SelectItem>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                      <SelectItem value="DZD">DZD (د.ج)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t("settings.timezone", lang)}</Label>
                  <Select
                    value={agency?.timezone || "America/New_York"}
                    onValueChange={(v) =>
                      setAgency((prev) =>
                        prev ? { ...prev, timezone: v } : null
                      )
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">
                        Eastern (EST)
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central (CST)
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain (MST)
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific (PST)
                      </SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Africa/Casablanca">
                        Casablanca
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">{t("settings.primaryColor", lang)}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      className="w-12 p-1"
                      value={agency?.primaryColor || "#2563eb"}
                      onChange={(e) =>
                        setAgency((prev) =>
                          prev
                            ? { ...prev, primaryColor: e.target.value }
                            : null
                        )
                      }
                    />
                    <Input
                      value={agency?.primaryColor || ""}
                      className="flex-1"
                      onChange={(e) =>
                        setAgency((prev) =>
                          prev
                            ? { ...prev, primaryColor: e.target.value }
                            : null
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">{t("settings.secondaryColor", lang)}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      className="w-12 p-1"
                      value={agency?.secondaryColor || "#1e40af"}
                      onChange={(e) =>
                        setAgency((prev) =>
                          prev
                            ? { ...prev, secondaryColor: e.target.value }
                            : null
                        )
                      }
                    />
                    <Input
                      value={agency?.secondaryColor || ""}
                      className="flex-1"
                      onChange={(e) =>
                        setAgency((prev) =>
                          prev
                            ? { ...prev, secondaryColor: e.target.value }
                            : null
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">{t("settings.logoUrl", lang)}</Label>
                  <Input
                    id="logo"
                    value={agency?.logo || ""}
                    onChange={(e) =>
                      setAgency((prev) =>
                        prev ? { ...prev, logo: e.target.value } : null
                      )
                    }
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
              <Button onClick={handleAgencySave} disabled={agencySaving}>
                {agencySaving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("settings.saveChanges", lang)}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="llm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.llmConfig", lang)}</CardTitle>
              <CardDescription>
                {t("settings.llmConfigDesc", lang)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">{t("settings.provider", lang)}</Label>
                <Select
                  value={llmConfig?.provider || "openai"}
                  onValueChange={(v) =>
                    setLlmConfig((prev) =>
                      prev ? { ...prev, provider: v } : { id: "", provider: v, apiKey: null, model: "gpt-4", apiUrl: null, active: true }
                    )
                  }
                >
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                    <SelectItem value="custom">{t("settings.customApiUrl", lang)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">{t("settings.model", lang)}</Label>
                <Input
                  id="model"
                  value={llmConfig?.model || ""}
                  onChange={(e) =>
                  setLlmConfig((prev) =>
                    prev ? { ...prev, model: e.target.value } : { id: "", provider: "openai", apiKey: null, model: e.target.value, apiUrl: null, active: true }
                  )
                  }
                  placeholder={
                    llmConfig?.provider === "openai"
                      ? "gpt-4"
                      : llmConfig?.provider === "anthropic"
                        ? "claude-3-opus-20240229"
                        : llmConfig?.provider === "openrouter"
                          ? "openai/gpt-4o-mini"
                          : "gpt-4"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">{t("settings.apiKey", lang)}</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    value={llmConfig?.apiKey || ""}
                    onChange={(e) =>
                      setLlmConfig((prev) =>
                        prev ? { ...prev, apiKey: e.target.value } : { id: "", provider: "openai", apiKey: e.target.value, model: "gpt-4", apiUrl: null, active: true }
                      )
                    }
                    placeholder="sk-..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {llmConfig?.provider === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">{t("settings.customApiUrl", lang)}</Label>
                  <Input
                    id="apiUrl"
                    value={llmConfig?.apiUrl || ""}
                    onChange={(e) =>
                      setLlmConfig((prev) =>
                        prev ? { ...prev, apiUrl: e.target.value } : { id: "", provider: "custom", apiKey: null, model: "gpt-4", apiUrl: e.target.value, active: true }
                      )
                    }
                    placeholder="https://your-api.com/v1/chat/completions"
                  />
                </div>
              )}

              <Button onClick={handleLlmSave} disabled={llmSaving}>
                {llmSaving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("settings.saveConfig", lang)}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wassender" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.whatsappConfig", lang)}</CardTitle>
              <CardDescription>
                {t("settings.whatsappConfigDesc", lang)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{t("settings.active", lang)}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.toggleWhatsApp", lang)}
                  </p>
                </div>
                <Switch
                  checked={wassender?.active || false}
                  onCheckedChange={(v) =>
                    setWassender((prev) =>
                      prev ? { ...prev, active: v } : { id: "", active: v, apiKey: "", sessionId: "", webhookSecret: "" }
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wsApiKey">{t("settings.apiKey", lang)}</Label>
                <div className="relative">
                  <Input
                    id="wsApiKey"
                    type={showWsApiKey ? "text" : "password"}
                    value={wassender?.apiKey || ""}
                    onChange={(e) =>
                      setWassender((prev) =>
                        prev ? { ...prev, apiKey: e.target.value } : { id: "", apiKey: e.target.value, sessionId: "", webhookSecret: "", active: false }
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setShowWsApiKey(!showWsApiKey)}
                  >
                    {showWsApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionId">{t("settings.sessionId", lang)}</Label>
                <Input
                  id="sessionId"
                  value={wassender?.sessionId || ""}
                  onChange={(e) =>
                    setWassender((prev) =>
                      prev ? { ...prev, sessionId: e.target.value } : { id: "", sessionId: e.target.value, apiKey: "", webhookSecret: "", active: false }
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookSecret">{t("settings.webhookSecret", lang)}</Label>
                <div className="relative">
                  <Input
                    id="webhookSecret"
                    type={showWsWebhook ? "text" : "password"}
                    value={wassender?.webhookSecret || ""}
                    onChange={(e) =>
                      setWassender((prev) =>
                        prev
                          ? { ...prev, webhookSecret: e.target.value }
                          : { id: "", webhookSecret: e.target.value, apiKey: "", sessionId: "", active: false }
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setShowWsWebhook(!showWsWebhook)}
                  >
                    {showWsWebhook ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button onClick={handleWassenderSave} disabled={wassenderSaving}>
                {wassenderSaving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("settings.saveConfig", lang)}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.contractTemplates", lang)}</CardTitle>
              <CardDescription>
                {t("settings.contractTemplatesDesc", lang)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.length === 0 && !editingTemplate && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("settings.noTemplates", lang)}
                </p>
              )}

              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      {tmpl.name}
                      {tmpl.isDefault && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                          {t("settings.default", lang)}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {tmpl.content.slice(0, 100)}...
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => editTemplate(tmpl)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTemplateDelete(tmpl.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">
                  {editingTemplate ? t("settings.editTemplate", lang) : t("settings.newTemplate", lang)}
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="templateName">{t("settings.templateName", lang)}</Label>
                  <Input
                    id="templateName"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder={t("settings.templateNamePlaceholder", lang)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateContent">{t("settings.templateContent", lang)}</Label>
                  <Textarea
                    id="templateContent"
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    placeholder={t("settings.templateContentPlaceholder", lang)}
                    rows={8}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={templateIsDefault}
                    onCheckedChange={setTemplateIsDefault}
                    id="templateDefault"
                  />
                  <Label htmlFor="templateDefault">
                    {t("settings.setDefault", lang)}
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleTemplateSave}
                    disabled={templateSaving}
                  >
                    {templateSaving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingTemplate ? t("settings.updateTemplate", lang) : t("settings.createTemplate", lang)}
                  </Button>
                  {editingTemplate && (
                    <Button variant="outline" onClick={resetTemplateForm}>
                      {t("common.cancel", lang)}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.teamMembers", lang)}</CardTitle>
              <CardDescription>
                {t("settings.teamMembersDesc", lang)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {users.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("settings.noMembers", lang)}
                </p>
              ) : (
                <div className="space-y-2">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-0.5">
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-secondary-foreground capitalize">
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">{t("settings.addMember", lang)}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="userName">{t("settings.nameLabel", lang)}</Label>
                    <Input
                      id="userName"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder={t("settings.namePlaceholder", lang)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">{t("settings.emailLabel", lang)}</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder={t("settings.emailPlaceholder", lang)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userPassword">{t("settings.passwordLabel", lang)}</Label>
                    <Input
                      id="userPassword"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder={t("settings.passwordPlaceholder", lang)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userRole">{t("settings.role", lang)}</Label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger id="userRole">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{t("settings.admin", lang)}</SelectItem>
                        <SelectItem value="staff">{t("settings.staff", lang)}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleUserCreate} disabled={userSaving}>
                  {userSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Plus className="mr-2 h-4 w-4" />
                  {t("settings.addMemberBtn", lang)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
