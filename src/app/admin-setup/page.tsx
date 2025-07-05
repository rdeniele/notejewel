"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminSetupPage() {
  const [email, setEmail] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleBootstrap() {
    if (!email || !adminSecret) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/bootstrap-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          adminSecret,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin user');
      }

      setSuccess(true);
      toast.success("Admin user created successfully!");
      
      // Clear sensitive data
      setAdminSecret("");
      
    } catch (error) {
      console.error('Bootstrap error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create admin user');
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="size-12 text-green-500" />
            </div>
            <CardTitle className="text-green-700">Admin Setup Complete!</CardTitle>
            <CardDescription>
              Your admin user has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-green-600" />
                <p className="text-sm text-green-700">
                  You can now log in with your email and access the admin panel at <code>/admin</code>
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <a href="/login">Go to Login</a>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <a href="/admin">Admin Panel</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="size-12 text-primary" />
          </div>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>
            Create the first admin user for NoteJewel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-yellow-600" />
              <p className="text-sm text-yellow-700">
                This endpoint should only be used once to create the first admin user. 
                Make sure you have set <code>ADMIN_BOOTSTRAP_SECRET</code> in your environment variables.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@notejewel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Admin Bootstrap Secret</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Your ADMIN_BOOTSTRAP_SECRET"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                This should match the <code>ADMIN_BOOTSTRAP_SECRET</code> environment variable
              </p>
            </div>

            <Button 
              onClick={handleBootstrap}
              disabled={isLoading || !email || !adminSecret}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin size-4 mr-2" />
                  Creating Admin...
                </>
              ) : (
                <>
                  <Shield className="size-4 mr-2" />
                  Create Admin User
                </>
              )}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">Environment Setup:</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>1. Set <code>ADMIN_BOOTSTRAP_SECRET</code> in your .env file</p>
              <p>2. Deploy with the environment variable</p>
              <p>3. Use this page to create your first admin</p>
              <p>4. Delete this endpoint after use</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
