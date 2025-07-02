"use client";

import type { AuthUser } from "@/app/page";
import { Button } from "./ui/button";
import { PlusCircle } from "lucide-react";

type Props = {
  user: AuthUser | null;
  onClick: () => void;
};

function NewNoteButton({ user, onClick }: Props) {
  const handleClick = () => {
    if (!user) {
      // Handle not logged in case
      return;
    }
    onClick();
  };

  return (
    <Button
      onClick={handleClick}
      variant="default"
      className="gap-2"
    >
      <PlusCircle className="size-4" />
      New Note
    </Button>
  );
}

export default NewNoteButton;