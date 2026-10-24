import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthSplit from "@/components/auth/AuthSplit";
import { useI18n } from "@/lib/i18n";

export default function ForgotPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (resetError) {
      setError(resetError.message || t("auth.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplit
      icon={Mail}
      title={t("auth.forgot.title")}
      subtitle={t("auth.forgot.subtitle")}
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline me-1 rtl:rotate-180" />
          {t("auth.forgot.back")}
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-foreground text-center">{t("auth.forgot.sent")}</p>
      ) : (
        <>
        {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">{t("auth.forgot.email")}</Label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ps-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-semibold" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("auth.forgot.sending")}
              </>
            ) : (
              t("auth.forgot.send")
            )}
          </Button>
        </form>
        </>
      )}
    </AuthSplit>
  );
}