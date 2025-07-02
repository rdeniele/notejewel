import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/auth/server';
import { prisma } from '@/db/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { text, title } = await request.json();
    const { id: noteId } = await params;

    // Update the note using raw SQL since Prisma client doesn't recognize title field
    if (title !== undefined) {
      await prisma.$executeRaw`
        UPDATE "Note" 
        SET "text" = ${text}, "title" = ${title}, "updatedAt" = NOW()
        WHERE "id" = ${noteId}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "Note" 
        SET "text" = ${text}, "updatedAt" = NOW()
        WHERE "id" = ${noteId}
      `;
    }

    // Fetch the updated note
    const updatedNote = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        subject: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      note: updatedNote 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noteId } = await params;

    await prisma.note.delete({
      where: { id: noteId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
} 