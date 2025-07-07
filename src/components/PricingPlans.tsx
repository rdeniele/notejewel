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
    originalPrice: null,
    period: "/month",
    description: "Essential study tools to get started",
    features: [
      "50 AI generations per day",
      "Basic note creation and editing",
      "AI note summaries (unlimited)",
      "Quiz generation (unlimited)", 
      "Flashcard generation (unlimited)",
      "PDF upload and processing",
      "Subject organization",
      "Community support",
    ],
    limitations: [
      "No concept maps or study plans",
      "Limited to basic AI features",
    ],
    icon: Sparkles,
    popular: false,
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    type: "BASIC" as const,
    price: "$1",
    originalPrice: null,
    period: "/month",
    description: "Made for students - all you need at the cost of a candy bar",
    features: [
      "100 AI generations per day",
      "Everything in Free",
      "AI concept mapping",
      "Personalized study plan generation", 
      "Enhanced AI interactions",
      "Study progress tracking",
      "Priority support",
      "Perfect for daily studying",
    ],
    limitations: [
      "Limited to 100 AI generations per day",
    ],
    icon: Zap,
    popular: true,
    cta: "Upgrade for $1",
    badge: "Student Favorite",
  },
  {
    name: "Premium",
    type: "PREMIUM" as const,
    price: "$4.99",
    originalPrice: "$9.99",
    period: "/month",
    description: "Unlimited access to all features",
    features: [
      "Unlimited AI generations",
      "Everything in Pro",
      "Advanced concept mapping",
      "Custom study strategies",
      "Advanced analytics & insights",
      "Priority AI response speed",
      "Export notes & study plans",
      "Email support",
      "Early access to new features",
    ],
    limitations: [],
    icon: Crown,
    popular: false,
    cta: "Go Premium",
    badge: "Best Value",
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
    <div className="space-y-8">
      {/* Value Proposition Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-full text-sm font-medium text-blue-700">
          <Sparkles className="size-4" />
          Student-Friendly Pricing
        </div>
        <h2 className="text-3xl font-bold">Simple, Student-Friendly Pricing</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Start free with essential tools. Our Pro plan is just $1/month because we believe powerful AI study tools should be accessible to every student - that's less than a coffee or snack!
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            <span>Start free forever</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            <span>Pro at student budget: $1/month</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>

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
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    plan.popular 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  }`}>
                    {plan.badge}
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
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold">{plan.price}</div>
                    {plan.originalPrice && (
                      <div className="text-lg text-muted-foreground line-through">
                        {plan.originalPrice}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">{plan.period}</div>
                  </div>
                  {plan.originalPrice && (
                    <div className="text-sm text-green-600 font-medium">
                      Save 50% with student discount!
                    </div>
                  )}
                  <CardDescription>{plan.description}</CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-foreground">What's included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="size-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.limitations.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <h4 className="font-medium text-sm text-muted-foreground">Limitations:</h4>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <AlertCircle className="size-3 flex-shrink-0 mt-0.5" />
                            <span>{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrentPlan}
                  onClick={() => handlePlanSelect(plan.type)}
                >
                  {isCurrentPlan ? "Current Plan" : plan.cta}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plan Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
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

      {/* FAQ & Sustainability Note */}
      <div className="space-y-6 pt-8 border-t border-border">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Why Just $1 for Students?</h3>
          <div className="max-w-3xl mx-auto text-sm text-muted-foreground space-y-3">
            <p>
              <strong>Student-First Philosophy:</strong> We believe AI-powered learning tools should be accessible 
              to every student. At just $1/month, Pro gives you 30 AI interactions daily - that's less 
              than a cup of coffee but can transform your study experience.
            </p>
            <p>
              <strong>Sustainable & Realistic:</strong> Our $1 Pro plan covers our AI costs and supports platform development. 
              With our $4.99 Premium plan for power users, we can continue growing and adding 
              features you actually need, not fancy extras you'll never use.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="size-4" />
              Frequently Asked Questions
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Can I switch plans anytime?</p>
                <p className="text-muted-foreground">Yes! Contact us to upgrade or downgrade. Changes take effect the next billing cycle.</p>
              </div>
              <div>
                <p className="font-medium">Is this really just $1?</p>
                <p className="text-muted-foreground">Yes! We're students too and know budgets are tight. Our Pro plan is designed to be affordable for every student.</p>
              </div>
              <div>
                <p className="font-medium">Do you offer refunds?</p>
                <p className="text-muted-foreground">We offer a 7-day trial period. After that, refunds are handled case-by-case.</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Crown className="size-4" />
              What Makes Us Different
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Check className="size-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Honest pricing - no misleading "student discounts"</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="size-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>No hidden fees or surprise charges</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="size-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Built specifically for students by former students</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="size-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Continuous feature updates based on user feedback</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 