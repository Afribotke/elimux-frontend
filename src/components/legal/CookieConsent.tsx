"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem("cookie_consent", "all");
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
    setIsVisible(false);
  };

  const acceptEssential = () => {
    localStorage.setItem("cookie_consent", "essential");
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 z-50">
      <div className="container mx-auto max-w-4xl flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1">
          <p className="text-sm">
            We use cookies to enhance your experience. Essential cookies are always active. 
            You can choose to accept analytics and marketing cookies. 
            <a href="/cookies" className="text-emerald-400 hover:underline ml-1">Learn more</a>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={acceptEssential} className="border-slate-600 text-white hover:bg-slate-800">
            Essential Only
          </Button>
          <Button size="sm" onClick={acceptAll} className="bg-emerald-600 hover:bg-emerald-700">
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
