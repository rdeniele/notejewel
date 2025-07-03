"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, UserPlus, UserMinus, Mail } from "lucide-react";

export default function AdminUserManager() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePromoteToAdmin = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/manage-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`${email} has been promoted to admin`);
        setEmail("");
      } else {
        toast.error(data.error || "Failed to promote user to admin");
      }
    } catch (error) {
      toast.error("An error occurred while promoting user");
      console.error("Error promoting user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/manage-users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Admin privileges removed from ${email}`);
        setEmail("");
      } else {
        toast.error(data.error || "Failed to remove admin privileges");
      }
    } catch (error) {
      toast.error("An error occurred while removing admin privileges");
      console.error("Error removing admin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin User Management
        </CardTitle>
        <CardDescription>
          Manage admin privileges for users. Use carefully - admin users have full access to all system features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-email">User Email</Label>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Input
              id="admin-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handlePromoteToAdmin}
            disabled={isLoading || !email}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Promote to Admin
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleRemoveAdmin}
            disabled={isLoading || !email}
            className="flex items-center gap-2"
          >
            <UserMinus className="h-4 w-4" />
            Remove Admin
          </Button>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Security Warning</span>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            Admin users have complete access to all system features including user management, billing, and sensitive data. 
            Only promote trusted users to admin status.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
