"use client";

import Moon from "lucide-react/icons/moon";
import Sun from "lucide-react/icons/sun";
import { useEffect } from "react";

import { themeStorageKey } from "@/lib/clipper/theme";
import { cn } from "@/lib/utils";

function savedTheme() {
  try {
    return localStorage.getItem(themeStorageKey);
  } catch {
    return null;
  }
}

export function ThemeToggle({ className }: { className?: string }) {
  // Track OS theme changes until the customer picks one themselves.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = () => {
      if (!savedTheme()) document.documentElement.classList.toggle("dark", query.matches);
    };
    query.addEventListener("change", follow);
    return () => query.removeEventListener("change", follow);
  }, []);

  function toggle() {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem(themeStorageKey, dark ? "dark" : "light");
    } catch {
      // Private mode: the switch still applies for this page view.
    }
  }

  // Both icons render and CSS picks one, so server and client markup always match.
  return (
    <button type="button" onClick={toggle} aria-label="Toggle dark mode" title="Toggle dark mode" className={cn("grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand", className)}>
      <Moon aria-hidden="true" className="size-[1.1rem] dark:hidden" />
      <Sun aria-hidden="true" className="hidden size-[1.1rem] dark:block" />
    </button>
  );
}
