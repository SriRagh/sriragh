"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { Building2, Loader2, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const passwordValue = watch("password");
  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password);
    } catch (error: any) {
      const description =
        error.message?.toLowerCase().includes("bad credentials") ||
        error.message?.toLowerCase().includes("invalid credentials")
          ? "Invalid Credentials"
          : error.message || "An unexpected error occurred.";
      toast({
        title: "Login Failed",
        description,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative w-full p-4 flex items-center justify-center overflow-hidden flex-1">
      <div className="relative z-10 w-full max-w-md lg:max-w-4xl xl:max-w-6xl">
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-lg border border-border/20 grid md:grid-cols-2 items-center overflow-hidden">
          <div className="p-6 sm:p-8 md:p-10 animate-fade-in-right">
            <div className="text-center md:text-left mb-6">
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome Back
              </h1>
              <p className="text-muted-foreground mt-2">
                Sign in to manage your meeting spaces.
              </p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  autoComplete="email"
                  placeholder="name@company.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="password-input"
                  />
                  {passwordValue && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  )}
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-base font-bold"
                disabled={isSubmitting || isLoggingIn}
              >
                {isSubmitting || isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <div className="text-sm text-center">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </form>
          </div>
          <div className="hidden md:block relative w-full h-full p-6 animate-fade-in-left">
            <div className="relative aspect-w-4 aspect-h-3 rounded-xl overflow-hidden">
              <Image
                src="/IMG_3835.jpg"
                alt="Conference room"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
