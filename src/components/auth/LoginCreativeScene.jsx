import React, { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  AudioLines,
  Check,
  Clapperboard,
  Play,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSiteSettings } from "@/lib/SiteSettingsContext";

export default function LoginCreativeScene({ mode = "login" }) {
  const { t, lang } = useI18n();
  const { settings } = useSiteSettings();
  const sceneRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const images = (Array.isArray(settings.hero_images) ? settings.hero_images : [])
    .filter((image) => typeof image === "string" && image.length > 0);
  const thumbnails = images.length ? images : [settings.hero_image_url].filter(Boolean);
  const mainImage = thumbnails[0];
  const sideImage = thumbnails[1] || mainImage;
  const topImage = thumbnails[2] || mainImage;
  const fourthImage = thumbnails[3] || mainImage;

  const handlePointerMove = (event) => {
    if (reduceMotion || !sceneRef.current || event.pointerType === "touch") return;
    const bounds = sceneRef.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    sceneRef.current.style.setProperty("--scene-rx", `${-y * 3}deg`);
    sceneRef.current.style.setProperty("--scene-ry", `${x * 4}deg`);
    sceneRef.current.querySelectorAll("[data-scene-depth]").forEach((layer) => {
      const depth = Number(layer.getAttribute("data-scene-depth"));
      layer.style.setProperty("--parallax-x", `${x * depth}px`);
      layer.style.setProperty("--parallax-y", `${y * depth}px`);
    });
  };

  const resetPointer = () => {
    if (!sceneRef.current) return;
    sceneRef.current.style.setProperty("--scene-rx", "0deg");
    sceneRef.current.style.setProperty("--scene-ry", "0deg");
    sceneRef.current.querySelectorAll("[data-scene-depth]").forEach((layer) => {
      layer.style.setProperty("--parallax-x", "0px");
      layer.style.setProperty("--parallax-y", "0px");
    });
  };

  return (
    <motion.aside
      ref={sceneRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      aria-label={t("auth.login.sceneLabel")}
      dir={lang === "ar" ? "rtl" : "ltr"}
      initial={reduceMotion ? false : { opacity: 0, x: mode === "register" ? -90 : 90 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.75, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={`auth-scene relative isolate row-start-1 hidden min-h-screen overflow-hidden bg-[#080912] text-white lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:justify-between ${mode === "register" ? "lg:col-start-1" : "lg:col-start-2"}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_35%,rgba(255,0,0,.15),transparent_42%),radial-gradient(ellipse_at_28%_80%,rgba(133,20,30,.12),transparent_38%),linear-gradient(145deg,#100b0d_0%,#09090c_55%,#100b0e_100%)]" />
        <div className="absolute inset-0 opacity-[.12] [background-image:linear-gradient(rgba(255,255,255,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.14)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
        <div className="absolute inset-0 bg-grain opacity-[.09]" />
        <div className="auth-scene-halo absolute -end-32 top-[18%] h-[34rem] w-[34rem] rounded-full bg-primary/15 blur-[120px]" />
        <div className="auth-scene-halo auth-scene-halo-delay absolute -start-24 bottom-[5%] h-80 w-80 rounded-full bg-red-900/15 blur-[110px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-8 pt-7 xl:px-14 xl:pt-9">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-red-300/15 bg-white/[.06] text-red-200 shadow-lg shadow-red-950/30">
            <Clapperboard className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">{settings.brand_name || "ClipLens"}</span>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-red-300/15 bg-red-300/[.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-red-100/75">
          <span className="h-1.5 w-1.5 rounded-full bg-red-300 shadow-[0_0_9px_rgba(248,113,113,.75)]" />
          {t("auth.login.sceneBadge")}
        </span>
      </header>

      <div className="relative mx-auto flex w-full max-w-[980px] flex-1 items-center justify-center px-8 py-2 xl:px-12">
        <div aria-hidden="true" className="auth-orbit auth-orbit-one absolute h-[min(69vh,680px)] aspect-square rounded-full border border-red-200/[.08]" />
        <div aria-hidden="true" className="auth-orbit auth-orbit-two absolute h-[min(53vh,520px)] aspect-square rounded-full border border-red-100/[.07]" />
        <div aria-hidden="true" className="auth-scene-particle absolute left-[10%] top-[18%] h-1 w-1 rounded-full bg-red-100 shadow-[0_0_12px_3px_rgba(248,113,113,.7)]" />
        <div aria-hidden="true" className="auth-scene-particle auth-scene-particle-delay absolute right-[13%] top-[30%] h-1.5 w-1.5 rounded-full bg-orange-100 shadow-[0_0_14px_4px_rgba(251,146,60,.45)]" />
        <div aria-hidden="true" className="auth-scene-particle auth-scene-particle-slow absolute bottom-[19%] left-[19%] h-1 w-1 rounded-full bg-white/80 shadow-[0_0_10px_3px_rgba(255,255,255,.35)]" />

        <div
          className="auth-scene-world relative mx-auto h-[min(70vh,700px)] w-full max-w-[850px]"
          style={{ transform: "perspective(1200px) rotateX(var(--scene-rx, 0deg)) rotateY(var(--scene-ry, 0deg))" }}
        >
          <div className="absolute inset-x-[4%] top-[3%] z-20 flex items-center justify-between font-mono text-[8px] font-medium uppercase tracking-[.2em] text-white/40 sm:text-[9px]">
            <span className="inline-flex items-center gap-2">
              <span className="auth-status-dot h-1.5 w-1.5 rounded-full bg-red-300" />
              {t("auth.login.sceneIndex")}
            </span>
            <span className="inline-flex items-center gap-2">
              {t("auth.login.sceneDemo")}
              <span className="flex items-end gap-[2px]" aria-hidden="true">
                <i className="auth-signal-bar h-2 w-[2px] rounded-full bg-red-300/80" />
                <i className="auth-signal-bar h-3 w-[2px] rounded-full bg-red-300/80 [animation-delay:-.3s]" />
                <i className="auth-signal-bar h-1.5 w-[2px] rounded-full bg-red-300/80 [animation-delay:-.6s]" />
              </span>
            </span>
          </div>

          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-80" viewBox="0 0 900 680" fill="none">
            <path className="auth-flow-line" d="M98 384C200 384 213 265 322 265" stroke="url(#linkA)" strokeWidth="1.2" strokeDasharray="4 7" />
            <path className="auth-flow-line auth-flow-line-slow" d="M596 265C696 265 682 160 789 160" stroke="url(#linkB)" strokeWidth="1.2" strokeDasharray="4 7" />
            <path className="auth-flow-line auth-flow-line-reverse" d="M574 403C694 403 695 493 818 493" stroke="url(#linkC)" strokeWidth="1.2" strokeDasharray="4 7" />
            <circle cx="322" cy="265" r="3" fill="#fca5a5" />
            <circle cx="596" cy="265" r="3" fill="#fb7185" />
            <circle cx="574" cy="403" r="3" fill="#ef4444" />
            <defs>
              <linearGradient id="linkA" x1="98" y1="324" x2="322" y2="324" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fca5a5" stopOpacity=".1" />
                <stop offset="1" stopColor="#ef4444" stopOpacity=".8" />
              </linearGradient>
              <linearGradient id="linkB" x1="596" y1="212" x2="789" y2="212" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ef4444" stopOpacity=".7" />
                <stop offset="1" stopColor="#fb7185" stopOpacity=".15" />
              </linearGradient>
              <linearGradient id="linkC" x1="574" y1="448" x2="818" y2="448" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fb7185" stopOpacity=".65" />
                <stop offset="1" stopColor="#ef4444" stopOpacity=".1" />
              </linearGradient>
            </defs>
          </svg>

          <div className="auth-scene-core absolute left-1/2 top-[53%] h-[min(58vw,430px)] max-h-[62%] w-[min(68%,560px)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/[.14] bg-[#101012]/80 p-3 shadow-[0_45px_110px_-35px_rgba(0,0,0,.9),0_0_80px_-38px_rgba(180,20,35,.45)] backdrop-blur-xl sm:p-4">
            <div className="flex items-center justify-between px-1 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-red-500/30 to-rose-400/20 text-red-100 ring-1 ring-white/10">
                  <ScanLine className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-bold tracking-wide text-white/90">{t("auth.demo.title")}</p>
                  <p className="text-[9px] uppercase tracking-[.16em] text-white/40">{t("auth.login.sceneDemo")}</p>
                </div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white/45">
                {t("auth.demo.badge")}
              </span>
            </div>

            <div className="relative h-[calc(100%-3rem)] min-h-0 overflow-hidden rounded-[1.3rem] border border-white/10 bg-[#11121a]">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt=""
                  className="auth-scene-image absolute inset-0 h-full w-full object-cover opacity-80"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-[#241014] to-[#130a0c]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#070810] via-[#090a14]/25 to-[#070810]/25" />
              <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(115deg,transparent_25%,rgba(255,100,100,.12)_48%,transparent_68%)]" />
              <div aria-hidden="true" className="auth-scene-scanline absolute inset-x-0 top-0 h-px" />

              <div className="absolute inset-x-4 top-4 flex items-center justify-between sm:inset-x-5 sm:top-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[.14em] text-white/75 backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-red-200" />
                  {t("auth.login.sceneAnalysis")}
                </div>
                <Activity className="h-4 w-4 text-red-100/70" />
              </div>

              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5">
                <div className="max-w-[68%]">
                  <p className="text-[9px] font-semibold uppercase tracking-[.19em] text-red-200/75">{t("auth.login.sceneSuggestion")}</p>
                  <p className="mt-1.5 font-display text-lg font-extrabold leading-tight text-white sm:text-2xl">
                    {t("auth.login.sceneTitle")}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
                    {Array.from({ length: 22 }, (_, index) => (
                      <span
                        key={index}
                        className="auth-wave-bar w-1 rounded-full bg-gradient-to-t from-red-500/40 to-orange-200/90"
                        style={{ height: `${8 + ((index * 17) % 19)}px`, opacity: 0.45 + ((index * 7) % 5) * 0.1, animationDelay: `${index * 0.04}s` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-center rounded-2xl border border-white/15 bg-[#0b0c15]/75 px-3 py-2.5 shadow-xl backdrop-blur-lg sm:px-4 sm:py-3">
                  <span className="font-display text-3xl font-extrabold leading-none text-white sm:text-4xl">87</span>
                  <span className="mt-1 text-[8px] font-bold uppercase tracking-[.16em] text-white/45">{t("auth.demo.thumbScore")}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-200">
                    <Check className="h-3 w-3" /> {t("auth.login.sceneDemo")}
                  </span>
                </div>
              </div>

              <div className="auth-play-pulse absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/30 text-white shadow-[0_0_35px_rgba(239,68,68,.35)] backdrop-blur-md">
                <Play className="ms-0.5 h-4 w-4 fill-current" />
              </div>
            </div>
          </div>

          <div data-scene-depth="16" className="auth-float-card auth-parallax-layer auth-float-slower absolute left-[2%] top-[23%] w-[clamp(118px,15vw,190px)] overflow-hidden rounded-2xl border border-white/15 bg-[#171416]/90 p-2 shadow-[0_24px_55px_-22px_rgba(0,0,0,.9)] backdrop-blur-xl" style={{ "--base-tilt": "-8deg" }}>
            <div className="relative aspect-[1.45] overflow-hidden rounded-xl bg-red-950">
              {sideImage && <img src={sideImage} alt="" loading="lazy" className="h-full w-full object-cover opacity-85" />}
              <span className="absolute bottom-2 left-2 rounded-md border border-white/20 bg-black/45 px-1.5 py-1 text-[8px] font-bold uppercase tracking-widest text-white/85">
                {t("auth.login.sceneFrame")}
              </span>
            </div>
            <div className="flex items-center justify-between px-1 pt-2">
              <span className="text-[9px] font-semibold text-white/70">{t("auth.login.sceneClarity")}</span>
              <span className="text-[9px] font-bold text-red-200">92%</span>
            </div>
          </div>

          <div data-scene-depth="20" className="auth-float-card auth-parallax-layer absolute right-[1%] top-[17%] w-[clamp(135px,17vw,205px)] rounded-2xl border border-red-100/15 bg-[#171416]/90 p-3 shadow-[0_24px_55px_-22px_rgba(0,0,0,.9)] backdrop-blur-xl" style={{ "--base-tilt": "7deg" }}>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-300/10 text-red-200">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/55">{t("auth.login.sceneTitleIdea")}</span>
            </div>
            <p className="mt-2 text-[11px] font-bold leading-snug text-white/90">{t("auth.login.sceneTitle")}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-red-200/80">
              <ArrowUpRight className="h-3 w-3" /> {t("auth.login.sceneDemo")}
            </span>
          </div>

          <div data-scene-depth="12" className="auth-float-card auth-parallax-layer auth-float-slow absolute bottom-[12%] right-[4%] w-[clamp(140px,18vw,210px)] rounded-2xl border border-red-100/15 bg-[#171416]/90 p-3 shadow-[0_24px_55px_-22px_rgba(0,0,0,.9)] backdrop-blur-xl" style={{ "--base-tilt": "-6deg" }}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/55">{t("auth.login.sceneSignal")}</span>
              <AudioLines className="h-3.5 w-3.5 text-red-200" />
            </div>
            <div aria-hidden="true" className="mt-3 flex h-8 items-center justify-between gap-[3px]">
              {Array.from({ length: 24 }, (_, index) => (
                <span
                  key={index}
                  className="auth-wave-bar w-[3px] rounded-full bg-gradient-to-t from-red-500/50 to-orange-200"
                  style={{ height: `${6 + ((index * 11) % 22)}px`, opacity: 0.35 + ((index * 3) % 6) * 0.1, animationDelay: `${index * 0.045}s` }}
                />
              ))}
            </div>
            {topImage && (
              <img src={topImage} alt="" loading="lazy" className="mt-2 h-12 w-full rounded-lg object-cover opacity-70" />
            )}
          </div>

          <div data-scene-depth="14" className="auth-float-card auth-parallax-layer auth-float-slower absolute bottom-[12%] left-[3%] w-[clamp(112px,14vw,170px)] overflow-hidden rounded-2xl border border-white/15 bg-[#171416]/90 p-2 shadow-[0_24px_55px_-22px_rgba(0,0,0,.9)] backdrop-blur-xl" style={{ "--base-tilt": "5deg" }}>
            <div className="relative aspect-[1.5] overflow-hidden rounded-xl bg-red-950">
              {fourthImage && <img src={fourthImage} alt="" loading="lazy" className="h-full w-full object-cover opacity-80" />}
              <span className="absolute inset-x-2 bottom-2 flex items-center justify-between rounded-lg border border-white/10 bg-black/45 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-white/75 backdrop-blur">
                <span>{t("auth.login.sceneSignal")}</span>
                <Activity className="h-3 w-3 text-red-200" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 flex items-center justify-between px-8 pb-6 font-mono text-[9px] font-medium uppercase tracking-[.16em] text-white/35 xl:px-14 xl:pb-8">
        <span>{t("auth.login.sceneFooter")}</span>
        <span className="inline-flex items-center gap-2">
          <span className="h-px w-7 bg-red-200/35" /> {t("auth.login.sceneDemo")}
        </span>
      </footer>
    </motion.aside>
  );
}
