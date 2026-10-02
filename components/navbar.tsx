"use client";

import { useState } from "react";
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

export default function Navbar({ user }: { user?: { id: number } | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = useLocation({ select: (location) => location.pathname });
  const logoutMutation = useLogout();

  const toggleMenu = () => setIsOpen(!isOpen);

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
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/80 text-nowrap backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
            onClick={toggleMenu}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t bg-background/95 transition-all duration-300 md:hidden",
          isOpen ? "max-h-64 py-3" : "max-h-0 py-0",
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col space-y-1 px-4">
          <NavLinks onItemClick={toggleMenu} pathname={pathname} />
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
