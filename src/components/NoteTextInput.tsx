'use client'

import { useSearchParams } from "next/navigation";
import { Textarea } from "./ui/textarea";
import { ChangeEvent, useEffect } from "react";
import { debounceTimeout } from "@/lib/constants";
import useNote from "@/hooks/useNote";
import { updateNoteAction } from "@/actions/notes";

type Props = {
    noteId:string;
    startingNoteText:string;
}

let updateTimeout:NodeJS.Timeout;

function NoteTextInput({noteId, startingNoteText}:Props) {
    const noteIDParam = useSearchParams().get("noteId") || "";
    const {noteText, setNoteText} = useNote();

    useEffect(()=>{
        if(noteIDParam === noteId){
            setNoteText(startingNoteText);
        }
    }, [startingNoteText,noteIDParam, noteId, setNoteText ])

    const handleUpdateNote = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setNoteText(text);
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            updateNoteAction(noteId, text);
        }, debounceTimeout);
    };

    return (
        <div className="flex h-full flex-col">
            <div className="border-b bg-muted/50 px-6 py-3">
                <p className="text-sm text-muted-foreground">
                    {noteId ? "Editing note" : "Create a new note"}
                </p>
            </div>
            <Textarea 
                value={noteText} 
                onChange={handleUpdateNote}
                placeholder="Start writing your thoughts here..."
                className="custom-scrollbar flex-1 resize-none border-0 bg-transparent p-6 text-base leading-relaxed placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
        </div>
    )
}

export default NoteTextInput