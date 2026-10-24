import React, { useState } from "react";
import { setRememberSession, supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowRight, Lock, Mail, Loader2, UserPlus } from "lucide-react";
import AuthExperienceShell from "@/components/auth/AuthExperienceShell";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useI18n } from "@/lib/i18n";

export default function Register() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const returnTo = safeReturnTo();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t("auth.mismatch"));
      return;
    }
    setLoading(true);
    try {
      setRememberSession(true);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}${returnTo}` },
      });
      if (signUpError) throw signUpError;
      if (data.session) {
        window.location.href = returnTo;
        return;
      }
      setShowOtp(true);
    } catch (authError) {
      setError(authError.message || t("auth.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: otpCode, type: "signup" });
      if (verifyError) throw verifyError;
      window.location.href = returnTo;
    } catch (authError) {
      setError(authError.message || t("auth.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
      if (resendError) throw resendError;
      toast({
        title: t("auth.otp.toastTitle"),
        description: t("auth.otp.toastDesc"),
      });
    } catch (authError) {
      setError(authError.message || t("auth.error"));
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      setRememberSession(true);
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}${returnTo}` },
      });
      if (signInError) throw signInError;
    } catch (authError) {
      setError(authError.message || t("auth.error"));
      setLoading(false);
    }
  };

  if (showOtp) {
    return (
      <AuthExperienceShell mode="register">
        <div className="auth-form-heading mb-8">
          <div className="auth-heading-icon mb-6 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-300/15 bg-gradient-to-br from-primary/20 to-red-950/20 text-red-200 shadow-[0_12px_32px_-14px_rgba(255,0,0,.55)]">
            <Mail className="h-5 w-5" />
          </div>
          <p className="font-mono text-[10px] font-medium uppercase tracking-[.2em] text-red-300/80">{t("auth.login.eyebrow")}</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t("auth.otp.title")}</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">{t("auth.otp.sent")} {email}</p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-300/20 bg-rose-400/[.08] p-3.5 text-sm text-rose-100" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <div className="mb-6 flex justify-center">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          className="auth-register-submit h-[52px] w-full rounded-xl border border-red-200/20 bg-gradient-to-r from-primary to-[#d51d2c] font-bold text-white shadow-[0_12px_32px_-18px_rgba(255,0,0,.75)] transition-all hover:-translate-y-0.5 hover:from-[#ed1b2b] hover:to-[#bd1423] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d10]"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t("auth.otp.verifying")}
            </>
          ) : (
            t("auth.otp.verify")
          )}
        </Button>
        <p className="mt-5 text-center text-sm text-white/50">
          {t("auth.otp.resendQ")}{" "}
          <button onClick={handleResend} className="font-semibold text-red-300 hover:text-red-200 hover:underline">
            {t("auth.otp.resend")}
          </button>
        </p>
      </AuthExperienceShell>
    );
  }

  return (
    <AuthExperienceShell mode="register">
      <div className="auth-form-heading mb-7">
        <div className="auth-heading-icon mb-6 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-300/15 bg-gradient-to-br from-primary/20 to-red-950/20 text-red-200 shadow-[0_12px_32px_-14px_rgba(255,0,0,.55)]">
          <UserPlus className="h-5 w-5" />
        </div>
        <p className="font-mono text-[10px] font-medium uppercase tracking-[.2em] text-red-300/80">{t("auth.login.eyebrow")}</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t("auth.register.title")}</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">{t("auth.register.subtitle")}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-300/20 bg-rose-400/[.08] p-3.5 text-sm text-rose-100" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} autoComplete="off" className="auth-register-form space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="register-email" className="text-xs font-normal text-white/75">{t("auth.email")}</Label>
          <div className="group relative">
            <Mail className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-red-300" aria-hidden="true" />
            <Input
              id="register-email"
              name="register-email"
              type="email"
              autoComplete="off"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-xl border-white/[.11] bg-white/[.035] ps-11 text-white placeholder:text-white/30 shadow-none transition-colors hover:border-white/20 focus-visible:border-red-300/60 focus-visible:ring-2 focus-visible:ring-red-400/15"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-password" className="text-xs font-normal text-white/75">{t("auth.password")}</Label>
          <div className="group relative">
            <Lock className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-red-300" aria-hidden="true" />
            <Input
              id="register-password"
              name="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-xl border-white/[.11] bg-white/[.035] ps-11 text-white placeholder:text-white/30 shadow-none transition-colors hover:border-white/20 focus-visible:border-red-300/60 focus-visible:ring-2 focus-visible:ring-red-400/15"
              required
              minLength={8}
            />
          </div>
          <p className="text-[11px] text-white/40">{t("auth.register.minChars")}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password" className="text-xs font-normal text-white/75">{t("auth.confirmPassword")}</Label>
          <div className="group relative">
            <Lock className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-red-300" aria-hidden="true" />
            <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-12 rounded-xl border-white/[.11] bg-white/[.035] ps-11 text-white placeholder:text-white/30 shadow-none transition-colors hover:border-white/20 focus-visible:border-red-300/60 focus-visible:ring-2 focus-visible:ring-red-400/15"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="group mt-1 h-[52px] w-full rounded-xl border border-red-200/20 bg-gradient-to-r from-primary to-[#d51d2c] text-sm font-extrabold text-white shadow-[0_12px_32px_-18px_rgba(255,0,0,.75)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#ed1b2b] hover:to-[#bd1423] hover:shadow-[0_16px_38px_-18px_rgba(255,0,0,.85)] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d10]"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t("auth.register.loading")}
            </>
          ) : (
            <>
              {t("auth.register.submit")}
              <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
            </>
          )}
        </Button>
      </form>

      <div className="auth-social-divider relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[.09]" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-[.18em]">
          <span className="bg-[#0d0d10] px-3 font-mono font-medium text-white/35">{t("auth.login.orContinueWith")}</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="auth-social-button h-[50px] w-full rounded-xl border-white/[.12] bg-white/[.035] text-sm font-normal text-white/90 shadow-none transition-colors hover:border-red-200/25 hover:bg-white/[.075] hover:text-white focus-visible:ring-red-300"
        onClick={handleGoogle}
        disabled={loading}
      >
        {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="me-2 h-5 w-5" />}
        {t("auth.google")}
      </Button>
    </AuthExperienceShell>
  );
}
