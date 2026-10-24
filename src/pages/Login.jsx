import React, { useState } from "react";
import { Link } from "react-router-dom";
import { setRememberSession, supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Loader2, Sparkles } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import AuthExperienceShell from "@/components/auth/AuthExperienceShell";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useI18n } from "@/lib/i18n";

export default function Login() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  // Same-origin paths only; preserves OAuth consent and other return flows.
  const returnTo = safeReturnTo();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      setRememberSession(rememberMe);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      window.location.href = returnTo;
    } catch (authError) {
      setError(authError.message || t("auth.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      setRememberSession(rememberMe);
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

  return (
    <AuthExperienceShell mode="login">
      <div className="auth-form-heading animate-rise mb-8" style={{ animationDelay: "50ms" }}>
        <div className="auth-heading-icon mb-6 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-300/15 bg-gradient-to-br from-primary/20 to-red-950/20 text-red-200 shadow-[0_12px_32px_-14px_rgba(255,0,0,.55)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="font-mono text-[10px] font-medium uppercase tracking-[.2em] text-red-300/80">{t("auth.login.eyebrow")}</p>
        <h1 className="mt-3 max-w-[10ch] font-display text-[clamp(2.4rem,3.5vw,3.0625rem)] font-semibold leading-[1.08] tracking-[-0.055em]">{t("auth.login.visualTitle")}</h1>
        <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">{t("auth.login.subtitle")}</p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-300/20 bg-rose-400/[.08] p-3.5 text-sm text-rose-100" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} autoComplete="off" className="auth-login-form animate-rise space-y-4" style={{ animationDelay: "190ms" }}>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-normal text-white/75">{t("auth.email")}</Label>
          <div className="group relative">
            <Mail className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-red-300" aria-hidden="true" />
            <Input
              id="email"
              name="login-email"
              type="email"
              autoComplete="off"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-[50px] rounded-xl border-white/[.11] bg-white/[.035] ps-11 text-white placeholder:text-white/30 shadow-none transition-colors hover:border-white/20 focus-visible:border-red-300/60 focus-visible:ring-2 focus-visible:ring-red-400/15"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-normal text-white/75">{t("auth.password")}</Label>
          <div className="group relative">
            <Lock className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-red-300" aria-hidden="true" />
            <Input
              id="password"
              name="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-[50px] rounded-xl border-white/[.11] bg-white/[.035] ps-11 pe-11 text-white placeholder:text-white/30 shadow-none transition-colors hover:border-white/20 focus-visible:border-red-300/60 focus-visible:ring-2 focus-visible:ring-red-400/15"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? t("auth.password.hide") : t("auth.password.show")}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 rounded p-1 text-white/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <label className="inline-flex cursor-pointer items-center gap-2.5 text-xs font-normal text-white/55">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-white/25 bg-white/[.04] accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            />
            {t("auth.login.rememberMe")}
          </label>
          <Link to="/forgot-password" className="text-xs font-normal text-red-300/80 transition-colors hover:text-red-200 hover:underline">
            {t("auth.forgot")}
          </Link>
        </div>

        <Button
          type="submit"
          className="group h-[52px] w-full rounded-xl border border-red-200/20 bg-gradient-to-r from-primary to-[#d51d2c] text-sm font-extrabold text-white shadow-[0_12px_32px_-18px_rgba(255,0,0,.75)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#ed1b2b] hover:to-[#bd1423] hover:shadow-[0_16px_38px_-18px_rgba(255,0,0,.85)] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d10]"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t("auth.login.authenticating")}
            </>
          ) : (
            <>
              {t("auth.login.enterStudio")}
              <ArrowRight className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
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
