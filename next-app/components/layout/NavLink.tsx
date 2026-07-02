"use client";

import Link from "next/link";
import { isNextRoute, staticHref } from "@/lib/static-href";

type NavLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

export function NavLink({ href, className, children, onClick }: NavLinkProps) {
  if (isNextRoute(href)) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <a href={staticHref(href)} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
