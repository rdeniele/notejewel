'use client'

import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import React, { useTransition } from 'react'
import { CardContent, CardFooter } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { loginAction, signUpAction } from "@/actions/users";

type Props = {
    type: "login" | "signUp"
}

function AuthForm({type}:Props) {
    const isLoginForm = type ==="login";
    const router = useRouter();

    const [isPending, startTransition] = useTransition()

    const handleSubmit = (formData:FormData)=>(

        startTransition(async()=>{
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;

            let errorMessage;

            if(isLoginForm){
                errorMessage = (await loginAction(email,password)).errorMessage;
                toast.success("Logged In", {
                        description: "You have been successfully Logged out"
                      });
            }else{
                errorMessage = (await signUpAction(email,password)).errorMessage;
                toast.success("Signed Up", {
                        description: "Check your email for confirmation link"
                      });
            }

            if(!errorMessage){
                  toast.success("Success", {
                    description:" "
                  });
                  router.replace("/");
                }
                else{
                  toast.error("Error", {
                    description: errorMessage
                  });
                }

        })
    );

  return (
    <form action={handleSubmit}>
        <CardContent className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
                
                {/* email */}
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" placeholder="email" type="email" required disabled={isPending}/> 

                {/* password */}
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" placeholder="password" type="password" required disabled={isPending}/> 
            </div>
        </CardContent>
        <CardFooter className="mt-4 flex flex-col gap-6">
            <Button className="w-full">
                {isPending ? (<Loader2 className="animate-spin" /> ): isLoginForm ? ("Login"): ("Sign Up")}
            </Button>
            <p className="text-xs">
                {isLoginForm ? "Don't have an account yet?": "Already have an account?"}{" "}
                <Link href={isLoginForm ? "/sign-up":"/login"} className={`text-blue-500 underline ${isPending ? "pointer-events-none opacity-50":""}`}>
                {isLoginForm ? "Sign Up":"Login"}
                </Link>
            </p>
        </CardFooter>
    </form>
  )
}

export default AuthForm