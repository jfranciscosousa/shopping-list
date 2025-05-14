"use client";

import { Button } from "@/components/ui/button";
import { logout } from "@/server/auth.actions";
import { LogOut, ShoppingCart, User } from "lucide-react";
import Link from "next/link";

export default function Navbar({ user }: { user?: { id: number } | null }) {
  async function handleLogout() {
    await logout();
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur-xs supports-backdrop-filter:bg-background/60 px-2">
      <div className="flex h-14 items-center justify-between p-4 md:p-8">
        <Link href="/list" className="flex items-center gap-2 font-semibold">
          <ShoppingCart className="h-5 w-5" />
          <span>Smart Shopping</span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="p-0">
              <Link href="/profile" className="contents">
                <User className="mr-0.5 h-4 w-4" /> Profile
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="p-0"
            >
              <LogOut className="mr-0.5 h-4 w-4" /> Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
