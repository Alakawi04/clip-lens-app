import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Languages } from "lucide-react";
import Logo from "@/components/Logo";
import LoginCreativeScene from "@/components/auth/LoginCreativeScene";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useI18n } from "@/lib/i18n";

export default function AuthExperienceShell({ children, mode = "login" }) {
  const { t, lang, toggleLang } = useI18n();
  const reduceMotion = useReducedMotion();
  const returnTo = safeReturnTo();
  const loginHref = "/login" + (returnTo !== "/" ? `?returnTo=${encodeURIComponent(returnTo)}` : "");
  const registerHref = "/register" + (returnTo !== "/" ? `?returnTo=${encodeURIComponent(returnTo)}` : "");
  const isRegister = mode === "register";

  return (
    <main className="auth-shell min-h-[100svh] bg-[#08090c] text-white lg:h-[100svh] lg:overflow-hidden">
      <div
        dir="ltr"
        className={`grid min-h-[100svh] lg:h-full ${isRegister ? "lg:grid-cols-[minmax(0,58%)_minmax(390px,42%)]" : "lg:grid-cols-[minmax(390px,42%)_minmax(0,58%)]"}`}
      >
        <motion.section
          dir={lang === "ar" ? "rtl" : "ltr"}
          initial={reduceMotion ? false : { opacity: 0, x: isRegister ? 90 : -90 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
          className={`auth-panel relative z-10 row-start-1 flex min-h-[100svh] flex-col bg-[#0d0d10] px-5 pb-4 pt-4 text-white sm:px-9 sm:pt-5 lg:h-full lg:min-h-0 lg:px-10 lg:py-6 xl:px-[clamp(3rem,6vw,6.5rem)] ${isRegister ? "lg:col-start-2" : "lg:col-start-1"}`}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-36 top-[20%] h-72 w-72 rounded-full bg-primary/[.07] blur-[100px]" />
            <div className="absolute -bottom-32 right-[-5rem] h-72 w-72 rounded-full bg-red-900/[.08] blur-[110px]" />
            <div className="absolute inset-0 opacity-[.035] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          </div>

          <header className="relative z-10 flex items-center justify-between">
            <Link to="/" aria-label="ClipLens home" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
              <Logo className="h-9 w-9" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLang}
                aria-label={lang === "en" ? "عربي" : "English"}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/[.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <Languages className="h-3.5 w-3.5 text-white/50" />
                {lang === "en" ? "عربي" : "EN"}
              </button>
            </div>
          </header>

          <div className="auth-panel-content relative z-10 mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-5 lg:py-0">
            <nav aria-label={t("auth.login.modeNavigation")} className="auth-mode-nav mb-5 grid grid-cols-2 rounded-xl border border-white/[.09] bg-white/[.025] p-1 sm:mb-6">
              <Link
                to={loginHref}
                aria-current={mode === "login" ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-center text-xs font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${mode === "login" ? "bg-white/[.09] text-white shadow-sm" : "text-white/45 hover:text-white/80"}`}
              >
                {t("auth.login.submit")}
              </Link>
              <Link
                to={registerHref}
                aria-current={mode === "register" ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-center text-xs font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${mode === "register" ? "bg-primary text-white shadow-[0_5px_18px_-8px_rgba(255,0,0,.8)]" : "text-white/45 hover:text-white/80"}`}
              >
                {t("auth.login.create")}
              </Link>
            </nav>
            {children}
          </div>

          <footer className="auth-terms relative z-10 mx-auto w-full max-w-[430px] text-center font-mono text-[9px] font-medium leading-4 text-white/35 sm:text-[10px]">
            {t("auth.terms.pre")}{" "}
            <Link to="/terms" className="text-white/60 underline-offset-2 transition-colors hover:text-red-300 hover:underline">{t("footer.terms")}</Link>
            {" "}{t("auth.terms.mid")}{" "}
            <Link to="/privacy" className="text-white/60 underline-offset-2 transition-colors hover:text-red-300 hover:underline">{t("footer.privacy")}</Link>
          </footer>
        </motion.section>

        <LoginCreativeScene mode={mode} />
      </div>
    </main>
  );
}
