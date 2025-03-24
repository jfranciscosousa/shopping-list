"use client";

import { Button } from "@/components/ui/button";
import { logout } from "@/server/auth.actions";
import { LogOut, ShoppingCart, User } from "lucide-react";
import Link from "next/link";

export default function Navbar({ user }: { user: { id: number } | null }) {
  async function handleLogout() {
    await logout();
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur-xs supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Smart Shopping</span>
        </Link>

        {user && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile" className="contents">
                <User className="mr-2 h-4 w-4" /> Profile
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
