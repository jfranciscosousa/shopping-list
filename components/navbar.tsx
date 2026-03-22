"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/server/auth.actions";
import { LogOut, Menu, ShoppingBasket, ShoppingCart, User, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Shopping list", icon: ShoppingCart },
  { href: "/pantry", label: "Pantry", icon: ShoppingBasket },
  { href: "/profile", label: "Profile", icon: User },
];

type NavItemProps = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
};

const NavItem = ({ href, icon: Icon, children, onClick }: NavItemProps) => (
  <Button variant="ghost" size="sm" asChild className="w-full justify-start">
    <Link href={href} className="flex items-center gap-2" onClick={onClick}>
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  </Button>
);

const NavLinks = ({ onItemClick }: { onItemClick?: () => void }) => (
  <>
    {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
      <NavItem key={href} href={href} icon={Icon} onClick={onItemClick}>
        {label}
      </NavItem>
    ))}
  </>
);

export default function Navbar({ user }: { user?: { id: number } | null }) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    await logout();
  }

  const toggleMenu = () => setIsOpen(!isOpen);

  if (!user) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur-xs supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between p-4 md:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ShoppingCart className="h-5 w-5" />
            <span>Smart Shopping</span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur-xs supports-backdrop-filter:bg-background/60 text-nowrap">
      <div className="flex h-14 items-center justify-between p-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ShoppingCart className="h-5 w-5" />
          <span>Smart Shopping</span>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          <NavLinks />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1"
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
          "md:hidden bg-background/95 backdrop-blur-sm border-t transition-all duration-300 overflow-hidden",
          isOpen ? "max-h-48 py-2" : "max-h-0 py-0",
        )}
      >
        <div className="flex flex-col space-y-2 px-4">
          <NavLinks onItemClick={toggleMenu} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
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
