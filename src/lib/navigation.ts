"use client"

import { usePathname } from "next/navigation"

export function useIsActiveLink(href: string, exact?: boolean): boolean {
  const pathname = usePathname()
  if (exact || href === "/") return pathname === href
  return pathname === href || pathname.startsWith(href + "/")
}
