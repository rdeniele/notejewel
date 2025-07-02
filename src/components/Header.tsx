import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button"
import { DarkModeToggle } from "./DarkModeToggle";
import LogOutButton from "./LogOutButton";
import { getUser } from "@/auth/server";


// Server Component for the main header
async function Header() {
    const user = await getUser();
    
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 xl:px-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-2 sm:gap-3">
                    <Link 
                        href="/" 
                        className="flex items-center gap-2 sm:gap-3 transition-colors hover:opacity-80"
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="relative size-8 sm:size-10 overflow-hidden rounded-full ring-2 ring-primary">
                                <Image 
                                    src="/notesjewel.png" 
                                    alt="NoteJewel Logo" 
                                    fill 
                                    className="object-cover"
                                    priority
                                    sizes="(max-width: 640px) 32px, 40px"
                                />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-lg sm:text-xl font-semibold leading-none">NoteJewel</h1>
                                <span className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">Your Digital Notebook</span>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {user ? (
                        <div className="flex items-center gap-2">
                            <LogOutButton />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                                <Link href="/sign-up">
                                    Sign Up
                                </Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link href="/login">
                                    Login
                                </Link>
                            </Button>
                        </div>
                    )}
                    <DarkModeToggle />
                </div>


            </div>
        </header>
    );
}

export default Header;