"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

type UserBillingInfo = {
  planType: "FREE" | "BASIC" | "PREMIUM";
  billingStatus: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  dailyGenerationsUsed: number;
  remaining: number;
  limit: number;
  planEndDate: Date | null;
  billingEmail: string | null;
};

export default function ConditionalFooter() {
  const [shouldShowAds, setShouldShowAds] = useState(true); // Default to show ads
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUserPlan() {
      try {
        // Check if user is authenticated first
        const authResponse = await fetch('/api/auth/user', { 
          method: 'GET',
          credentials: 'include'
        });
        
        if (!authResponse.ok) {
          // Not authenticated, show ads
          setShouldShowAds(true);
          setIsLoading(false);
          return;
        }

        const userData = await authResponse.json();
        
        if (userData.user?.id) {
          // Get billing info
          const billingResponse = await fetch(`/api/user/billing?userId=${userData.user.id}`, {
            method: 'GET',
            credentials: 'include'
          });
          
          if (billingResponse.ok) {
            const billingInfo: UserBillingInfo = await billingResponse.json();
            // Hide ads for premium users
            setShouldShowAds(billingInfo.planType === "FREE");
          } else {
            // Default to showing ads if we can't get billing info
            setShouldShowAds(true);
          }
        } else {
          // No user, show ads
          setShouldShowAds(true);
        }
      } catch (error) {
        console.error('Error checking user plan:', error);
        // Default to showing ads on error
        setShouldShowAds(true);
      } finally {
        setIsLoading(false);
      }
    }

    checkUserPlan();
  }, []);

  if (isLoading) {
    return (
      <footer className="w-full border-t bg-background/95 py-6 flex flex-col items-center justify-center mt-auto">
        <div className="flex flex-col items-center space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <a href="/terms" className="hover:text-primary transition-colors">
              Terms & Conditions
            </a>
            <span>•</span>
            <a href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
          </div>
          <p className="text-xs">
            © {new Date().getFullYear()} NoteJewel. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full border-t bg-background/95 py-6 flex flex-col items-center justify-center mt-auto">
      {/* Google AdSense Responsive Ad Unit - Only for Free Users */}
      {shouldShowAds && (
        <>
          <div className="w-full flex justify-center mb-4">
            <ins 
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', minHeight: 90 }}
              data-ad-client="ca-pub-4143521375584293"
              data-ad-slot="5678901234"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
          <Script id="adsbygoogle-footer" strategy="afterInteractive">
            {`(adsbygoogle = window.adsbygoogle || []).push({});`}
          </Script>
        </>
      )}
      
      {/* Footer Links */}
      <div className="flex flex-col items-center space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <a href="/terms" className="hover:text-primary transition-colors">
            Terms & Conditions
          </a>
          <span>•</span>
          <a href="/privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </a>
        </div>
        <p className="text-xs">
          © {new Date().getFullYear()} NoteJewel. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
