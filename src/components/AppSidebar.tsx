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
      <SidebarHeader />
      <SidebarContent className="custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 mt-2 text-lg">
            {user?"Your Notes":
              (
              <p>
                <Link href="/login">Login</Link> to see your notes
              </p>)
              }
          </SidebarGroupLabel>
          {user && <SideBarGroupContent notes={notes}/>}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar;