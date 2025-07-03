"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, CreditCard, Clock, Users, Calendar, RotateCcw, Plus } from "lucide-react";
import { getAllUsers, updateUserPlan, resetUserUsage, extendUserPlan } from "@/actions/billing";

type User = {
  id: string;
  email: string;
  displayName: string | null;
  planType: "FREE" | "BASIC" | "PREMIUM";
  billingStatus: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  planStartDate: Date | null;
  planEndDate: Date | null;
  dailyGenerationsUsed: number;
  lastGenerationReset: Date;
  createAt: Date;
  role: "USER" | "ADMIN";
};

export default function AdminPlanManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"FREE" | "BASIC" | "PREMIUM">("BASIC");
  const [planDuration, setPlanDuration] = useState("1");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userData = await getAllUsers();
      setUsers(userData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdatePlan = async (userId: string, userEmail: string) => {
    try {
      setActionLoading(userId);
      await updateUserPlan(userId, selectedPlan, parseInt(planDuration));
      toast.success(`Updated ${userEmail}'s plan to ${selectedPlan} for ${planDuration} month(s)`);
      await fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Failed to update user plan");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetUsage = async (userId: string, userEmail: string) => {
    try {
      setActionLoading(userId);
      await resetUserUsage(userId);
      toast.success(`Reset daily usage for ${userEmail}`);
      await fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error resetting usage:", error);
      toast.error("Failed to reset user usage");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtendPlan = async (userId: string, userEmail: string) => {
    try {
      setActionLoading(userId);
      await extendUserPlan(userId, parseInt(planDuration));
      toast.success(`Extended ${userEmail}'s plan by ${planDuration} month(s)`);
      await fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error extending plan:", error);
      toast.error("Failed to extend user plan");
    } finally {
      setActionLoading(null);
    }
  };

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case "FREE": return "secondary";
      case "BASIC": return "default";
      case "PREMIUM": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "default";
      case "PENDING": return "secondary";
      case "EXPIRED": return "destructive";
      case "CANCELLED": return "outline";
      default: return "secondary";
    }
  };

  const getPlanLimit = (planType: string) => {
    switch (planType) {
      case "FREE": return 5;
      case "BASIC": return 30;
      case "PREMIUM": return "Unlimited";
      default: return 5;
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.planType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const isExpiringSoon = (endDate: Date | null) => {
    if (!endDate) return false;
    const now = new Date();
    const diffTime = new Date(endDate).getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            User Plan Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          User Plan Management
        </CardTitle>
        <CardDescription>
          Manage user subscription plans and billing status. Update plans, reset usage, and extend subscriptions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, name, or plan type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="plan-select">New Plan Type</Label>
              <Select value={selectedPlan} onValueChange={(value: "FREE" | "BASIC" | "PREMIUM") => setSelectedPlan(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free (5/day)</SelectItem>
                  <SelectItem value="BASIC">Pro ($1/month, 30/day)</SelectItem>
                  <SelectItem value="PREMIUM">Premium (Unlimited)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration-select">Duration (months)</Label>
              <Select value={planDuration} onValueChange={setPlanDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 month</SelectItem>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={() => fetchUsers()} variant="outline" className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.planType === "FREE").length}</div>
            <div className="text-sm text-blue-600">Free Users</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{users.filter(u => u.planType === "BASIC").length}</div>
            <div className="text-sm text-green-600">Pro Users</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.planType === "PREMIUM").length}</div>
            <div className="text-sm text-purple-600">Premium Users</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{users.filter(u => u.billingStatus === "ACTIVE").length}</div>
            <div className="text-sm text-orange-600">Active Plans</div>
          </div>
        </div>

        {/* User List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="h-4 w-4" />
            {filteredUsers.length} user(s) found
          </div>

          {filteredUsers.map((user) => (
            <div key={user.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.displayName || user.email}</span>
                    {user.role === "ADMIN" && <Badge variant="destructive">Admin</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Badge variant={getPlanBadgeColor(user.planType)}>
                        {user.planType}
                      </Badge>
                      <Badge variant={getStatusBadgeColor(user.billingStatus)}>
                        {user.billingStatus}
                      </Badge>
                    </div>
                    {isExpiringSoon(user.planEndDate) && (
                      <Badge variant="destructive">Expires Soon</Badge>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-sm">
                    <span className="font-medium">{user.dailyGenerationsUsed}</span>
                    <span className="text-muted-foreground">/{getPlanLimit(user.planType)}</span>
                    <span className="text-muted-foreground"> used today</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Joined: {formatDate(user.createAt)}
                  </div>
                </div>
              </div>

              {user.planType !== "FREE" && (
                <div className="text-sm text-muted-foreground flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Started: {formatDate(user.planStartDate)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Ends: {formatDate(user.planEndDate)}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleUpdatePlan(user.id, user.email)}
                  disabled={actionLoading === user.id}
                  className="flex items-center gap-1"
                >
                  <CreditCard className="h-3 w-3" />
                  Update Plan
                </Button>

                {user.planType !== "FREE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExtendPlan(user.id, user.email)}
                    disabled={actionLoading === user.id}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Extend
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResetUsage(user.id, user.email)}
                  disabled={actionLoading === user.id}
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset Usage
                </Button>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your search criteria.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
