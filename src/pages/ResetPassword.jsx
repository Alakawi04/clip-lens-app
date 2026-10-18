import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthSplit from "@/components/auth/AuthSplit";
import { useI18n } from "@/lib/i18n";

export default function ResetPassword() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError(t("auth.mismatch"));
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || t("auth.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthSplit
        icon={AlertTriangle}
        title={t("auth.reset.invalid.title")}
        subtitle={t("auth.reset.invalid.subtitle")}
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            {t("auth.reset.newLink")}
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          {t("auth.reset.invalid.body")}
        </p>
      </AuthSplit>
    );
  }

  return (
    <AuthSplit
      icon={Lock}
      title={t("auth.reset.title")}
      subtitle={t("auth.reset.subtitle")}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">{t("auth.reset.newPassword")}</Label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="ps-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-sm font-medium text-foreground">{t("auth.confirmPassword")}</Label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="ps-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-semibold" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("auth.reset.loading")}
            </>
          ) : (
            t("auth.reset.submit")
          )}
        </Button>
      </form>
    </AuthSplit>
  );
}