// ============================================================
// calculator.ts — The "brain" of the calculator
// ------------------------------------------------------------
// It works in 3 steps (same idea as a real calculator app):
//
//   STEP 1 — TOKENIZER : "12+5*3"  -> small pieces [12][+][5][*][3]
//   STEP 2 — PARSER    : reads the pieces and understands
//                        math order (* / before + -, ( ) first)
//   STEP 3 — EVALUATOR : calculates one final number
//
// IMPORTANT: We NEVER use eval().
// eval() runs ANY text as code. If bad text comes in, bad things
// can happen. Our parser only understands numbers and math symbols,
// so nothing dangerous can ever run.
// (Amra eval() use kori na — eta unsafe. Amader parser shudhu
//  math chinho bojhe, tai kono kichu "code" hishebe run hoy na.)
// ============================================================

/** A friendly error with a message the user can understand. */
export class CalcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalcError";
  }
}

// ------------------------------------------------------------
// STEP 1 — TOKENIZER
// A "token" is one small piece of the expression.
// Example: "12+5" becomes two number-tokens and one plus-token.
// ------------------------------------------------------------

export type TokenType = "num" | "op" | "lparen" | "rparen" | "func" | "const";

export interface Token {
  type: TokenType;
  value: string;
}

const KNOWN_FUNCTIONS = new Set(["sqrt"]);
const KNOWN_CONSTANTS = new Set(["pi", "e"]);

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isLetter(ch: string): boolean {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z");
}

/** Turns a symbol like 'x', 'X', '*' or '×' into the internal '*'. */
function normalizeOperator(ch: string): string | null {
  if (ch === "+") return "+";
  if (ch === "-") return "-";
  if (ch === "*" || ch === "x" || ch === "X" || ch === "×") return "*";
  if (ch === "/" || ch === "÷") return "/";
  if (ch === "^") return "^";
  if (ch === "%") return "%";
  return null;
}

/** Breaks the raw text into tokens. Throws CalcError on bad input. */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // Spaces are invisible — just skip them.
    if (ch === " ") {
      i++;
      continue;
    }

    // A number: digits with at most one decimal point.
    if (isDigit(ch) || ch === ".") {
      let number = "";
      let dots = 0;
      while (i < input.length && (isDigit(input[i]) || input[i] === ".")) {
        if (input[i] === ".") dots++;
        if (dots > 1) throw new CalcError("A number can have only one decimal point.");
        number += input[i];
        i++;
      }
      if (number === ".") throw new CalcError("A decimal point needs digits next to it.");
      tokens.push({ type: "num", value: number });
      continue;
    }

    // A word: function name (sqrt), constant (pi, e), or 'x' as multiply.
    if (isLetter(ch)) {
      let word = "";
      while (i < input.length && isLetter(input[i])) {
        word += input[i];
        i++;
      }
      const lower = word.toLowerCase();
      if (lower === "x") tokens.push({ type: "op", value: "*" });
      else if (KNOWN_FUNCTIONS.has(lower)) tokens.push({ type: "func", value: lower });
      else if (KNOWN_CONSTANTS.has(lower)) tokens.push({ type: "const", value: lower });
      else throw new CalcError(`Unknown symbol "${word}".`);
      continue;
    }

    // Parentheses.
    if (ch === "(") {
      tokens.push({ type: "lparen", value: ch });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen", value: ch });
      i++;
      continue;
    }

    // Operators.
    const op = normalizeOperator(ch);
    if (op) {
      tokens.push({ type: "op", value: op });
      i++;
      continue;
    }

    // Anything else is not allowed.
    throw new CalcError(`Invalid character "${ch}".`);
  }

  return tokens;
}

// ------------------------------------------------------------
// STEP 2 + 3 — PARSER and EVALUATOR
// We use "recursive descent": each math rule is a small function,
// and a function can call itself (that's the "recursive" part)
// when it goes inside parentheses.
//
// Math order (highest priority first):
//   ( )  ->  functions  ->  power ^  ->  unary -  ->  * /  ->  + -
// ------------------------------------------------------------

interface Value {
  v: number;
  /** True when this value came from a "%" button (50% -> 0.5). */
  pct: boolean;
}

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | null {
    return this.tokens[this.pos] ?? null;
  }

  private consume(): Token | null {
    return this.tokens[this.pos++] ?? null;
  }

  /** Main entry: parse the whole expression and return one number. */
  parse(): number {
    if (this.tokens.length === 0) throw new CalcError("Expression is empty.");

    const result = this.expression();

    // If tokens are left over, the expression is wrong, e.g. "5 5".
    if (this.pos < this.tokens.length) {
      const extra = this.tokens[this.pos];
      throw new CalcError(`Unexpected "${extra.value}".`);
    }

    if (Number.isNaN(result.v)) throw new CalcError("The result is not a valid number.");
    if (!Number.isFinite(result.v)) throw new CalcError("The result is too large.");

    // Avoid "-0" on screen.
    return result.v === 0 ? 0 : result.v;
  }

  /** Rule: expression = term ( ('+'|'-') term )* */
  private expression(): Value {
    let left = this.term();

    for (;;) {
      const t = this.peek();
      if (!t || t.type !== "op" || (t.value !== "+" && t.value !== "-")) break;
      this.consume();

      const right = this.term();

      // Percentage rule for + and -:
      //   200 + 10% means 200 + (10% of 200) = 220
      if (right.pct) right.v = left.v * right.v;

      left.v = t.value === "+" ? left.v + right.v : left.v - right.v;
    }
    return left;
  }

  /** Rule: term = unary ( ('*'|'/') unary )* */
  private term(): Value {
    let left = this.unary();

    for (;;) {
      const t = this.peek();
      if (!t || t.type !== "op" || (t.value !== "*" && t.value !== "/")) break;
      this.consume();

      const right = this.unary();

      if (t.value === "*") {
        left.v *= right.v;
      } else {
        // Protect against the famous "divide by zero" crash.
        if (right.v === 0) throw new CalcError("Cannot divide by zero.");
        left.v /= right.v;
      }
      left.pct = false;
    }
    return left;
  }

  /** Rule: unary = ('+'|'-') unary | power   (handles -5 and 3*-2) */
  private unary(): Value {
    const t = this.peek();
    if (t && t.type === "op" && (t.value === "+" || t.value === "-")) {
      this.consume();
      const inner = this.unary();
      return { v: t.value === "-" ? -inner.v : inner.v, pct: inner.pct };
    }
    return this.power();
  }

  /** Rule: power = primary ('^' unary)?  — right side first: 2^3^2 = 2^(3^2) */
  private power(): Value {
    const base = this.primary();
    const t = this.peek();
    if (t && t.type === "op" && t.value === "^") {
      this.consume();
      const exponent = this.unary();
      const result = Math.pow(base.v, exponent.v);
      if (Number.isNaN(result)) throw new CalcError("Invalid power operation.");
      return { v: result, pct: false };
    }
    return base;
  }

  /** Rule: primary = number | constant | function(...) | '(' expression ')'
   *  followed by zero or more '%' signs. */
  private primary(): Value {
    const t = this.consume();
    if (!t) throw new CalcError("The expression is incomplete.");

    let v: number;

    if (t.type === "num") {
      v = parseFloat(t.value);
    } else if (t.type === "const") {
      v = t.value === "pi" ? Math.PI : Math.E;
    } else if (t.type === "func") {
      v = this.functionCall(t.value);
    } else if (t.type === "lparen") {
      // Recursion! A parenthesis can contain a whole new expression.
      const inner = this.expression();
      const close = this.consume();
      if (!close || close.type !== "rparen") throw new CalcError('Missing ")" .');
      v = inner.v;
    } else {
      throw new CalcError(`Unexpected "${t.value}".`);
    }

    // Postfix percentage: 50% -> 0.5, 5%% -> 0.0005.
    let pct = false;
    let next = this.peek();
    while (next && next.type === "op" && next.value === "%") {
      this.consume();
      v /= 100;
      pct = true;
      next = this.peek();
    }

    return { v, pct };
  }

  /** Reads a function call: name '(' expression ')' */
  private functionCall(name: string): number {
    const open = this.consume();
    if (!open || open.type !== "lparen") throw new CalcError('Missing "(" after the function.');
    const arg = this.expression();
    const close = this.consume();
    if (!close || close.type !== "rparen") throw new CalcError('Missing ")" .');

    if (name === "sqrt") {
      if (arg.v < 0) throw new CalcError("Square root of a negative number is not possible.");
      return Math.sqrt(arg.v);
    }
    throw new CalcError(`Unknown function "${name}".`);
  }
}

// ------------------------------------------------------------
// PUBLIC API — the UI only needs these two functions.
// ------------------------------------------------------------

/** Safely evaluates a full expression string. Throws CalcError on any problem. */
export function evaluate(expression: string): number {
  const tokens = tokenize(expression);
  return new Parser(tokens).parse();
}

/** Makes a number look clean on screen: 8.0 -> "8", 0.30000000000000004 -> "0.3" */
export function formatResult(value: number): string {
  if (Number.isNaN(value)) return "Error";
  if (!Number.isFinite(value)) return "Overflow";
  if (value === 0) return "0";

  // toPrecision(12) removes tiny floating-point dust like 0.30000000000000004
  const rounded = parseFloat(value.toPrecision(12));
  let text = String(rounded);

  // Very big or very small numbers use scientific notation.
  if (text.includes("e")) {
    text = rounded.toExponential(7).replace(/\.?0+e/, "e");
  }
  // If the number is still too long for the display, switch to scientific.
  if (text.length > 14) {
    text = rounded.toExponential(6).replace(/\.?0+e/, "e");
  }
  return text;
}

/** Makes the raw expression look pretty on the small display line. */
export function prettify(expression: string): string {
  return expression
    .replace(/sqrt/g, "√")
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/-/g, "−")
    .replace(/pi/g, "π");
}

// ------------------------------------------------------------
// SELF TESTS — every test here also appears in the final checklist.
// The app runs these once on start and logs the result to the
// browser console, so you can SEE that the engine is correct.
// (Browser console e dekha jay — eta ekta testing trick.)
// ------------------------------------------------------------

export interface SelfTestCase {
  expr: string;
  expected: string;
  note: string;
}

export const SELF_TESTS: SelfTestCase[] = [
  { expr: "5+5", expected: "10", note: "basic addition" },
  { expr: "10-3", expected: "7", note: "basic subtraction" },
  { expr: "5*5", expected: "25", note: "multiplication" },
  { expr: "10/2", expected: "5", note: "division" },
  { expr: "5.5+2.5", expected: "8", note: "decimals" },
  { expr: "10.5/2", expected: "5.25", note: "decimal division" },
  { expr: "(5+5)*2", expected: "20", note: "parentheses change order" },
  { expr: "200+10%", expected: "220", note: "percentage of the left value" },
  { expr: "200*10%", expected: "20", note: "percentage with multiply" },
  { expr: "50%", expected: "0.5", note: "standalone percentage" },
  { expr: "2^10", expected: "1024", note: "power" },
  { expr: "sqrt(81)", expected: "9", note: "square root" },
  { expr: "3*-2", expected: "-6", note: "negative numbers" },
  { expr: "0.1+0.2", expected: "0.3", note: "floating point dust removed" },
];

export interface SelfTestReport {
  passed: number;
  failed: SelfTestCase[];
}

/** Runs every test case. Errors are caught so the app never crashes. */
export function runSelfTests(): SelfTestReport {
  const failed: SelfTestCase[] = [];
  for (const test of SELF_TESTS) {
    try {
      const got = formatResult(evaluate(test.expr));
      if (got !== test.expected) failed.push(test);
    } catch {
      failed.push(test);
    }
  }
  return { passed: SELF_TESTS.length - failed.length, failed };
}
