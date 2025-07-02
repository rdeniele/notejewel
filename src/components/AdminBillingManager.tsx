"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateBillingRequestStatus } from "@/actions/billing";
import { toast } from "sonner";
import { Mail, Clock, CheckCircle, XCircle, DollarSign, User, Calendar, MessageSquare } from "lucide-react";

interface BillingRequest {
  id: string;
  userId: string;
  planType: "FREE" | "BASIC" | "PREMIUM";
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  adminNotes?: string;
  createAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    displayName?: string;
  };
}

interface AdminBillingManagerProps {
  initialRequests: BillingRequest[];
}

export default function AdminBillingManager({ initialRequests }: AdminBillingManagerProps) {
  const [requests, setRequests] = useState<BillingRequest[]>(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<BillingRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (requestId: string, status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED") => {
    setIsUpdating(true);
    try {
      await updateBillingRequestStatus(requestId, status, adminNotes || undefined);
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status, adminNotes: adminNotes || req.adminNotes, updatedAt: new Date() }
          : req
      ));
      
      toast.success(`Request ${status.toLowerCase()} successfully`);
      setIsDialogOpen(false);
      setAdminNotes("");
      setSelectedRequest(null);
    } catch (error) {
      toast.error("Failed to update request status");
      console.error("Status update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
      COMPLETED: "default",
    } as const;

    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      COMPLETED: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status}
      </Badge>
    );
  };

  const getPlanPrice = (planType: string) => {
    switch (planType) {
      case "FREE": return "$0";
      case "BASIC": return "$1";
      case "PREMIUM": return "$5";
      default: return "$0";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Billing Requests
          </CardTitle>
          <CardDescription>
            Manage user plan upgrade requests and payment processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="size-12 mx-auto mb-4 opacity-50" />
                <p>No billing requests yet</p>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-muted-foreground" />
                        <span className="font-medium">
                          {request.user.displayName || request.user.email}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({request.user.email})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="size-4 text-muted-foreground" />
                        <span className="font-medium">
                          {request.planType} Plan - {getPlanPrice(request.planType)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Requested: {formatDate(request.createAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      <Dialog open={isDialogOpen && selectedRequest?.id === request.id} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) {
                          setSelectedRequest(null);
                          setAdminNotes("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setAdminNotes(request.adminNotes || "");
                            }}
                          >
                            <MessageSquare className="size-4" />
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Manage Request</DialogTitle>
                            <DialogDescription>
                              Update the status and add notes for this billing request
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Admin Notes</label>
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add notes about payment, contact info, etc..."
                                rows={3}
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              {request.status === "PENDING" && (
                                <>
                                  <Button
                                    onClick={() => handleStatusUpdate(request.id, "APPROVED")}
                                    disabled={isUpdating}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="size-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleStatusUpdate(request.id, "REJECTED")}
                                    disabled={isUpdating}
                                    className="flex-1"
                                  >
                                    <XCircle className="size-4 mr-2" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              
                              {request.status === "APPROVED" && (
                                <Button
                                  onClick={() => handleStatusUpdate(request.id, "COMPLETED")}
                                  disabled={isUpdating}
                                  className="w-full"
                                >
                                  <DollarSign className="size-4 mr-2" />
                                  Mark as Paid
                                </Button>
                              )}
                              
                              {request.status === "COMPLETED" && (
                                <div className="text-center text-sm text-muted-foreground">
                                  Request completed
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  {request.adminNotes && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-sm font-medium mb-1">Admin Notes:</div>
                      <div className="text-sm text-muted-foreground">
                        {request.adminNotes}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 