// ============================================================
// Background.tsx — soft ambient light behind the calculator.
// Pure decoration: two blurred glows + a tiny noise texture.
// (Eta sudhu background — calculator er kono kaj er songe na.)
// ============================================================

const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

export default function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden bg-[#07070b]">
      {/* Warm amber glow, top-left */}
      <div
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-[0.13]"
        style={{ background: "radial-gradient(circle, #ff9f0a 0%, transparent 65%)" }}
      />
      {/* Cool indigo glow, bottom-right */}
      <div
        className="absolute -bottom-48 -right-40 h-[560px] w-[560px] rounded-full opacity-[0.10]"
        style={{ background: "radial-gradient(circle, #5e5ce6 0%, transparent 65%)" }}
      />
      {/* Subtle noise so the dark surface does not look flat */}
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: NOISE_SVG }} />
      {/* Faint grid lines, hidden on small screens */}
      <div
        className="absolute inset-0 hidden opacity-[0.05] md:block"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
    </div>
  );
}
