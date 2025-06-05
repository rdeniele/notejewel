"use client";

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

function LogOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 
  
  const handleLogOut = async () => {
    setLoading(true);
    
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
      
    toast.success("Logged out successfully!");

    const errorMessage = null;

    if(!errorMessage){
      toast.success("Logged Out", {
        description: "You have been successfully Logged out"
      });
      router.push("/");
    }
    else{
      toast.error("Error", {
        description: errorMessage
      });
    }
      
  }

  return (
    <Button 
      variant="outline"
      onClick={handleLogOut}
      disabled={loading}
      className="w-24"
    > 
      {loading ? <Loader2 className="animate-spin" /> : "Log Out"}
    </Button>
  )
}

export default LogOutButton