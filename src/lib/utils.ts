import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const handleError = (error: unknown): { errorMessage: string } => {
  if(error instanceof Error){
    return{errorMessage:error.message}
  }else{
    return{errorMessage:"An error occured"}
  }
}