"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-auth";
import { LogOut, Menu, ShoppingBasket, ShoppingCart, User, X } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type NavItem = {
  href: "/" | "/pantry" | "/profile";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Shopping list", icon: ShoppingCart },
  { href: "/pantry", label: "Pantry", icon: ShoppingBasket },
  { href: "/profile", label: "Profile", icon: User },
];

function BrandMark() {
  return (
    <span
      className="block size-10 shrink-0 overflow-hidden rounded-2xl bg-[#285f45] shadow-sm transition-transform group-hover:-rotate-3"
      aria-hidden="true"
    >
      <img
        src="/favicon.svg"
        alt=""
        width={40}
        height={40}
        fetchPriority="high"
        className="size-10"
      />
    </span>
  );
}

type NavItemProps = {
  href: "/" | "/pantry" | "/profile";
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
};

const NavItem = ({ href, icon: Icon, children, onClick, active }: NavItemProps) => (
  <Button
    variant="ghost"
    size="sm"
    asChild
    className={cn(
      "h-10 w-full justify-start rounded-full px-4 text-muted-foreground hover:bg-secondary hover:text-foreground",
      active &&
        "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground",
    )}
  >
    <Link to={href} preload="intent" className="flex items-center gap-2" onClick={onClick}>
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  </Button>
);

const NavLinks = ({ onItemClick, pathname }: { onItemClick?: () => void; pathname: string }) => (
  <>
    {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
      <NavItem
        key={href}
        href={href}
        icon={Icon}
        onClick={onItemClick}
        active={href === "/" ? pathname === "/" || pathname === "/list" : pathname === href}
      >
        {label}
      </NavItem>
    ))}
  </>
);

export default function Navbar({ user }: { user?: { id: string } | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = useLocation({ select: (location) => location.pathname });
  const logoutMutation = useLogout();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!user) {
    return (
      <nav className="border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-3 font-semibold">
            <BrandMark />
            <span className="font-display text-xl font-normal tracking-tight">Smart Shopping</span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background text-nowrap">
      <div className="relative z-10 mx-auto flex h-20 max-w-7xl items-center justify-between bg-background px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3 font-semibold">
          <BrandMark />
          <span className="font-display text-xl font-normal tracking-tight">Smart Shopping</span>
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/70 p-1.5 shadow-sm md:flex">
          <NavLinks pathname={pathname} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="h-10 rounded-full px-4 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>

        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            ref={menuButtonRef}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <button
        type="button"
        aria-label="Dismiss navigation"
        tabIndex={-1}
        inert={!isOpen}
        onClick={closeMenu}
        className={cn(
          "fixed inset-x-0 top-20 bottom-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        id="mobile-navigation"
        inert={!isOpen}
        className={cn(
          "absolute inset-x-0 top-full z-10 max-h-[calc(100dvh-5rem)] overflow-y-auto border-t bg-background py-3 shadow-lg transition-[opacity,transform,visibility] duration-300 motion-reduce:transition-none md:hidden",
          isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-3 opacity-0",
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col space-y-1 px-4">
          <NavLinks onItemClick={closeMenu} pathname={pathname} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
