"use client"

import { Note } from "@prisma/client"

type Props={
    notes:Note[]
}

function SideBarGroupContent({notes}:Props) {
    console.log(notes)
  return (
    <div>Your notes here</div>
  )
}

export default SideBarGroupContent