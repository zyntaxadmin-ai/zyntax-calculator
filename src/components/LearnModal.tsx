// ============================================================
// LearnModal.tsx — the built-in teacher.
// Explains, in simple English (+ Banglish), how the calculator
// works inside: tokens, parser, why no eval(), percentage rules,
// errors, keyboard shortcuts, and a debugging lesson.
// (Eta tomar teacher — code ta kibhabe kaj kore ta ekhane bujhiye.)
// ============================================================

import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Braces,
  Bug,
  Keyboard,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

interface LearnModalProps {
  open: boolean;
  onClose: () => void;
}

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-amber-300">
        {icon}
        {title}
      </h3>
      <div className="space-y-2.5 text-sm leading-relaxed text-white/75">{children}</div>
    </section>
  );
}

function Bn({ children }: { children: ReactNode }) {
  return <p className="text-[13px] italic text-white/45">{children}</p>;
}

export default function LearnModal({ open, onClose }: LearnModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="How the calculator works"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="scrollbar-thin relative max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#121218] p-6 shadow-2xl md:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-5 top-5 rounded-xl p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-[#1c1206] shadow-[0_8px_24px_rgba(255,159,10,0.35)]">
                <BookOpen size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">How this calculator works</h2>
                <p className="text-xs text-white/45">Simple English + Banglish · for beginners</p>
              </div>
            </div>

            <div className="space-y-4">
              <Section icon={<Braces size={15} />} title="1. The 3 steps inside the engine">
                <p>
                  When you press <b>=</b>, the engine does <b>not</b> read the whole expression at
                  once. It works in 3 small steps:
                </p>
                <div className="rounded-xl bg-black/40 p-4 font-mono text-[12.5px] leading-6 text-white/85">
                  <div><span className="text-amber-300">"200+10%"</span>  ← what you typed</div>
                  <div>↓ <span className="text-sky-300">Step 1 · Tokenizer</span></div>
                  <div>[200] [+] [10] [%]  ← small pieces (tokens)</div>
                  <div>↓ <span className="text-sky-300">Step 2 · Parser</span></div>
                  <div>200 + (10% of 200)  ← it understands math order</div>
                  <div>↓ <span className="text-sky-300">Step 3 · Evaluator</span></div>
                  <div><span className="text-emerald-300">220</span>  ← one final number</div>
                </div>
                <Bn>
                  (Engine ta ekbarei puro expression pore na. Prothome chhoto chhoto part e bhag
                  kore, tarpor math order bujhe, sheshe answer ber kore.)
                </Bn>
                <p>
                  The parser uses a trick called <b>recursive descent</b>: each math rule is a small
                  function, and when it sees `( )`, it calls itself to solve the inside first.
                </p>
                <Bn>(Parser er bhitor er function gula nije nije ke call kore — tai etake "recursive" bole.)</Bn>
              </Section>

              <Section icon={<ShieldCheck size={15} />} title="2. Why we never use eval()">
                <p>
                  Many beginner tutorials use JavaScript&apos;s <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">eval()</code>{" "}
                  to calculate. <b>Don&apos;t.</b> eval() runs any text as code. If that text comes
                  from outside, a bad person can make it run dangerous code.
                </p>
                <p>
                  Our parser only understands <b>numbers</b> and <b>math symbols</b>. Anything else
                  is rejected with a friendly message. Nothing can &quot;run&quot; as code.
                </p>
                <Bn>
                  (eval() jekono text ke code baniye dite pare — eta dangerous. Amader parser shudhu
                  0-9, +, −, ×, ÷, % bujhe. Onno kichu dile se error dey, kichu run hoy na.)
                </Bn>
              </Section>

              <Section icon={<TriangleAlert size={15} />} title="3. Errors — what happens, and why the app never crashes">
                <p>
                  Every error is <b>caught</b> and shown as a clean message on the display. The
                  engine throws a friendly error, the UI catches it:
                </p>
                <ul className="space-y-1.5">
                  <li>· <b>10 ÷ 0</b> → &quot;Cannot divide by zero.&quot; — mathematically impossible.</li>
                  <li>· <b>(5+3</b> → &quot;Missing )&quot; — parentheses must be paired.</li>
                  <li>· <b>5+</b> → &quot;The expression is incomplete.&quot; — an operator needs a right side.</li>
                  <li>· <b>5..2</b> → blocked while typing — one dot per number.</li>
                </ul>
                <Bn>(Error mane "crash" na. Error mane ekta message — app thik thakche, kintu bolche "eta korte parbo na.")</Bn>
              </Section>

              <Section icon={<Bug size={15} />} title="4. Debugging lesson — how to read an error">
                <p>When an error appears, read it like this (this works in Python too):</p>
                <ol className="list-decimal space-y-1.5 pl-5">
                  <li><b>What</b> does the message say? (Read the last line first.)</li>
                  <li><b>Where</b> did it happen? (Which file / which button?)</li>
                  <li><b>Why</b> — what did the engine expect instead?</li>
                  <li><b>Fix</b> the smallest possible part, then test again.</li>
                </ol>
                <Bn>
                  (Error er last line ta age poro — okhane main karon thake. Tarpor ektu ektu kore
                  thik koro, puro ekbare badle dio na.)
                </Bn>
              </Section>

              <Section icon={<Keyboard size={15} />} title="5. Keyboard shortcuts">
                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  {[
                    ["0–9", "digits"],
                    ["+ − * /", "operators"],
                    ["( )", "parentheses"],
                    ["%", "percentage"],
                    ["Enter or =", "equals"],
                    ["Backspace", "delete one"],
                    ["Esc", "clear all (AC)"],
                    ["x", "multiply"],
                  ].map(([key, action]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2">
                      <kbd className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[11px] text-white/90">
                        {key}
                      </kbd>
                      <span className="text-white/55">{action}</span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section icon={<Braces size={15} />} title="6. Project structure">
                <div className="rounded-xl bg-black/40 p-4 font-mono text-[12.5px] leading-6 text-white/85">
                  <div>src/</div>
                  <div>├─ lib/calculator.ts      <span className="text-white/40">← brain: tokenizer + parser</span></div>
                  <div>├─ hooks/useCalculator.ts <span className="text-white/40">← memory: input rules, history</span></div>
                  <div>├─ components/            <span className="text-white/40">← face: buttons, display</span></div>
                  <div>└─ App.tsx                <span className="text-white/40">← wires everything together</span></div>
                </div>
                <p>
                  One job per file. If the math is wrong → look at <b>calculator.ts</b>. If a button
                  behaves wrong → look at <b>useCalculator.ts</b>. If something looks wrong →{" "}
                  <b>components/</b>.
                </p>
                <Bn>(Ekta file er ekta kaj. Kothay problem bujhle jeno sohojei khuje pawa jay.)</Bn>
              </Section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
