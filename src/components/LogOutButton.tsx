"use client";

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { logOutAction } from '@/actions/users';
import { cn } from '@/lib/utils';

type LogOutButtonProps = React.ComponentProps<typeof Button>;

function LogOutButton({ className, ...props }: LogOutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 
  
  const handleLogOut = async () => {
    setLoading(true);
    try {
      const result = await logOutAction();
  
      if(!result.errorMessage){
        toast.success("Logged Out", {
          description: "You have been successfully Logged out"
        });
        router.push("/");
      }
      else{
        toast.error("Error", {
          description: result.errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
      variant="outline"
      onClick={handleLogOut}
      disabled={loading}
      className={cn("w-24", className)}
      {...props}
    > 
      {loading ? <Loader2 className="animate-spin" /> : "Log Out"}
    </Button>
  )
}

export default LogOutButton;