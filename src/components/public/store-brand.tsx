"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Car } from "lucide-react";

export function StoreBrand() {
  const searchParams = useSearchParams();
  const agency = searchParams.get("agency") || "demo";
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#e94560");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/public/agency?slug=${agency}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setName(json.data.name);
          setLogo(json.data.logo);
          if (json.data.primaryColor) setPrimaryColor(json.data.primaryColor);
          document.title = `${json.data.name} | Premium Car Rental`;
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [agency]);

  const initials = name
    ? name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "PD";

  return (
    <Link href={`/rent?agency=${agency}`} className="flex items-center gap-2.5">
      {logo ? (
        <img src={logo} alt={name} className="h-9 w-9 rounded-lg object-cover" />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: "#1a1a2e" }}>
          <Car className="h-5 w-5 text-white" />
        </div>
      )}
      {loaded && name ? (
        <span className="hidden sm:block text-xl font-bold tracking-tight text-white">
          {name.split(" ").slice(0, -1).join(" ")}{" "}
          <span style={{ color: primaryColor }}>{name.split(" ").pop()}</span>
        </span>
      ) : (
        <span className="hidden sm:block text-xl font-bold tracking-tight text-white">
          Premium<span style={{ color: primaryColor }}>Drive</span>
        </span>
      )}
      <span className="sm:hidden text-xl font-bold tracking-tight text-white">
        {initials}
      </span>
    </Link>
  );
}
