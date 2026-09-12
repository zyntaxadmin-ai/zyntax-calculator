// ============================================================
// useCalculator.ts — The "memory" of the calculator
// ------------------------------------------------------------
// This hook remembers:
//   - what the user typed  (expr)
//   - the live preview     (preview)
//   - the last error       (error)
//   - the calculation history (history, saved in localStorage)
//
// It also contains the INPUT RULES — for example, a number can
// have only one decimal point, and ")" is only allowed when
// there is an open "(" before it.
// (Eikhane input er niyom gulo thake — jemon "5..2" allow kora hoy na.)
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalcError, evaluate, formatResult } from "../lib/calculator";

export interface HistoryEntry {
  id: string;
  expr: string;
  result: string;
}

const MAX_HISTORY = 40;
const STORAGE_KEY = "calculator-history-v1";

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Loads history from the browser storage, safely. */
function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useCalculator() {
  const [expr, setExpr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);

  // Save history whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Storage full or blocked — not critical, ignore.
    }
  }, [history]);

  // ----------------------------------------------------------
  // LIVE PREVIEW — while typing, we try to show the result early.
  // We only show it for "complete" expressions, and any failure
  // is silent (we just show nothing). The real check happens on "=".
  // ----------------------------------------------------------
  const preview = useMemo(() => {
    if (justEvaluated || !expr) return null;

    // Cut off a trailing operator so "5+" is treated like "5" (no preview).
    const trimmed = expr.replace(/[+\-*/^.\s]+$/, "");
    if (!trimmed || !/[+\-*/^%]/.test(trimmed)) return null;

    // Parentheses must be balanced, otherwise the answer would be wrong.
    let depth = 0;
    for (const ch of trimmed) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (depth < 0) return null;
    }
    if (depth !== 0) return null;

    try {
      return formatResult(evaluate(trimmed));
    } catch {
      return null;
    }
  }, [expr, justEvaluated]);

  /** Which operator button should show the "pressed" highlight. */
  const activeOperator = useMemo(() => {
    if (justEvaluated) return null;
    const last = expr[expr.length - 1];
    return last && "+-*/^".includes(last) ? last : null;
  }, [expr, justEvaluated]);

  // ----------------------------------------------------------
  // SMALL HELPERS
  // ----------------------------------------------------------

  /** The number segment being typed right now (e.g. "5.5" in "12+5.5"). */
  function lastNumberSegment(text: string): string {
    return text.split(/[+\-*/^%()]/).pop() ?? "";
  }

  function endsWithDigitOrParen(text: string): boolean {
    const ch = text[text.length - 1];
    return ch !== undefined && (/[0-9)]/.test(ch) || /[a-z]$/.test(text));
  }

  // ----------------------------------------------------------
  // INPUT ACTIONS — one per button type
  // ----------------------------------------------------------

  const pressDigit = useCallback(
    (digit: string) => {
      setError(null);
      if (justEvaluated) {
        setExpr(digit);
        setJustEvaluated(false);
        return;
      }
      setExpr((prev) => {
        // Pressing a digit after ")" means multiplication, e.g. "5)3" -> "5)*3"
        if (prev.endsWith(")") || /[a-z]$/.test(prev)) return `${prev}*${digit}`;
        // Replace a leading "0": "0" then "7" becomes "7", not "07".
        if (lastNumberSegment(prev) === "0") return prev.slice(0, -1) + digit;
        return prev + digit;
      });
    },
    [justEvaluated]
  );

  const pressDot = useCallback(() => {
    setError(null);
    if (justEvaluated) {
      setExpr("0.");
      setJustEvaluated(false);
      return;
    }
    setExpr((prev) => {
      const lastChar = prev[prev.length - 1];
      if (lastChar === ")" || /[a-z]$/.test(prev)) return `${prev}*0.`;
      if (lastChar === undefined || lastChar === "(") return `${prev}0.`;
      if ("+-*/^".includes(lastChar)) return `${prev}0.`;
      if (lastNumberSegment(prev).includes(".")) return prev; // already has a dot
      return `${prev}.`;
    });
  }, [justEvaluated]);

  const pressOperator = useCallback(
    (op: string) => {
      if (error) return; // while an error is shown, only AC / digits / backspace work
      setError(null);
      if (justEvaluated && lastResult !== null) {
        setExpr(lastResult + op); // continue calculating from the answer
        setJustEvaluated(false);
        return;
      }
      setExpr((prev) => {
        if (prev === "") return op === "-" ? "-" : prev; // allow negative start
        const lastChar = prev[prev.length - 1];
        const beforeLast = prev[prev.length - 2];

        // Two operators in a row: replace the old one...
        if ("+-*/^".includes(lastChar)) {
          // ...except "5*-3" — here the "-" is a negative sign, keep it.
          if (op === "-" && "*/(^".includes(lastChar)) return prev + "-";
          if (lastChar === "-" && "*/(^".includes(beforeLast ?? "")) {
            return prev.slice(0, -2) + op;
          }
          return prev.slice(0, -1) + op;
        }
        if (lastChar === "(") return op === "-" ? prev + "-" : prev;
        if (lastChar === ".") return prev.slice(0, -1) + op; // "5." then "+" -> "5+"
        return prev + op;
      });
    },
    [justEvaluated, lastResult, error]
  );

  const pressLeftParen = useCallback(() => {
    if (error) return;
    setError(null);
    if (justEvaluated) {
      setExpr("(");
      setJustEvaluated(false);
      return;
    }
    setExpr((prev) => {
      if (!prev) return "(";
      // "5(3+1)" means "5*(3+1)"
      if (endsWithDigitOrParen(prev)) return `${prev}*(`;
      return prev + "(";
    });
  }, [justEvaluated, error]);

  const pressRightParen = useCallback(() => {
    if (error) return;
    setError(null);
    if (justEvaluated) return;
    setExpr((prev) => {
      const opens = (prev.match(/\(/g) ?? []).length;
      const closes = (prev.match(/\)/g) ?? []).length;
      if (opens <= closes) return prev; // nothing open to close
      const lastChar = prev[prev.length - 1];
      if ("+-*/^(".includes(lastChar) || lastChar === ".") return prev; // nothing inside yet
      return prev + ")";
    });
  }, [justEvaluated, error]);

  const pressPercent = useCallback(() => {
    if (error) return;
    setError(null);
    if (justEvaluated) return;
    setExpr((prev) => {
      const lastChar = prev[prev.length - 1];
      if (lastChar !== undefined && (/[0-9)]/.test(lastChar) || /[a-z]$/.test(prev))) {
        return prev + "%";
      }
      return prev;
    });
  }, [justEvaluated, error]);

  const pressSqrt = useCallback(() => {
    if (error) return;
    setError(null);
    if (justEvaluated) {
      setExpr("sqrt(");
      setJustEvaluated(false);
      return;
    }
    setExpr((prev) => (prev && endsWithDigitOrParen(prev) ? `${prev}*sqrt(` : `${prev}sqrt(`));
  }, [justEvaluated, error]);

  const pressSquare = useCallback(() => {
    if (error) return;
    setError(null);
    if (justEvaluated && lastResult !== null) {
      setExpr(`${lastResult}^(2)`);
      setJustEvaluated(false);
      return;
    }
    setExpr((prev) => {
      if (!prev) return prev;
      if (endsWithDigitOrParen(prev)) return `${prev}^(2)`;
      return prev;
    });
  }, [justEvaluated, lastResult, error]);

  const pressPi = useCallback(() => {
    if (error) return;
    setError(null);
    if (justEvaluated) {
      setExpr("pi");
      setJustEvaluated(false);
      return;
    }
    setExpr((prev) => (prev && endsWithDigitOrParen(prev) ? `${prev}*pi` : `${prev}pi`));
  }, [justEvaluated, error]);

  const pressBackspace = useCallback(() => {
    setError(null);
    if (justEvaluated) {
      setExpr("");
      setJustEvaluated(false);
      return;
    }
    setExpr((prev) => prev.slice(0, -1));
  }, [justEvaluated]);

  const clearAll = useCallback(() => {
    setExpr("");
    setError(null);
    setJustEvaluated(false);
    setLastResult(null);
  }, []);

  /** The "=" button — the real, strict evaluation. */
  const pressEquals = useCallback(() => {
    if (justEvaluated) return; // pressing "=" again must not duplicate history
    if (!expr) {
      setError("Enter an expression first.");
      return;
    }
    try {
      const result = evaluate(expr);
      const formatted = formatResult(result);
      setHistory((h) => [{ id: makeId(), expr, result: formatted }, ...h].slice(0, MAX_HISTORY));
      setLastResult(formatted);
      setJustEvaluated(true);
      setError(null);
    } catch (e) {
      // Show a friendly message instead of crashing.
      setError(e instanceof CalcError ? e.message : "Something went wrong. Please try again.");
    }
  }, [expr, justEvaluated]);

  // ----------------------------------------------------------
  // HISTORY ACTIONS
  // ----------------------------------------------------------

  const reuseFromHistory = useCallback((entry: HistoryEntry) => {
    setExpr(entry.result);
    setJustEvaluated(false);
    setError(null);
    setHistoryOpen(false);
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  const toggleHistory = useCallback(() => setHistoryOpen((o) => !o), []);
  const toggleLearn = useCallback(() => setLearnOpen((o) => !o), []);

  return {
    // state
    expr,
    error,
    preview,
    justEvaluated,
    lastResult,
    history,
    historyOpen,
    learnOpen,
    activeOperator,
    // actions
    pressDigit,
    pressDot,
    pressOperator,
    pressLeftParen,
    pressRightParen,
    pressPercent,
    pressSqrt,
    pressSquare,
    pressPi,
    pressBackspace,
    clearAll,
    pressEquals,
    reuseFromHistory,
    clearHistory,
    toggleHistory,
    toggleLearn,
  };
}

export type CalculatorApi = ReturnType<typeof useCalculator>;
