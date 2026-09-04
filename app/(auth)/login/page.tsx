"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { LogIn, KeyRound, Mail, Info } from "lucide-react";
import { Button, Input, AlertBanner } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/queue";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage("Invalid email address or password. Please check your credentials.");
        setIsLoading(false);
      } else if (res?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected authentication error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleFillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setErrorMessage(null);
  };

  return (
    // p-4 on all screens — enough breathing room without wasting vertical space
    <div className="p-4 space-y-3">
      <div className="text-center">
        <h2 className="text-sm font-bold text-[#0F172A]">Staff Sign In</h2>
        <p className="text-[11px] text-[#64748B] mt-0.5">
          Enter your clinic email and password to access the workstation.
        </p>
      </div>

      {errorMessage && <AlertBanner type="error" message={errorMessage} />}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <Input
          label="Staff Email"
          type="email"
          placeholder="e.g. receptionist@mabvuku.co.zw"
          isRequired
          icon={<Mail className="w-4 h-4 text-[#64748B]" />}
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          disabled={isLoading}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••••••"
          isRequired
          icon={<KeyRound className="w-4 h-4 text-[#64748B]" />}
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          disabled={isLoading}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
          icon={<LogIn className="w-4 h-4" />}
        >
          Sign In to Workstation
        </Button>
      </form>

      {/* Demo Staff Accounts */}
      <div className="pt-2.5 border-t border-[#F1F5F9]">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#334155] mb-1.5">
          <Info className="w-3 h-3 text-[#1E4DB7] shrink-0" />
          <span>Demo Accounts (Password: Password123!)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleFillDemoAccount("receptionist@mabvuku.co.zw")}
            className="px-2 py-1 bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE] text-[11px] font-medium rounded border border-[#93C5FD]/40 cursor-pointer"
          >
            Receptionist
          </button>
          <button
            type="button"
            onClick={() => handleFillDemoAccount("doctor@mabvuku.co.zw")}
            className="px-2 py-1 bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE] text-[11px] font-medium rounded border border-[#93C5FD]/40 cursor-pointer"
          >
            Doctor
          </button>
          <button
            type="button"
            onClick={() => handleFillDemoAccount("admin@mabvuku.co.zw")}
            className="px-2 py-1 bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE] text-[11px] font-medium rounded border border-[#93C5FD]/40 cursor-pointer"
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    /*
     * overflow-y-auto  — page scrolls if the card is taller than the viewport
     * justify-start    — card starts near the top on tiny screens (320px)
     * sm:justify-center — centred on anything wider than 640px where there is
     *                     typically enough height to show the full card
     * py-6             — top/bottom breathing room so the card doesn't touch
     *                     screen edges on short phones
     */
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-start sm:justify-center py-6 px-4 font-sans overflow-y-auto">
      <div className="w-full max-w-sm bg-white rounded-xl border border-[#E2E8F0] shadow-lg overflow-hidden">

        {/* ── Header banner ───────────────────────────────────────
            Reduced from p-6 → py-3 px-4 on mobile.
            Logo shrinks from 64px → 40px on mobile.
            Title shrinks from text-xl → text-sm on mobile.
            Subtitle shortened to fit one line at 320px.
        */}
        <div className="bg-[#0B2D6B] text-white py-3 px-4 sm:py-4 sm:px-6 text-center flex flex-col items-center border-b border-[#1E4DB7]/40">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 mb-1.5 sm:mb-2">
            <Image
              src="/images/harare-crest.svg"
              alt="City of Harare Crest"
              width={56}
              height={56}
              className="object-contain drop-shadow-md w-full h-full"
              priority
            />
          </div>
          <h1 className="text-sm sm:text-base font-extrabold tracking-wide text-white leading-tight">
            MABVUKU POLYCLINIC
          </h1>
          <p className="text-[10px] sm:text-[11px] text-[#93C5FD] mt-0.5 font-medium leading-tight">
            City of Harare · Staff Workstation
          </p>
        </div>

        <Suspense
          fallback={
            <div className="p-6 text-center text-xs text-[#64748B]">
              Loading sign in portal...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
