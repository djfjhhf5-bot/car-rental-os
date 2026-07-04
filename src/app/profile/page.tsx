"use client";

import { useState } from "react";
import { useUserSession } from "@/components/providers";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/i18n/language-context";
import { t } from "@/lib/i18n/translations";
import { Loader2, Save, User, Lock } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { updateProfile, updatePassword } from "@/lib/actions/profile-actions";

export default function ProfilePage() {
  const { user, refresh } = useUserSession();
  const router = useRouter();
  const { lang } = useLanguage();

  const [name, setName] = useState(user?.name || "");
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleProfileSave = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" as const });
      return;
    }
    setProfileSaving(true);
    try {
      const result = await updateProfile({ name: name.trim() });
      if (result?.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" as const });
      } else {
        toast({ title: t("profile.profileUpdated", lang), description: t("profile.profileUpdatedDesc", lang) });
        await refresh();
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" as const });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Error", description: "All password fields are required", variant: "destructive" as const });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" as const });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" as const });
      return;
    }
    setPasswordSaving(true);
    try {
      const result = await updatePassword({ currentPassword, newPassword });
      if (result?.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" as const });
      } else {
        toast({ title: t("profile.passwordUpdated", lang), description: t("profile.passwordUpdatedDesc", lang) });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" as const });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("profile.title", lang)}</h1>
        <p className="text-muted-foreground">{t("profile.subtitle", lang)}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("profile.personalInfo", lang)}
          </CardTitle>
          <CardDescription>{t("profile.personalInfoDesc", lang)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("profile.email", lang)}</Label>
            <Input id="email" value={user?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">{t("profile.name", lang)}</Label>
            <Input
              id="name"
              placeholder={t("profile.namePlaceholder", lang)}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button onClick={handleProfileSave} disabled={profileSaving}>
            {profileSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t("profile.saveChanges", lang)}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t("profile.changePassword", lang)}
          </CardTitle>
          <CardDescription>{t("profile.changePasswordDesc", lang)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t("profile.currentPassword", lang)}</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t("profile.newPassword", lang)}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("profile.confirmPassword", lang)}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button onClick={handlePasswordChange} disabled={passwordSaving}>
            {passwordSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            {t("profile.changePassword", lang)}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
