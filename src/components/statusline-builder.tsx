"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Segment,
  type StatuslineLine,
  type StatuslineConfig,
  type SegmentType,
  type AnsiColor,
  SEGMENT_DEFINITIONS,
  ANSI_COLORS,
  PRESETS,
  CATEGORY_LABELS,
  createSegment,
  createLine,
  instantiatePreset,
  uid,
} from "@/lib/statusline";
import { TerminalPreview } from "./terminal-preview";
import { CodeOutput } from "./code-output";

// ─── Segment Icons (inline SVGs) ────────────────────────────────────────────

function SegmentIcon({ type }: { type: string }) {
  const cls = "w-4 h-4";
  switch (type) {
    case "cpu":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
        </svg>
      );
    case "folder":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "tag":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <circle cx="7" cy="7" r="1" />
        </svg>
      );
    case "package":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case "terminal":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      );
    case "bot":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4" />
          <line x1="8" y1="16" x2="8" y2="16" />
          <line x1="16" y1="16" x2="16" y2="16" />
        </svg>
      );
    case "bar-chart":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
      );
    case "percent":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="19" y1="5" x2="5" y2="19" />
          <circle cx="6.5" cy="6.5" r="2.5" />
          <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
      );
    case "hash":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="4" y1="9" x2="20" y2="9" />
          <line x1="4" y1="15" x2="20" y2="15" />
          <line x1="10" y1="3" x2="8" y2="21" />
          <line x1="16" y1="3" x2="14" y2="21" />
        </svg>
      );
    case "git-branch":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      );
    case "git-commit":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="4" />
          <line x1="1.05" y1="12" x2="7" y2="12" />
          <line x1="17.01" y1="12" x2="22.96" y2="12" />
        </svg>
      );
    case "dollar-sign":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "clock":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "file-diff":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      );
    case "timer":
    case "calendar":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "tree-deciduous":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 3v12" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      );
    case "minus":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case "type":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

// ─── Color Picker ───────────────────────────────────────────────────────────

const COLOR_OPTIONS: AnsiColor[] = [
  "default",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "bright_red",
  "bright_green",
  "bright_yellow",
  "bright_blue",
  "bright_magenta",
  "bright_cyan",
  "bright_white",
  "bright_black",
];

function ColorPicker({
  value,
  onChange,
}: {
  value: AnsiColor;
  onChange: (c: AnsiColor) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLOR_OPTIONS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-110 ${
            value === c
              ? "border-white scale-110 shadow-lg"
              : "border-transparent"
          }`}
          style={{ backgroundColor: ANSI_COLORS[c].css }}
          title={ANSI_COLORS[c].name}
        />
      ))}
    </div>
  );
}

// ─── Arrow Buttons ──────────────────────────────────────────────────────────

function ArrowUp() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ─── Main Builder ───────────────────────────────────────────────────────────

export function StatuslineBuilder() {
  const [lines, setLines] = useState<StatuslineLine[]>(
    () => instantiatePreset(PRESETS[1]),
  );
  const [language, setLanguage] = useState<"bash" | "python" | "node">("bash");
  const [padding, setPadding] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    null,
  );
  const [activePreset, setActivePreset] = useState<string>("Developer");

  const config: StatuslineConfig = {
    lines,
    language,
    padding,
    refreshInterval,
  };

  // Find selected segment
  const selectedSegment = lines
    .flatMap((l) => l.segments)
    .find((s) => s.id === selectedSegmentId);

  const selectedLineIndex = lines.findIndex((l) =>
    l.segments.some((s) => s.id === selectedSegmentId),
  );

  // ─── Handlers ───────────────────────────────────────────────────────────

  const applyPreset = useCallback((presetName: string) => {
    const preset = PRESETS.find((p) => p.name === presetName);
    if (!preset) return;
    setLines(instantiatePreset(preset));
    setSelectedSegmentId(null);
    setActivePreset(presetName);
  }, []);

  const addSegment = useCallback(
    (type: SegmentType, lineIndex: number) => {
      const seg = createSegment(type);
      setLines((prev) => {
        const next = structuredClone(prev);
        if (lineIndex >= next.length) {
          next.push(createLine([seg]));
        } else {
          next[lineIndex].segments.push(seg);
        }
        return next;
      });
      setSelectedSegmentId(seg.id);
      setActivePreset("");
    },
    [],
  );

  const removeSegment = useCallback(
    (segId: string) => {
      setLines((prev) => {
        const next = structuredClone(prev);
        for (const line of next) {
          line.segments = line.segments.filter((s) => s.id !== segId);
        }
        // Remove empty lines (but keep at least one)
        const filtered = next.filter((l) => l.segments.length > 0);
        return filtered.length > 0 ? filtered : [createLine()];
      });
      if (selectedSegmentId === segId) setSelectedSegmentId(null);
      setActivePreset("");
    },
    [selectedSegmentId],
  );

  const moveSegment = useCallback(
    (segId: string, direction: "up" | "down") => {
      setLines((prev) => {
        const next = structuredClone(prev);
        for (const line of next) {
          const idx = line.segments.findIndex((s) => s.id === segId);
          if (idx === -1) continue;
          const newIdx = direction === "up" ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= line.segments.length) return prev;
          [line.segments[idx], line.segments[newIdx]] = [
            line.segments[newIdx],
            line.segments[idx],
          ];
          return next;
        }
        return prev;
      });
      setActivePreset("");
    },
    [],
  );

  const updateSegment = useCallback(
    (segId: string, updates: Partial<Segment>) => {
      setLines((prev) => {
        const next = structuredClone(prev);
        for (const line of next) {
          const seg = line.segments.find((s) => s.id === segId);
          if (seg) {
            Object.assign(seg, updates);
            return next;
          }
        }
        return prev;
      });
      setActivePreset("");
    },
    [],
  );

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, createLine()]);
    setActivePreset("");
  }, []);

  const removeLine = useCallback(
    (lineId: string) => {
      setLines((prev) => {
        const next = prev.filter((l) => l.id !== lineId);
        return next.length > 0 ? next : [createLine()];
      });
      setActivePreset("");
    },
    [],
  );

  // ─── Segment categories grouped ──────────────────────────────────────────

  const categories = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
    segments: SEGMENT_DEFINITIONS.filter((d) => d.category === key),
  }));

  return (
    <div className="space-y-6">
      {/* Preset bar */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Start from a template
        </h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.name)}
              className={`group flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm cursor-pointer ${
                activePreset === preset.name
                  ? "bg-primary/15 border-primary/50 text-primary shadow-lg shadow-primary/10 scale-[1.02]"
                  : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-secondary hover:shadow-md hover:shadow-black/20 hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              <span className="text-lg">{preset.emoji}</span>
              <div className="text-left">
                <div className="font-semibold">{preset.name}</div>
                <div className={`text-[10px] ${
                  activePreset === preset.name
                    ? "text-primary/60"
                    : "text-muted-foreground group-hover:text-muted-foreground"
                }`}>
                  {preset.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Preview */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Live Preview
        </h3>
        <TerminalPreview lines={lines} />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Segment management */}
        <div className="space-y-4">
          {/* Current segments */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-foreground">
                    Your Statusline
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Click a segment to configure it</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addLine}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <PlusIcon /> Add Line
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {lines.map((line, lineIdx) => (
                <div key={line.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Line {lineIdx + 1}
                    </span>
                    {lines.length > 1 && (
                      <button
                        onClick={() => removeLine(line.id)}
                        className="text-muted-foreground/70 hover:text-destructive transition-colors p-0.5"
                        title="Remove line"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg bg-secondary border border-border">
                    {line.segments.length === 0 && (
                      <span className="text-[10px] text-muted-foreground/70 italic self-center px-1">
                        Empty line - add segments below
                      </span>
                    )}
                    {line.segments.map((seg, segIdx) => {
                      const def = SEGMENT_DEFINITIONS.find(
                        (d) => d.type === seg.type,
                      );
                      return (
                        <div
                          key={seg.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedSegmentId(seg.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setSelectedSegmentId(seg.id);
                          }}
                          className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
                            selectedSegmentId === seg.id
                              ? "bg-primary/20 text-primary ring-2 ring-primary/40 shadow-sm shadow-primary/10"
                              : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground border border-border hover:border-border"
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: ANSI_COLORS[seg.color].css,
                            }}
                          />
                          <span>{def?.name ?? seg.type}</span>
                          <span className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSegment(seg.id, "up");
                              }}
                              className="hover:text-foreground"
                              title="Move left"
                              disabled={segIdx === 0}
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <polyline points="15 18 9 12 15 6" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSegment(seg.id, "down");
                              }}
                              className="hover:text-foreground"
                              title="Move right"
                              disabled={segIdx === line.segments.length - 1}
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSegment(seg.id);
                              }}
                              className="hover:text-destructive"
                              title="Remove"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Segment config panel */}
          {selectedSegment && (
            <Card className="bg-card border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <SegmentIcon
                    type={
                      SEGMENT_DEFINITIONS.find(
                        (d) => d.type === selectedSegment.type,
                      )?.icon ?? ""
                    }
                  />
                  Configure:{" "}
                  {SEGMENT_DEFINITIONS.find(
                    (d) => d.type === selectedSegment.type,
                  )?.name ?? selectedSegment.type}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Color */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Color</Label>
                  <ColorPicker
                    value={selectedSegment.color}
                    onChange={(c) =>
                      updateSegment(selectedSegment.id, { color: c })
                    }
                  />
                </div>

                {/* Bold */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Bold</Label>
                  <Switch
                    checked={selectedSegment.bold}
                    onCheckedChange={(checked) =>
                      updateSegment(selectedSegment.id, { bold: checked })
                    }
                  />
                </div>

                {/* Prefix/Suffix */}
                {selectedSegment.type !== "separator" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="seg-prefix" className="text-xs text-muted-foreground">Prefix</Label>
                      <input
                        id="seg-prefix"
                        type="text"
                        value={selectedSegment.prefix}
                        onChange={(e) =>
                          updateSegment(selectedSegment.id, {
                            prefix: e.target.value,
                          })
                        }
                        className="w-full h-8 px-2 text-xs bg-secondary border border-border rounded text-foreground focus:outline-none focus:border-ring"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="seg-suffix" className="text-xs text-muted-foreground">Suffix</Label>
                      <input
                        id="seg-suffix"
                        type="text"
                        value={selectedSegment.suffix}
                        onChange={(e) =>
                          updateSegment(selectedSegment.id, {
                            suffix: e.target.value,
                          })
                        }
                        className="w-full h-8 px-2 text-xs bg-secondary border border-border rounded text-foreground focus:outline-none focus:border-ring"
                      />
                    </div>
                  </div>
                )}

                {/* Custom text */}
                {selectedSegment.type === "text" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="seg-text" className="text-xs text-muted-foreground">Text</Label>
                    <input
                      id="seg-text"
                      type="text"
                      value={selectedSegment.customText ?? ""}
                      onChange={(e) =>
                        updateSegment(selectedSegment.id, {
                          customText: e.target.value,
                        })
                      }
                      className="w-full h-8 px-2 text-xs bg-secondary border border-border rounded text-foreground focus:outline-none focus:border-ring"
                    />
                  </div>
                )}

                {/* Context bar options */}
                {selectedSegment.type === "context_bar" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Bar Width: {selectedSegment.barWidth ?? 10}
                      </Label>
                      <Slider
                        value={[selectedSegment.barWidth ?? 10]}
                        onValueChange={(v) =>
                          updateSegment(selectedSegment.id, { barWidth: Array.isArray(v) ? v[0] : v })
                        }
                        min={5}
                        max={30}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Bar Style</Label>
                      <Select
                        value={selectedSegment.barStyle ?? "blocks"}
                        onValueChange={(v) =>
                          updateSegment(selectedSegment.id, {
                            barStyle: v as "blocks" | "hashes" | "dots",
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="blocks" className="text-xs">
                            Blocks (\u2588\u2591)
                          </SelectItem>
                          <SelectItem value="hashes" className="text-xs">
                            Hashes (#-)
                          </SelectItem>
                          <SelectItem value="dots" className="text-xs">
                            Dots (\u25CF\u25CB)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        Threshold Colors
                        <span className="block text-[10px] text-muted-foreground/70">
                          Green &lt;70% / Yellow 70-89% / Red 90%+
                        </span>
                      </Label>
                      <Switch
                        checked={selectedSegment.thresholdColors ?? false}
                        onCheckedChange={(checked) =>
                          updateSegment(selectedSegment.id, {
                            thresholdColors: checked,
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Segment palette */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-foreground">
                  Add Segments
                </CardTitle>
                <p className="text-[10px] text-muted-foreground mt-0.5">Click to add to the last line</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.map(({ key, label, segments }) => (
                <div key={key}>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {label}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {segments.map((def) => (
                      <button
                        key={def.type}
                        onClick={() =>
                          addSegment(
                            def.type,
                            Math.max(0, lines.length - 1),
                          )
                        }
                        className="group flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-150 text-xs border border-border hover:border-primary/30 cursor-pointer active:scale-95"
                        title={def.description}
                      >
                        <span className="opacity-60 group-hover:opacity-100 transition-opacity">
                          <SegmentIcon type={def.icon} />
                        </span>
                        <span>{def.name}</span>
                        <span className="opacity-0 group-hover:opacity-60 transition-opacity text-[10px] ml-auto">+</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Padding: {padding}
                </Label>
                <Slider
                  value={[padding]}
                  onValueChange={(v) => setPadding(Array.isArray(v) ? v[0] : v)}
                  min={0}
                  max={8}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Refresh Interval
                  </Label>
                  <p className="text-[10px] text-muted-foreground/70">
                    Re-run script every N seconds (for time-based data)
                  </p>
                </div>
                <Select
                  value={
                    refreshInterval === null ? "off" : String(refreshInterval)
                  }
                  onValueChange={(v) =>
                    setRefreshInterval(v === "off" ? null : Number(v))
                  }
                >
                  <SelectTrigger className="w-24 h-8 text-xs bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="off" className="text-xs">
                      Off
                    </SelectItem>
                    <SelectItem value="1" className="text-xs">
                      1s
                    </SelectItem>
                    <SelectItem value="5" className="text-xs">
                      5s
                    </SelectItem>
                    <SelectItem value="10" className="text-xs">
                      10s
                    </SelectItem>
                    <SelectItem value="30" className="text-xs">
                      30s
                    </SelectItem>
                    <SelectItem value="60" className="text-xs">
                      60s
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Code output */}
        <div>
          <CodeOutput config={config} onLanguageChange={setLanguage} />
        </div>
      </div>
    </div>
  );
}
