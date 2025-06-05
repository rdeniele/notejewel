import { getUser } from "@/auth/server";
import AskAIButton from "@/components/AskAIButton";
import NewNoteButton from "@/components/NewNoteButton";
import NoteTextInput from "@/components/NoteTextInput";
import { prisma } from "@/db/prisma";
import { Card } from "@/components/ui/card";

type Props = {
  searchParams:Promise<{[key:string]:string | string[] | undefined}>
}

async function HomePage({searchParams}:Props){
  const noteIdParam = (await searchParams).noteId
  const user = await getUser()

  const noteId = Array.isArray(noteIdParam) ? noteIdParam![0]: noteIdParam || "";

  const note = await prisma.note.findUnique({
    where:{id:noteId, authorId:user?.id},
  })

  return (
    <div className="flex h-full flex-col items-center gap-6 p-6">
      <div className="flex w-full max-w-5xl items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold text-foreground/80">My Notes</h2>
          <div className="h-6 w-px bg-border" />
          <p className="text-sm text-muted-foreground">Capture your thoughts and ideas</p>
        </div>
        <div className="flex items-center gap-3">
          <AskAIButton user={user}/>
          <NewNoteButton user={user}/>
        </div>
      </div>
      
      <Card className="w-full max-w-5xl flex-1 overflow-hidden">
        <NoteTextInput noteId={noteId} startingNoteText={note?.text || ""}/>
      </Card>
    </div>
  )
}

export default HomePage;
