// ============================================================
// Display.tsx — the calculator screen.
//   small line  : the expression being typed (200 + 10%)
//   big line    : live preview (= 220) or the final answer
// Errors appear here too, in a soft red, never as a crash.
// ============================================================

import { AnimatePresence, motion } from "framer-motion";
import { prettify } from "../lib/calculator";

interface DisplayProps {
  expr: string;
  preview: string | null;
  error: string | null;
  justEvaluated: boolean;
  lastResult: string | null;
}

/** Font size shrinks as the answer gets longer, so it never overflows. */
function bigTextClass(text: string): string {
  if (text.length <= 8) return "text-6xl";
  if (text.length <= 11) return "text-5xl";
  if (text.length <= 15) return "text-4xl";
  return "text-3xl";
}

export default function Display({ expr, preview, error, justEvaluated, lastResult }: DisplayProps) {
  const showExpression = expr.length > 0;

  // What goes on the big line?
  // 1. error message (friendly, red)
  // 2. final answer after "="
  // 3. live preview while typing
  // 4. the expression itself while typing digits only
  // 5. just "0" when the screen is empty
  // The animation key is the MODE, not the text — so typing feels
  // instant (no flicker), but mode changes still animate smoothly.
  type DisplayMode = "empty" | "typing" | "preview" | "result" | "error";
  const mode: DisplayMode = error
    ? "error"
    : justEvaluated
      ? "result"
      : preview !== null
        ? "preview"
        : showExpression
          ? "typing"
          : "empty";

  const bigText =
    mode === "error"
      ? error
      : mode === "result"
        ? lastResult ?? "0"
        : mode === "preview"
          ? `= ${preview}`
          : mode === "typing"
            ? prettify(expr)
            : "0";

  const bigIsError = mode === "error";
  const bigIsPreview = mode === "preview";
  const bigIsDim = mode === "empty";

  return (
    <div className="flex min-h-[132px] flex-col items-end justify-end gap-1 px-2 pb-2 pt-6">
      {/* Small line: the expression (or the finished calculation) */}
      <div className="scrollbar-thin w-full overflow-x-auto whitespace-nowrap text-right">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={justEvaluated ? `done-${lastResult}` : "typing"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`inline-block text-lg tracking-wide ${
              justEvaluated ? "text-amber-400/80" : "text-white/40"
            }`}
          >
            {showExpression || justEvaluated
              ? prettify(expr) + (justEvaluated ? " =" : "")
              : "\u00A0"}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Big line: answer / preview / zero */}
      <div className="scrollbar-thin w-full overflow-x-auto whitespace-nowrap text-right">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={mode}
            initial={{ opacity: 0.4, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={`font-display font-bold tracking-tight ${bigTextClass(bigText ?? "0")} ${
              bigIsError
                ? "text-3xl text-rose-400"
                : bigIsPreview
                  ? "text-white/90"
                  : bigIsDim
                    ? "text-white/25"
                    : "text-white"
            }`}
          >
            {bigText}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
