// ============================================================
// HistoryPanel.tsx — calculation history.
//   HistoryPanel : desktop side panel (slides in next to the card)
//   HistoryDrawer: mobile bottom sheet
// Both show the same list, so the logic lives in HistoryContent.
// Clicking an old calculation loads its answer so you can continue.
// (Purono hishAB e click korle answer ta abar use kora jay.)
// ============================================================

import { AnimatePresence, motion } from "framer-motion";
import { History, Trash2, X } from "lucide-react";
import type { HistoryEntry } from "../hooks/useCalculator";
import { prettify } from "../lib/calculator";

interface HistoryContentProps {
  history: HistoryEntry[];
  onReuse: (entry: HistoryEntry) => void;
  onClear: () => void;
  onClose?: () => void;
}

function HistoryContent({ history, onReuse, onClear, onClose }: HistoryContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <History size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white/90">History</h2>
          {history.length > 0 && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/60">
              {history.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear history"
              className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-rose-300"
            >
              <Trash2 size={15} />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close history"
              className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4">
        {history.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06]">
              <History size={20} className="text-white/30" />
            </div>
            <p className="text-sm text-white/40">No calculations yet.</p>
            <p className="max-w-[200px] text-xs leading-relaxed text-white/25">
              Every result you press &quot;=&quot; on will appear here.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            <AnimatePresence initial={false}>
              {history.map((entry) => (
                <motion.li
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <button
                    type="button"
                    onClick={() => onReuse(entry)}
                    className="group w-full rounded-xl px-3 py-2.5 text-right transition-colors hover:bg-white/[0.07]"
                  >
                    <span className="block truncate text-xs text-white/40 group-hover:text-white/60">
                      {prettify(entry.expr)} =
                    </span>
                    <span className="font-display block truncate text-lg font-semibold text-white/90">
                      {entry.result}
                    </span>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Desktop side panel
// ------------------------------------------------------------

interface PanelProps extends HistoryContentProps {
  open: boolean;
}

export function HistoryPanel({ open, ...contentProps }: PanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ opacity: 0, x: 24, width: 0 }}
          animate={{ opacity: 1, x: 0, width: 300 }}
          exit={{ opacity: 0, x: 24, width: 0 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="hidden shrink-0 overflow-hidden md:block"
        >
          <div className="h-full w-[300px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#101014]/90 shadow-2xl backdrop-blur-xl">
            <HistoryContent {...contentProps} />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ------------------------------------------------------------
// Mobile bottom sheet
// ------------------------------------------------------------

interface DrawerProps extends HistoryContentProps {
  open: boolean;
}

export function HistoryDrawer({ open, ...contentProps }: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={contentProps.onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="absolute inset-x-0 bottom-0 max-h-[72vh] overflow-hidden rounded-t-[28px] border-t border-white/10 bg-[#101014]"
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20" />
            <div className="h-[65vh]">
              <HistoryContent {...contentProps} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
