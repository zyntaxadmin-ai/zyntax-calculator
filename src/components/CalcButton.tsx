// ============================================================
// CalcButton.tsx — one calculator key.
// Every button has a soft "press" animation and a clear style:
//   num  — dark, neutral
//   util — lighter, for controls (AC, backspace, %)
//   sci  — small scientific keys ( ( ) √ x² π )
//   op   — amber, the four operators (active = inverted)
//   eq   — amber with a glow, the main action
// ============================================================

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export type ButtonVariant = "num" | "util" | "sci" | "op" | "eq";

interface CalcButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Operator currently "active" (just pressed) — shows the inverted style. */
  active?: boolean;
  ariaLabel?: string;
  className?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  num: "bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]",
  util: "bg-white/[0.13] hover:bg-white/[0.19] text-white border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.09)]",
  sci: "bg-transparent hover:bg-white/[0.08] text-white/70 border border-transparent",
  op: "bg-amber-500 hover:bg-amber-400 text-[#1c1206] shadow-[0_4px_16px_rgba(255,159,10,0.25)]",
  eq: "bg-amber-500 hover:bg-amber-400 text-[#1c1206] shadow-[0_10px_30px_rgba(255,159,10,0.38)]",
};

const OP_ACTIVE_STYLE =
  "bg-white text-amber-500 shadow-[0_4px_16px_rgba(255,255,255,0.15)] hover:bg-white";

export default function CalcButton({
  children,
  onPress,
  variant = "num",
  active = false,
  ariaLabel,
  className = "",
}: CalcButtonProps) {
  const style = active && variant === "op" ? OP_ACTIVE_STYLE : VARIANT_STYLES[variant];

  return (
    <motion.button
      type="button"
      onClick={onPress}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className={`relative flex touch-manipulation select-none items-center justify-center rounded-2xl text-xl font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-amber-400/70 ${style} ${className}`}
    >
      {children}
    </motion.button>
  );
}
