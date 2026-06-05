"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** True once zustand has rehydrated from localStorage (avoids hydration flashes). */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
