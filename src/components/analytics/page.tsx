"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    });
  }, [pathname]);

  return null;
}
