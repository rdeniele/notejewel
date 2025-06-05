import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button"
import { DarkModeToggle } from "./DarkModeToggle";
import LogOutButton from "./LogOutButton";
import { getUser } from "@/auth/server";
import { MobileMenuButton } from "./MobileMenuButton";
import { MobileHeaderMenu } from "./MobileHeaderMenu";

// Server Component for the main header
async function Header() {
    const user = await getUser();
    
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-2 md:gap-3">
                    <MobileMenuButton />
                    <Link 
                        href="/" 
                        className="flex items-center gap-2 md:gap-3 transition-colors hover:opacity-80"
                    >
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="relative size-8 md:size-10 overflow-hidden rounded-full ring-2 ring-primary">
                                <Image 
                                    src="/notesjewel.png" 
                                    alt="NoteJewel Logo" 
                                    fill 
                                    className="object-cover"
                                    priority
                                />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-lg md:text-xl font-semibold leading-none">NoteJewel</h1>
                                <span className="text-[10px] md:text-xs text-muted-foreground">Your Digital Notebook</span>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="size-2 rounded-full bg-primary" />
                                <span>Signed in as {user.email}</span>
                            </div>
                            <LogOutButton />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button asChild variant="ghost">
                                <Link href="/sign-up">
                                    Sign Up
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href="/login">
                                    Login
                                </Link>
                            </Button>
                        </div>
                    )}
                    <DarkModeToggle />
                </div>

                <div className="md:hidden">
                    <MobileHeaderMenu user={user} />
                </div>
            </div>
        </header>
    );
}

export default Header;