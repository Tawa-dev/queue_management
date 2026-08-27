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
    <div className="p-6 space-y-5">
      <div className="text-center">
        <h2 className="text-base font-bold text-[#0F172A]">Staff Sign In</h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Enter your clinic email and password to access the workstation.
        </p>
      </div>

      {errorMessage && <AlertBanner type="error" message={errorMessage} />}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          className="mt-2"
        >
          Sign In to Workstation
        </Button>
      </form>

      {/* Development Seed Account Helper */}
      <div className="pt-4 border-t border-[#F1F5F9]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#334155] mb-2">
          <Info className="w-3.5 h-3.5 text-[#1E4DB7]" />
          <span>Demo Staff Accounts (Password: Password123!)</span>
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
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#E2E8F0] shadow-lg overflow-hidden">
        {/* Header Banner */}
        <div className="bg-[#0B2D6B] text-white p-6 text-center flex flex-col items-center border-b border-[#1E4DB7]/40">
          <div className="relative w-16 h-16 mb-3">
            <Image
              src="/images/harare-crest.svg"
              alt="City of Harare Crest"
              width={64}
              height={64}
              className="object-contain drop-shadow-md"
              priority
            />
          </div>
          <h1 className="text-xl font-extrabold tracking-wide text-white">
            MABVUKU POLYCLINIC
          </h1>
          <p className="text-xs text-[#93C5FD] mt-1 font-medium">
            City of Harare Outpatient Staff Workstation
          </p>
        </div>

        {/* Suspense Wrapped Login Form */}
        <Suspense
          fallback={
            <div className="p-8 text-center text-xs text-[#64748B]">
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
