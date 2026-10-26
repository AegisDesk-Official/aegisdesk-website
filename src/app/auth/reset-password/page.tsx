"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema } from "@/lib/validation/index";
import { z } from "zod";

type ResetFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <Bot className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl text-foreground">AegisDesk</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Set New Password</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Password Reset Successfully</h3>
              <p className="text-xs text-muted-foreground">
                Your credentials have been securely updated in the auth system.
              </p>
              <Link href="/auth/sign-in">
                <Button className="w-full mt-2">Sign In with New Password</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                id="password"
                type="password"
                label="New Password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />

              <Input
                id="confirmPassword"
                type="password"
                label="Confirm New Password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full h-10 mt-2">
                Update Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
