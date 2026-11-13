"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import Button from "./Button";

// Mirrors FUSION_DEFAULTS in open-sse/services/combo.js. Values are stored in
// settings.comboStrategies[name].fusionTuning and applied per combo at runtime.
const DEFAULTS = { minPanel: 2, stragglerGraceMs: 8000, panelHardTimeoutMs: 90000 };

const TIMEOUT_PRESETS = [60, 90, 120, 180, 300];
const GRACE_PRESETS = [0, 8, 15, 30, 60];

export default function FusionTuningModal({
  isOpen,
  onClose,
  comboName,
  panelSize = 2,
  tuning = {},
  onSave,
}) {
  const [expertTimeoutSec, setExpertTimeoutSec] = useState(DEFAULTS.panelHardTimeoutMs / 1000);
  const [graceSec, setGraceSec] = useState(DEFAULTS.stragglerGraceMs / 1000);
  const [minPanel, setMinPanel] = useState(DEFAULTS.minPanel);

  useEffect(() => {
    if (isOpen) {
      setExpertTimeoutSec(Math.round((tuning.panelHardTimeoutMs ?? DEFAULTS.panelHardTimeoutMs) / 1000));
      setGraceSec(Math.round((tuning.stragglerGraceMs ?? DEFAULTS.stragglerGraceMs) / 1000));
      setMinPanel(tuning.minPanel ?? DEFAULTS.minPanel);
    }
  }, [isOpen, tuning]);

  const maxPanel = Math.max(2, panelSize);

  const handleSave = () => {
    onSave({
      fusionTuning: {
        minPanel: Math.min(Math.max(2, minPanel), maxPanel),
        stragglerGraceMs: Math.min(Math.max(0, graceSec), 300) * 1000,
        panelHardTimeoutMs: Math.min(Math.max(30, expertTimeoutSec), 900) * 1000,
      },
    });
    onClose();
  };

  const handleReset = () => {
    setExpertTimeoutSec(DEFAULTS.panelHardTimeoutMs / 1000);
    setGraceSec(DEFAULTS.stragglerGraceMs / 1000);
    setMinPanel(DEFAULTS.minPanel);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Fusion Tuning — ${comboName || "Combo"}`}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-text-muted">
          Control how long the expert panel runs before the judge synthesizes the final answer:
        </p>

        {/* Expert hard timeout */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-border/60 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-text-main">Expert Timeout</span>
            <span className="font-mono font-semibold text-primary text-sm">{expertTimeoutSec}s</span>
          </div>
          <input
            type="range"
            min="30"
            max="900"
            step="5"
            value={expertTimeoutSec}
            onChange={(e) => setExpertTimeoutSec(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
          />
          <div className="flex items-center gap-1.5">
            {TIMEOUT_PRESETS.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setExpertTimeoutSec(sec)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  expertTimeoutSec === sec
                    ? "bg-primary text-white font-semibold"
                    : "bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main"
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Absolute cap per expert call. A hung expert is dropped after this long.
          </p>
        </div>

        {/* Quorum */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-border/60 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-text-main">Wait for Experts</span>
            <span className="font-mono font-semibold text-primary text-sm">
              {minPanel} / {maxPanel}
            </span>
          </div>
          <input
            type="range"
            min="2"
            max={maxPanel}
            step="1"
            value={Math.min(minPanel, maxPanel)}
            onChange={(e) => setMinPanel(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
          />
          <p className="text-[11px] text-text-muted leading-relaxed">
            Once this many experts have answered, the remaining ones get only the grace window
            below before the judge starts. Set it to the full panel ({maxPanel}) to wait for
            every expert (up to the timeout above).
          </p>
        </div>

        {/* Straggler grace */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-border/60 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-text-main">Straggler Grace</span>
            <span className="font-mono font-semibold text-primary text-sm">{graceSec}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="120"
            step="1"
            value={graceSec}
            onChange={(e) => setGraceSec(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
          />
          <div className="flex items-center gap-1.5">
            {GRACE_PRESETS.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setGraceSec(sec)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  graceSec === sec
                    ? "bg-primary text-white font-semibold"
                    : "bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main"
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Extra time given to slower experts after the quorum above is reached. Increase this
            if fast experts keep cutting slow (often better) ones out of the fusion.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Tuning
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
