"use client";

import { forwardRef, useEffect, useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { X } from "lucide-react";
import type { Tone } from "@/lib/labels";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------------- Buttons ---------------- */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "whatsapp";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink border-accent hover:brightness-110",
  secondary: "bg-surface text-ink border-line hover:border-muted",
  ghost: "bg-transparent text-ink border-transparent hover:bg-sunken",
  danger: "bg-surface text-bad border-bad/50 hover:bg-bad-soft",
  whatsapp: "bg-[#1FA855] text-white border-[#1FA855] hover:brightness-110",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: "sm" | "md"; icon?: ReactNode }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = "secondary", size = "md", icon, className, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0",
        size === "sm" ? "h-8 px-2.5 text-[13px] [&_svg]:size-4" : "h-10 px-3.5 text-sm [&_svg]:size-[18px]",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});

/** Lien stylé comme un bouton (liens externes : WhatsApp, e-mail). */
export function LinkButton({ href, variant = "secondary", size = "md", icon, children, className }: { href: string; variant?: Variant; size?: "sm" | "md"; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cx("inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition [&_svg]:shrink-0", size === "sm" ? "h-8 px-2.5 text-[13px] [&_svg]:size-4" : "h-10 px-3.5 text-sm [&_svg]:size-[18px]", VARIANTS[variant], className)}>
      {icon}
      {children}
    </a>
  );
}

export function IconButton({ label, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={cx("grid size-9 place-items-center rounded-lg text-muted transition hover:bg-sunken hover:text-ink [&_svg]:size-[18px]", className)} {...rest}>
      {children}
    </button>
  );
}

/** Suppression en deux temps (les boîtes confirm() ne sont pas fiables partout). */
export function ConfirmButton({ onConfirm, children, confirmLabel = "Confirmer la suppression", icon, size }: { onConfirm: () => void; children: ReactNode; confirmLabel?: string; icon?: ReactNode; size?: "sm" | "md" }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Button size={size} variant="danger" icon={icon} className={armed ? "!bg-bad !text-white" : ""} onClick={() => (armed ? onConfirm() : setArmed(true))}>
      {armed ? confirmLabel : children}
    </Button>
  );
}

/* ---------------- Badges ---------------- */
const TONES: Record<Tone, string> = {
  neutral: "bg-sunken text-muted",
  accent: "bg-accent-soft text-accent",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
};
export function Badge({ tone = "neutral", children, dot = true }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-bold", TONES[tone])}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
export const DemoTag = () => <span className="rounded border border-dashed border-line px-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Exemple</span>;

/* ---------------- Surfaces ---------------- */
export function Card({ children, className, pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <section className={cx("min-w-0 rounded-card border border-line bg-surface", pad && "p-4 sm:p-5", className)}>{children}</section>;
}

export function SectionTitle({ title, action, sub }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {sub && <p className="text-[13px] text-muted">{sub}</p>}
      </div>
      {action && <div className="ml-auto flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-[1.65rem] font-bold leading-tight tracking-tight">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
      </div>
      {actions && <div className="ml-auto flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-surface px-5 py-8">
      <div className="flex max-w-lg flex-col gap-2">
        {icon && <div className="mb-1 grid size-10 place-items-center rounded-lg bg-accent-soft text-accent [&_svg]:size-5">{icon}</div>}
        <h3 className="font-display text-base font-bold">{title}</h3>
        {children && <div className="text-sm text-muted">{children}</div>}
        {action && <div className="mt-2 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}

export function Stat({ label, value, sub, tone, icon }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "ok" | "warn" | "bad" | "accent"; icon?: ReactNode }) {
  const color = tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : tone === "accent" ? "text-accent" : "text-ink";
  return (
    <div className="min-w-0 rounded-card border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-[12.5px] font-semibold text-muted [&_svg]:size-4">{icon}{label}</div>
      <div className={cx("num mt-1.5 truncate font-display text-[1.45rem] font-bold leading-tight", color)}>{value}</div>
      {sub && <div className="num mt-0.5 truncate text-[12.5px] text-muted">{sub}</div>}
    </div>
  );
}

/* ---------------- Form fields ---------------- */
const control = "w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25";

export function Field({ label, hint, children, className, htmlFor }: { label: string; hint?: ReactNode; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[12.5px] font-semibold text-muted">{label}</label>
      {children}
      {hint && <span className="text-[12px] text-muted">{hint}</span>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: ReactNode; wrapClass?: string };
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, wrapClass, className, id, ...rest }, ref) {
  const auto = useId();
  const el = <input ref={ref} id={id ?? auto} className={cx(control, "h-10", className)} {...rest} />;
  return label ? <Field label={label} hint={hint} className={wrapClass} htmlFor={id ?? auto}>{el}</Field> : el;
});

export function Select({ label, hint, wrapClass, className, id, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; hint?: ReactNode; wrapClass?: string }) {
  const auto = useId();
  const el = <select id={id ?? auto} className={cx(control, "h-10 pr-8", className)} {...rest}>{children}</select>;
  return label ? <Field label={label} hint={hint} className={wrapClass} htmlFor={id ?? auto}>{el}</Field> : el;
}

export function Textarea({ label, hint, wrapClass, className, id, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: ReactNode; wrapClass?: string }) {
  const auto = useId();
  const el = <textarea id={id ?? auto} className={cx(control, "min-h-[84px] resize-y", className)} {...rest} />;
  return label ? <Field label={label} hint={hint} className={wrapClass} htmlFor={id ?? auto}>{el}</Field> : el;
}

/** Saisie de montant en GNF : affiche les milliers groupés, stocke un nombre. */
export function MoneyInput({ value, onChange, label, hint, wrapClass, id, placeholder }: { value: number; onChange: (n: number) => void; label?: string; hint?: ReactNode; wrapClass?: string; id?: string; placeholder?: string }) {
  const auto = useId();
  const shown = value ? Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "";
  const el = (
    <div className="relative min-w-0">
      <input
        id={id ?? auto}
        inputMode="numeric"
        className={cx(control, "num h-10 pr-12 text-right")}
        value={shown}
        placeholder={placeholder ?? "0"}
        onChange={(e) => onChange(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">GNF</span>
    </div>
  );
  return label ? <Field label={label} hint={hint} className={wrapClass} htmlFor={id ?? auto}>{el}</Field> : el;
}

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  const auto = useId();
  return (
    <label htmlFor={id ?? auto} className="inline-flex cursor-pointer select-none items-center gap-2.5 text-sm font-semibold">
      <span className="relative">
        <input id={id ?? auto} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="block h-6 w-10 rounded-full bg-line transition peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
      </span>
      {label}
    </label>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { key: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {items.map((it) => (
        <button
          key={it.key}
          role="tab"
          type="button"
          aria-selected={value === it.key}
          onClick={() => onChange(it.key)}
          className={cx("inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13.5px] font-semibold transition", value === it.key ? "bg-ink text-bg" : "text-muted hover:bg-sunken hover:text-ink")}
        >
          {it.label}
          {it.count !== undefined && <span className={cx("num rounded-full px-1.5 text-[11px]", value === it.key ? "bg-bg/20" : "bg-sunken")}>{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Panneau latéral (formulaires) ---------------- */
export function Sheet({ title, sub, onClose, children, footer, wide }: { title: string; sub?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Fermer" className="fade-in absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cx("slide-in relative flex h-full w-full flex-col bg-bg shadow-pop", wide ? "max-w-3xl" : "max-w-xl")}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)", paddingRight: "env(safe-area-inset-right, 0px)" }}>
        <header className="flex items-start gap-3 border-b border-line bg-surface px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold leading-tight">{title}</h2>
            {sub && <div className="mt-0.5 text-[13px] text-muted">{sub}</div>}
          </div>
          <IconButton label="Fermer" className="ml-auto -mr-2 -mt-1" onClick={onClose}><X /></IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap items-center gap-2 border-t border-line bg-surface px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

export function KV({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex min-w-0 justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted">{k}</span>
      <span className="num min-w-0 text-right font-semibold">{v}</span>
    </div>
  );
}
