"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createBillingRequest } from "@/actions/billing";
import { toast } from "sonner";
import { Check, Sparkles, Zap, Crown, Mail, AlertCircle } from "lucide-react";

interface PricingPlansProps {
  userId: string;
  currentPlan: "FREE" | "BASIC" | "PREMIUM";
  currentUsage: number;
  currentLimit: number;
}

const plans = [
  {
    name: "Free",
    type: "FREE" as const,
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "10 AI generations per day",
      "Basic study plans",
      "Simple quizzes",
      "Note organization",
    ],
    icon: Sparkles,
    popular: false,
  },
  {
    name: "Basic",
    type: "BASIC" as const,
    price: "$1",
    description: "Great for regular students",
    features: [
      "100 AI generations per day",
      "Advanced study plans",
      "Detailed quizzes",
      "Concept mapping",
      "Priority support",
    ],
    icon: Zap,
    popular: true,
  },
  {
    name: "Premium",
    type: "PREMIUM" as const,
    price: "$5",
    description: "For serious learners",
    features: [
      "Unlimited AI generations",
      "Custom study strategies",
      "Advanced analytics",
      "All features included",
      "Priority support",
      "Early access to new features",
    ],
    icon: Crown,
    popular: false,
  },
];

export default function PricingPlans({ 
  userId, 
  currentPlan, 
  currentUsage, 
  currentLimit 
}: PricingPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<"FREE" | "BASIC" | "PREMIUM" | null>(null);
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handlePlanSelect = (planType: "FREE" | "BASIC" | "PREMIUM") => {
    setSelectedPlan(planType);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan || !email) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBillingRequest(userId, selectedPlan, email);
      toast.success("Plan request submitted successfully! We'll contact you soon.");
      setIsDialogOpen(false);
      setEmail("");
      setSelectedPlan(null);
    } catch (error) {
      toast.error("Failed to submit plan request");
      console.error("Plan request error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentPlanInfo = () => {
    return plans.find(plan => plan.type === currentPlan);
  };

  const currentPlanInfo = getCurrentPlanInfo();

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentPlanInfo?.icon && <currentPlanInfo.icon className="size-5" />}
            Your Current Plan: {currentPlanInfo?.name}
          </CardTitle>
          <CardDescription>
            {currentUsage} / {currentLimit === Infinity ? "∞" : currentLimit} generations used today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${currentLimit === Infinity ? 0 : Math.min((currentUsage / currentLimit) * 100, 100)}%` 
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = plan.type === currentPlan;
          
          return (
            <Card 
              key={plan.type} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''} ${
                isCurrentPlan ? 'ring-2 ring-primary/50' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-3 right-3">
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Current
                  </span>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="size-6" />
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{plan.price}</div>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrentPlan}
                  onClick={() => handlePlanSelect(plan.type)}
                >
                  {isCurrentPlan ? "Current Plan" : "Choose Plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plan Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="size-5" />
              Request {selectedPlan} Plan
            </DialogTitle>
            <DialogDescription>
              Enter your email address and we'll contact you to complete your plan upgrade.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="size-4" />
                Manual Payment Process
              </div>
              <div className="text-sm space-y-2">
                <p>1. Submit your request with your email</p>
                <p>2. We'll contact you via email</p>
                <p>3. Pay via GCash or PayPal</p>
                <p>4. We'll activate your plan manually</p>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTerms(!showTerms)}
                className="w-full"
              >
                {showTerms ? "Hide" : "Show"} Terms & Conditions
              </Button>
              
              {showTerms && (
                <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2 max-h-40 overflow-y-auto">
                  <h4 className="font-medium">Terms and Conditions</h4>
                  <ul className="space-y-1 text-xs">
                    <li>• Plans are billed monthly and auto-renew unless cancelled</li>
                    <li>• Payment is processed manually via GCash or PayPal</li>
                    <li>• Plan activation occurs within 24 hours of payment confirmation</li>
                    <li>• Usage limits reset daily at midnight</li>
                    <li>• Refunds are not provided for partial months</li>
                    <li>• We reserve the right to modify pricing with 30 days notice</li>
                    <li>• Service may be suspended for non-payment</li>
                    <li>• All AI generations are subject to fair use policies</li>
                  </ul>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 