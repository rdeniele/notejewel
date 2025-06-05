import { getUser } from "@/auth/server";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { prisma } from "@/db/prisma";
import { Note } from "@prisma/client";
import Link from "next/link";
import SideBarGroupContent from "./SideBarGroupContent";
import { BookOpen } from "lucide-react";

async function AppSidebar() {
  const user = await getUser();

  let notes:Note[] = [];

  if (user){
    notes = await prisma.note.findMany({
      where: {
        authorId: user.id,
      },
      orderBy:{
        updatedAt:"desc",
      }
    })
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">NoteJewel</h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 py-4 text-sm font-medium text-muted-foreground">
            {user ? (
              <div className="flex flex-col gap-1">
                <span>Welcome back!</span>
                <span className="text-xs text-muted-foreground/70">
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'} in your collection
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p>Sign in to access your notes</p>
                <Link 
                  href="/login" 
                  className="text-primary hover:underline"
                >
                  Login →
                </Link>
              </div>
            )}
          </SidebarGroupLabel>
          {user && <SideBarGroupContent notes={notes}/>}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar;