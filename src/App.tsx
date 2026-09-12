// ============================================================
// App.tsx — the "conductor" of the app.
// It does not calculate anything itself. It:
//   1. creates the calculator state (useCalculator)
//   2. draws the card: header, display, keypad
//   3. connects the physical keyboard
//   4. runs the engine self-tests once (visible in the console)
// ============================================================

import { BookOpen, Calculator, History, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import Background from "./components/Background";
import Display from "./components/Display";
import { HistoryDrawer, HistoryPanel } from "./components/HistoryPanel";
import Keypad from "./components/Keypad";
import LearnModal from "./components/LearnModal";
import { useCalculator } from "./hooks/useCalculator";
import { runSelfTests } from "./lib/calculator";

export default function App() {
  const calc = useCalculator();
  const [testReport] = useState(() => runSelfTests());

  // ----------------------------------------------------------
  // Keyboard support. We ignore keys when Ctrl/Cmd/Alt is held,
  // so copy/paste and browser shortcuts keep working.
  // (Keyboard er input gula ekhane button er songe connect kora hoy.)
  // ----------------------------------------------------------
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key;

      if (/^[0-9]$/.test(key)) calc.pressDigit(key);
      else if (key === ".") calc.pressDot();
      else if (key === "+" || key === "-") calc.pressOperator(key);
      else if (key === "*" || key === "x" || key === "X") calc.pressOperator("*");
      else if (key === "/") calc.pressOperator("/");
      else if (key === "^") calc.pressOperator("^");
      else if (key === "%") calc.pressPercent();
      else if (key === "(") calc.pressLeftParen();
      else if (key === ")") calc.pressRightParen();
      else if (key === "Enter" || key === "=") calc.pressEquals();
      else if (key === "Backspace") calc.pressBackspace();
      else if (key === "Escape") {
        // Close open panels first; otherwise clear the expression.
        if (calc.learnOpen) calc.toggleLearn();
        else if (calc.historyOpen) calc.toggleHistory();
        else calc.clearAll();
      } else {
        return; // unknown key — let the browser handle it
      }

      event.preventDefault();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [calc]);

  // Show the test results in the console (a small professional touch).
  useEffect(() => {
    if (testReport.failed.length === 0) {
      console.info(`%c✔ Calculator engine: ${testReport.passed}/${testReport.passed} self-tests passed`, "color:#34d399");
    } else {
      console.error("Calculator engine self-test failures:", testReport.failed);
    }
  }, [testReport]);

  const historyProps = {
    history: calc.history,
    onReuse: calc.reuseFromHistory,
    onClear: calc.clearHistory,
  };

  return (
    <div className="relative min-h-screen font-sans text-white">
      <Background />

  <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-5 px-3 py-4 sm:px-4 sm:py-8"
       
        <div className="flex w-full items-stretch justify-center gap-5">
          {/* ---------------- Calculator card ---------------- */}
          <section
            aria-label="Calculator"
            className="w-full rounded-3xl border border-white/[0.09] bg-[#101014]/90 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:min-h-0 sm:max-w-[400px] sm:shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
          >
            {/* Card header */}
            <header className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-[#1c1206] shadow-[0_6px_20px_rgba(255,159,10,0.35)]">
                  <Calculator size={17} strokeWidth={2.4} />
                </div>
                <div>
                  <h1 className="font-display text-[15px] font-bold leading-tight tracking-wide">
                    Calculator
                  </h1>
                  <p className="flex items-center gap-1 text-[11px] text-white/40">
                    <ShieldCheck size={11} className="text-emerald-400" />
                    safe parser · no eval()
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={calc.toggleHistory}
                  aria-label="Toggle history"
                  className={`relative rounded-xl p-2.5 transition-colors ${
                    calc.historyOpen
                      ? "bg-amber-500/15 text-amber-300"
                      : "text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <History size={17} />
                  {calc.history.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-[#1c1206]">
                      {calc.history.length > 99 ? "99" : calc.history.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={calc.toggleLearn}
                  aria-label="How it works"
                  className={`rounded-xl p-2.5 transition-colors ${
                    calc.learnOpen
                      ? "bg-amber-500/15 text-amber-300"
                      : "text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <BookOpen size={17} />
                </button>
              </div>
            </header>

            {/* Screen */}
            <Display
              expr={calc.expr}
              preview={calc.preview}
              error={calc.error}
              justEvaluated={calc.justEvaluated}
              lastResult={calc.lastResult}
            />

            <div className="mx-1 mb-4 border-t border-white/[0.07]" />

            {/* Keys */}
            <Keypad calc={calc} />

            {/* Hint line */}
            <p className="mt-4 text-center text-[11px] text-white/30">
              <span className="hidden md:inline">⌨ Keyboard supported — Enter = equals · Esc = clear</span>
              <span className="md:hidden">100% local — your history never leaves this device</span>
            </p>
          </section>

          {/* ---------------- History (desktop) ---------------- */}
          <HistoryPanel open={calc.historyOpen} onClose={calc.toggleHistory} {...historyProps} />
        </div>

        {/* Page footer */}
        <footer className="flex items-center gap-2 text-[11px] text-white/25">
          <ShieldCheck size={12} className="text-emerald-500/60" />
          <span>
            {testReport.failed.length === 0
              ? `${testReport.passed}/${testReport.passed} engine tests passed · runs fully offline`
              : "engine self-test: see console"}
          </span>
        </footer>
      </main>

      {/* ---------------- History (mobile drawer) ---------------- */}
      <HistoryDrawer open={calc.historyOpen} onClose={calc.toggleHistory} {...historyProps} />

      {/* ---------------- Learn modal ---------------- */}
      <LearnModal open={calc.learnOpen} onClose={calc.toggleLearn} />
    </div>
  );
}
