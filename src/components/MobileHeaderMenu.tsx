"use client";

import { Button } from "@/components/ui/button";
import LogOutButton from "./LogOutButton";
import { DarkModeToggle } from "./DarkModeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Menu } from "lucide-react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";

interface MobileHeaderMenuProps {
  user: User | null;
}

export function MobileHeaderMenu({ user }: MobileHeaderMenuProps) {
  return (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          <LogOutButton />
          <DarkModeToggle />
        </>
      ) : (
        <>
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-up">Sign Up</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login">Login</Link>
          </Button>
        </>
      )}
    </div>
  );
} 