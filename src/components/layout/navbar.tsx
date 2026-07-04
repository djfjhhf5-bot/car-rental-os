"use client";

import { useCallback, useState } from "react";
import { useUserSession } from "@/components/providers";
import { useRouter } from "next/navigation";
import { signOutUser } from "@/lib/actions/auth-actions";
import { useLanguage } from "@/lib/i18n/language-context";
import { t, type Lang } from "@/lib/i18n/translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu, User, LogOut, Globe } from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

interface NavbarProps {
  onMenuClick: () => void;
}

const languages: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "ar", label: "AR", flag: "🇸🇦" },
];

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useUserSession();
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    await signOutUser();
    router.push("/login");
    router.refresh();
  }, [router]);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-1 ml-2">
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
              lang === l.code
                ? "bg-primary text-primary-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={t(`lang.${l.code}`, lang)}
          >
            {l.flag}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user?.name ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || ""}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile")}>
            <User className="mr-2 h-4 w-4" />
            {t("navbar.profile", lang)}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isSigningOut ? t("navbar.signingOut", lang) : t("navbar.signOut", lang)}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
