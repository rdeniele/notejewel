import { getBillingRequests } from "@/actions/billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateBillingRequestStatus } from "@/actions/billing";
import { toast } from "sonner";
import { Mail, Clock, CheckCircle, XCircle, DollarSign, User, Calendar, Shield } from "lucide-react";
import AdminBillingManager from "@/components/AdminBillingManager";
import AdminUserManager from "@/components/AdminUserManager";
import AdminPlanManager from "@/components/AdminPlanManager";
import { requireAdmin } from "@/auth/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect("/");
  }

  const billingRequests = await getBillingRequests();

  const pendingRequests = billingRequests.filter(req => req.status === "PENDING");
  const approvedRequests = billingRequests.filter(req => req.status === "APPROVED");
  const completedRequests = billingRequests.filter(req => req.status === "COMPLETED");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Badge variant="destructive" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Admin Only
            </Badge>
          </div>
          <p className="text-muted-foreground">Manage billing requests, user plans, and admin privileges</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{completedRequests.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Requests Manager */}
      <AdminBillingManager initialRequests={billingRequests} />

      {/* User Plan Management */}
      <AdminPlanManager />

      {/* Admin User Management */}
      <AdminUserManager />
    </div>
  );
} 