"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Existing demo account (seed data). Page par dikhaya nahi jata, sirf button se bharta hai.
const DEMO_EMAIL = "demo@aisaathi.pk";
const DEMO_PASSWORD = "demo1234";

const lowStockSample = [
  { name: "Daal Masoor 1kg", left: 2 },
  { name: "Tapal Danedar 190g", left: 3 },
  { name: "Basmati Rice 5kg", left: 4 },
];

type FieldErrors = { email?: string; password?: string };

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) {
    errors.email = "Email likhein.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = "Email sahi format mein likhein, jaise aap@dukaan.pk.";
  }
  if (!password) errors.password = "Password likhein.";
  return errors;
}

const inputBase =
  "block w-full rounded-lg border bg-white px-3.5 py-3 text-base text-[#14213D] outline-none transition-shadow placeholder:text-[#7A869E] focus-visible:ring-4";
const inputOk =
  "border-[#C5D0E6] hover:border-[#9FB0D0] focus:border-[#14213D] focus-visible:ring-[#14213D]/10";
const inputBad =
  "border-[#C0392B] focus:border-[#C0392B] focus-visible:ring-[#C0392B]/15";

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect x="3" y="2" width="22" height="24" rx="3" fill="#14213D" />
        <path d="M8 9h12M8 14h12M8 19h7" stroke="#F7F8FC" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="21" cy="20" r="3.2" fill="#F2A900" />
      </svg>
      <span className="text-xl font-semibold tracking-tight">AI Saathi</span>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [demoFilled, setDemoFilled] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    // Naye try par purana error foran saaf
    setFormError("");
    const errors = validate(email, password);
    setFieldErrors(errors);
    if (errors.email) {
      emailRef.current?.focus();
      return;
    }
    if (errors.password) {
      passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (res.ok) {
        setFormError("");
        router.push("/dashboard");
        router.refresh();
        return; // loading tab tak rahe jab tak page badal na jaye
      }
      const data = await res.json().catch(() => null);
      setFormError(
        res.status === 401
          ? "Email ya password galat hai. Check karke dobara likhein."
          : data?.error ?? "Login nahi ho saka. Thori der baad dobara koshish karein."
      );
    } catch {
      setFormError("Server tak pohanch nahi sake. Internet check karke dobara koshish karein.");
    }
    setLoading(false);
  }

  function fillDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setShowPassword(false);
    setFieldErrors({});
    setFormError("");
    setDemoFilled(true);
    submitRef.current?.focus();
  }

  return (
    <div
      className="min-h-dvh bg-[#F7F8FC] text-[#14213D] lg:h-dvh lg:overflow-hidden"
      style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
    >
      <style>{`
        @keyframes saathi-reply { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .saathi-reply { animation: saathi-reply 600ms ease-out 700ms both; }
        @media (prefers-reduced-motion: reduce) { .saathi-reply { animation: none; } }
        input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus {
          -webkit-text-fill-color: #14213D;
          box-shadow: 0 0 0 1000px #fff inset;
          transition: background-color 9999s ease-out 0s;
        }
        @media (min-width: 1024px) and (max-height: 820px) {
          .saathi-h1 { font-size: 3rem; line-height: 1.08; }
          .saathi-lead { margin-top: 1rem; font-size: 1.0625rem; }
          .saathi-left { padding-top: 2rem; padding-bottom: 2rem; }
          .saathi-form { padding-top: 1.5rem; padding-bottom: 1.5rem; }
        }
      `}</style>

      <div className="grid min-h-dvh lg:h-dvh lg:grid-cols-[1.15fr_1fr]">
        {/* Form side: mobile par pehle */}
        <section className="saathi-form order-1 flex flex-col bg-white px-6 py-10 sm:px-12 lg:order-2 lg:h-dvh lg:overflow-y-auto lg:border-l lg:border-[#E3E8F3] lg:px-16">
          <div className="mx-auto my-auto w-full max-w-sm">
            <div className="mb-10 lg:hidden">
              <BrandMark />
            </div>

            <h2
              className="text-4xl"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              Login karein
            </h2>
            <p className="mt-2 text-[#5B6784]">Apne dukaan ke hisaab tak pohanchein.</p>

            <form onSubmit={submit} noValidate className="mt-8" aria-busy={loading}>
              {formError && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-2.5 rounded-lg border border-[#F0C4BE] bg-[#FDF2F0] px-3.5 py-3 text-sm text-[#8F2A1E]"
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
                    <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 5.8v5M10 13.6v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                  Email
                </label>
                <input
                  ref={emailRef}
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setDemoFilled(false);
                    if (formError) setFormError("");
                    if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
                  }}
                  placeholder="aap@dukaan.pk"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  className={`${inputBase} ${fieldErrors.email ? inputBad : inputOk}`}
                />
                {fieldErrors.email && (
                  <p id="email-error" className="mt-1.5 text-sm text-[#B3321F]">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="mt-5">
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setDemoFilled(false);
                      if (formError) setFormError("");
                      if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
                    }}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                    className={`${inputBase} pr-24 ${fieldErrors.password ? inputBad : inputOk}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Password chhupayein" : "Password dikhayein"}
                    aria-pressed={showPassword}
                    aria-controls="password"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1.5 text-sm font-medium text-[#3D4A66] hover:bg-[#EEF2FA] hover:text-[#14213D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F2A900]"
                  >
                    {showPassword ? "Chhupayein" : "Dikhayein"}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="password-error" className="mt-1.5 text-sm text-[#B3321F]">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <button
                ref={submitRef}
                type="submit"
                disabled={loading}
                className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#14213D] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#22345E] active:bg-[#0E182E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A900] disabled:cursor-wait disabled:bg-[#3A4A6E]"
              >
                {loading && (
                  <span
                    aria-hidden="true"
                    className="size-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin"
                  />
                )}
                {loading ? "Login ho raha hai…" : "Login karein"}
              </button>
            </form>

            <div className="mt-8 rounded-lg border border-[#E3E8F3] bg-[#F7F8FC] p-5">
              <p className="text-sm font-semibold">Judges ke liye demo</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#5B6784]">
                Demo account mein sirf fictional dukaan ka data hai. Button dabane se details
                khud bhar jayengi.
              </p>
              <button
                type="button"
                onClick={fillDemo}
                className="mt-4 w-full rounded-lg border border-[#14213D] bg-white px-3 py-2.5 text-sm font-medium text-[#14213D] transition-colors hover:bg-[#14213D] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A900]"
              >
                Demo details bhar dein
              </button>
              <p role="status" className="mt-3 min-h-5 text-sm text-[#2F6B3F]">
                {demoFilled ? "Details bhar di gayi hain. Ab Login karein dabayein." : ""}
              </p>
            </div>
          </div>
        </section>

        {/* Khata side */}
        <section
          className="relative order-2 overflow-hidden lg:order-1 lg:h-dvh"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0, transparent 35px, #E2E9F5 35px, #E2E9F5 36px)",
          }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-7 w-px bg-[#E58B8B] sm:left-12 lg:left-20"
          />

          <div className="saathi-left relative flex flex-col gap-12 px-6 py-12 pl-12 sm:px-12 sm:pl-20 lg:h-full lg:justify-between lg:gap-8 lg:overflow-y-auto lg:px-16 lg:py-14 lg:pl-28">
            <div className="hidden w-fit bg-[#F7F8FC] pr-3 lg:block">
              <BrandMark />
            </div>

            <div className="max-w-xl">
              <h1
                className="saathi-h1 text-balance text-4xl leading-[1.08] sm:text-5xl lg:text-6xl"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}
              >
                Dukaan ka hisaab, ab baat karke.
              </h1>
              <p className="saathi-lead mt-5 max-w-md text-lg leading-relaxed text-[#3D4A66]">
                Stock, sales aur udhaar ke bare mein Roman Urdu mein poochein. Jawab aap ke apne
                records se aata hai.
              </p>
            </div>

            <div className="w-full max-w-md" role="group" aria-label="Misaal ki baat cheet">
              <p className="mb-3 inline-block bg-[#F7F8FC] pr-2 text-sm text-[#5B6784]">Misaal</p>
              <div className="ml-auto w-fit rounded-2xl rounded-br-sm bg-[#14213D] px-4 py-2.5 text-[#F7F8FC]">
                Mera low stock batao.
              </div>
              <div className="saathi-reply mt-3 w-full rounded-2xl rounded-bl-sm border border-[#CBD5E8] bg-white px-4 py-3.5">
                <p className="mb-2 text-[15px]">5 cheezein reorder level se neeche hain. Sab se kam:</p>
                <ul className="space-y-1.5 text-[15px]">
                  {lowStockSample.map((p) => (
                    <li key={p.name} className="flex items-baseline gap-2">
                      <span>{p.name}</span>
                      <span aria-hidden="true" className="flex-1 border-b border-dotted border-[#B8C4DC]" />
                      <span className="font-semibold tabular-nums">{p.left} bacha</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}