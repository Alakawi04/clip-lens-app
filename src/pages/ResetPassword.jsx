import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import AuthSplit from "@/components/auth/AuthSplit";
import { useI18n } from "@/lib/i18n";

export default function ResetPassword() {
  const { t } = useI18n();

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
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || t("auth.error"));
    } finally {
      setLoading(false);
    }
  };

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