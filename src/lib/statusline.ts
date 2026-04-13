// ─── Types ──────────────────────────────────────────────────────────────────

export type AnsiColor =
  | "default"
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "bright_black"
  | "bright_red"
  | "bright_green"
  | "bright_yellow"
  | "bright_blue"
  | "bright_magenta"
  | "bright_cyan"
  | "bright_white";

export type SegmentType =
  | "model"
  | "context_bar"
  | "context_pct"
  | "cost"
  | "duration"
  | "git_branch"
  | "git_status"
  | "directory"
  | "session_name"
  | "version"
  | "vim_mode"
  | "separator"
  | "text"
  | "rate_limit_5h"
  | "rate_limit_7d"
  | "lines_changed"
  | "worktree"
  | "agent"
  | "tokens";

export interface Segment {
  id: string;
  type: SegmentType;
  color: AnsiColor;
  bold: boolean;
  prefix: string;
  suffix: string;
  customText?: string;
  barWidth?: number;
  barStyle?: "blocks" | "hashes" | "dots";
  thresholdColors?: boolean;
}

export interface StatuslineLine {
  id: string;
  segments: Segment[];
}

export interface StatuslineConfig {
  lines: StatuslineLine[];
  language: "bash" | "python" | "node";
  padding: number;
  refreshInterval: number | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const ANSI_COLORS: Record<
  AnsiColor,
  { code: string; css: string; name: string }
> = {
  default: { code: "0", css: "#d4d4d8", name: "Default" },
  black: { code: "30", css: "#1e1e2e", name: "Black" },
  red: { code: "31", css: "#f38ba8", name: "Red" },
  green: { code: "32", css: "#a6e3a1", name: "Green" },
  yellow: { code: "33", css: "#f9e2af", name: "Yellow" },
  blue: { code: "34", css: "#89b4fa", name: "Blue" },
  magenta: { code: "35", css: "#cba6f7", name: "Magenta" },
  cyan: { code: "36", css: "#94e2d5", name: "Cyan" },
  white: { code: "37", css: "#cdd6f4", name: "White" },
  bright_black: { code: "90", css: "#585b70", name: "Bright Black" },
  bright_red: { code: "91", css: "#f38ba8", name: "Bright Red" },
  bright_green: { code: "92", css: "#a6e3a1", name: "Bright Green" },
  bright_yellow: { code: "93", css: "#f9e2af", name: "Bright Yellow" },
  bright_blue: { code: "94", css: "#89b4fa", name: "Bright Blue" },
  bright_magenta: { code: "95", css: "#cba6f7", name: "Bright Magenta" },
  bright_cyan: { code: "96", css: "#94e2d5", name: "Bright Cyan" },
  bright_white: { code: "97", css: "#ffffff", name: "Bright White" },
};

export interface SegmentDefinition {
  type: SegmentType;
  name: string;
  description: string;
  icon: string;
  category: "info" | "context" | "git" | "cost" | "advanced" | "utility";
  defaultPrefix: string;
  defaultSuffix: string;
  defaultColor: AnsiColor;
  needsGit?: boolean;
  needsRefresh?: boolean;
}

export const SEGMENT_DEFINITIONS: SegmentDefinition[] = [
  {
    type: "model",
    name: "Model",
    description: "Current model name (e.g. Opus 4.6)",
    icon: "cpu",
    category: "info",
    defaultPrefix: "[",
    defaultSuffix: "]",
    defaultColor: "cyan",
  },
  {
    type: "directory",
    name: "Directory",
    description: "Current working directory name",
    icon: "folder",
    category: "info",
    defaultPrefix: " ",
    defaultSuffix: "",
    defaultColor: "default",
  },
  {
    type: "session_name",
    name: "Session",
    description: "Custom session name (if set)",
    icon: "tag",
    category: "info",
    defaultPrefix: " ",
    defaultSuffix: "",
    defaultColor: "magenta",
  },
  {
    type: "version",
    name: "Version",
    description: "Claude Code version",
    icon: "package",
    category: "info",
    defaultPrefix: "v",
    defaultSuffix: "",
    defaultColor: "bright_black",
  },
  {
    type: "vim_mode",
    name: "Vim Mode",
    description: "Current vim mode (NORMAL/INSERT)",
    icon: "terminal",
    category: "info",
    defaultPrefix: " [",
    defaultSuffix: "]",
    defaultColor: "yellow",
  },
  {
    type: "agent",
    name: "Agent",
    description: "Agent name when using --agent",
    icon: "bot",
    category: "info",
    defaultPrefix: " agent:",
    defaultSuffix: "",
    defaultColor: "magenta",
  },
  {
    type: "context_bar",
    name: "Context Bar",
    description: "Visual progress bar for context usage",
    icon: "bar-chart",
    category: "context",
    defaultPrefix: " ",
    defaultSuffix: "",
    defaultColor: "green",
  },
  {
    type: "context_pct",
    name: "Context %",
    description: "Context window usage percentage",
    icon: "percent",
    category: "context",
    defaultPrefix: " ",
    defaultSuffix: "%",
    defaultColor: "default",
  },
  {
    type: "tokens",
    name: "Tokens",
    description: "Input/output token counts",
    icon: "hash",
    category: "context",
    defaultPrefix: " ",
    defaultSuffix: "",
    defaultColor: "bright_black",
  },
  {
    type: "git_branch",
    name: "Git Branch",
    description: "Current git branch name",
    icon: "git-branch",
    category: "git",
    defaultPrefix: " | ",
    defaultSuffix: "",
    defaultColor: "green",
    needsGit: true,
    needsRefresh: true,
  },
  {
    type: "git_status",
    name: "Git Status",
    description: "Staged (+) and modified (~) file counts",
    icon: "git-commit",
    category: "git",
    defaultPrefix: " ",
    defaultSuffix: "",
    defaultColor: "yellow",
    needsGit: true,
    needsRefresh: true,
  },
  {
    type: "cost",
    name: "Cost",
    description: "Total session cost in USD",
    icon: "dollar-sign",
    category: "cost",
    defaultPrefix: " $",
    defaultSuffix: "",
    defaultColor: "yellow",
  },
  {
    type: "duration",
    name: "Duration",
    description: "Elapsed session time",
    icon: "clock",
    category: "cost",
    defaultPrefix: " ",
    defaultSuffix: "",
    defaultColor: "default",
  },
  {
    type: "lines_changed",
    name: "Lines Changed",
    description: "Lines added and removed",
    icon: "file-diff",
    category: "cost",
    defaultPrefix: " ",
    defaultSuffix: "",
    defaultColor: "default",
  },
  {
    type: "rate_limit_5h",
    name: "5h Rate Limit",
    description: "5-hour rolling rate limit usage",
    icon: "timer",
    category: "advanced",
    defaultPrefix: " 5h:",
    defaultSuffix: "%",
    defaultColor: "default",
  },
  {
    type: "rate_limit_7d",
    name: "7d Rate Limit",
    description: "7-day rate limit usage",
    icon: "calendar",
    category: "advanced",
    defaultPrefix: " 7d:",
    defaultSuffix: "%",
    defaultColor: "default",
  },
  {
    type: "worktree",
    name: "Worktree",
    description: "Active worktree name",
    icon: "tree-deciduous",
    category: "advanced",
    defaultPrefix: " wt:",
    defaultSuffix: "",
    defaultColor: "blue",
  },
  {
    type: "separator",
    name: "Separator",
    description: "Visual separator (|)",
    icon: "minus",
    category: "utility",
    defaultPrefix: "",
    defaultSuffix: "",
    defaultColor: "bright_black",
  },
  {
    type: "text",
    name: "Custom Text",
    description: "Any custom text string",
    icon: "type",
    category: "utility",
    defaultPrefix: "",
    defaultSuffix: "",
    defaultColor: "default",
  },
];

// ─── Mock Data ──────────────────────────────────────────────────────────────

export const MOCK_SESSION_DATA = {
  cwd: "/Users/dev/my-project",
  session_id: "abc123def456",
  session_name: "feature-work",
  transcript_path: "/Users/dev/.claude/sessions/abc123.jsonl",
  model: { id: "claude-opus-4-6", display_name: "Opus 4.6" },
  workspace: {
    current_dir: "/Users/dev/my-project",
    project_dir: "/Users/dev/my-project",
    added_dirs: [],
  },
  version: "2.1.90",
  output_style: { name: "default" },
  cost: {
    total_cost_usd: 1.23,
    total_duration_ms: 345000,
    total_api_duration_ms: 23000,
    total_lines_added: 156,
    total_lines_removed: 23,
  },
  context_window: {
    total_input_tokens: 152340,
    total_output_tokens: 45210,
    context_window_size: 200000,
    used_percentage: 42,
    remaining_percentage: 58,
    current_usage: {
      input_tokens: 85000,
      output_tokens: 12000,
      cache_creation_input_tokens: 50000,
      cache_read_input_tokens: 20000,
    },
  },
  exceeds_200k_tokens: false,
  rate_limits: {
    five_hour: { used_percentage: 23.5, resets_at: 1738425600 },
    seven_day: { used_percentage: 41.2, resets_at: 1738857600 },
  },
  vim: { mode: "NORMAL" },
  agent: { name: "code-reviewer" },
  worktree: {
    name: "my-feature",
    path: "/path/to/.claude/worktrees/my-feature",
    branch: "worktree-my-feature",
    original_cwd: "/path/to/project",
    original_branch: "main",
  },
};

// ─── Preview Renderer ───────────────────────────────────────────────────────

export function renderSegmentPreview(
  segment: Segment,
): { text: string; color: string; bold: boolean } {
  const data = MOCK_SESSION_DATA;
  const colorCss = ANSI_COLORS[segment.color]?.css ?? ANSI_COLORS.default.css;
  let text = "";

  switch (segment.type) {
    case "model":
      text = `${segment.prefix}${data.model.display_name}${segment.suffix}`;
      break;
    case "directory": {
      const dir = data.workspace.current_dir.split("/").pop() || "";
      text = `${segment.prefix}${dir}${segment.suffix}`;
      break;
    }
    case "session_name":
      text = `${segment.prefix}${data.session_name}${segment.suffix}`;
      break;
    case "version":
      text = `${segment.prefix}${data.version}${segment.suffix}`;
      break;
    case "vim_mode":
      text = `${segment.prefix}${data.vim.mode}${segment.suffix}`;
      break;
    case "agent":
      text = `${segment.prefix}${data.agent.name}${segment.suffix}`;
      break;
    case "context_bar": {
      const pct = data.context_window.used_percentage;
      const width = segment.barWidth ?? 10;
      const filled = Math.floor((pct * width) / 100);
      const empty = width - filled;
      let filledChar = "\u2588";
      let emptyChar = "\u2591";
      if (segment.barStyle === "hashes") {
        filledChar = "#";
        emptyChar = "-";
      } else if (segment.barStyle === "dots") {
        filledChar = "\u25CF";
        emptyChar = "\u25CB";
      }
      const bar = filledChar.repeat(filled) + emptyChar.repeat(empty);
      text = `${segment.prefix}${bar}${segment.suffix}`;

      if (segment.thresholdColors) {
        const thresholdColor =
          pct >= 90 ? ANSI_COLORS.red.css : pct >= 70 ? ANSI_COLORS.yellow.css : ANSI_COLORS.green.css;
        return { text, color: thresholdColor, bold: segment.bold };
      }
      break;
    }
    case "context_pct": {
      const pct = Math.floor(data.context_window.used_percentage);
      text = `${segment.prefix}${pct}${segment.suffix}`;
      break;
    }
    case "tokens": {
      const inp = (data.context_window.total_input_tokens / 1000).toFixed(0);
      const out = (data.context_window.total_output_tokens / 1000).toFixed(0);
      text = `${segment.prefix}${inp}k in / ${out}k out${segment.suffix}`;
      break;
    }
    case "git_branch":
      text = `${segment.prefix}main${segment.suffix}`;
      break;
    case "git_status":
      text = `${segment.prefix}+2 ~3${segment.suffix}`;
      break;
    case "cost": {
      const cost = data.cost.total_cost_usd.toFixed(2);
      text = `${segment.prefix}${cost}${segment.suffix}`;
      break;
    }
    case "duration": {
      const totalSec = Math.floor(data.cost.total_duration_ms / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      text = `${segment.prefix}${mins}m ${secs}s${segment.suffix}`;
      break;
    }
    case "lines_changed":
      text = `${segment.prefix}+${data.cost.total_lines_added} -${data.cost.total_lines_removed}${segment.suffix}`;
      break;
    case "rate_limit_5h":
      text = `${segment.prefix}${Math.round(data.rate_limits.five_hour.used_percentage)}${segment.suffix}`;
      break;
    case "rate_limit_7d":
      text = `${segment.prefix}${Math.round(data.rate_limits.seven_day.used_percentage)}${segment.suffix}`;
      break;
    case "worktree":
      text = `${segment.prefix}my-feature${segment.suffix}`;
      break;
    case "separator":
      text = " | ";
      break;
    case "text":
      text = `${segment.prefix}${segment.customText ?? ""}${segment.suffix}`;
      break;
  }

  return { text, color: colorCss, bold: segment.bold };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

let _id = 0;
export function uid(): string {
  return `seg_${++_id}`;
}

export function createSegment(type: SegmentType): Segment {
  const def = SEGMENT_DEFINITIONS.find((d) => d.type === type)!;
  return {
    id: uid(),
    type,
    color: def.defaultColor,
    bold: false,
    prefix: def.defaultPrefix,
    suffix: def.defaultSuffix,
    customText: type === "text" ? "hello" : undefined,
    barWidth: type === "context_bar" ? 10 : undefined,
    barStyle: type === "context_bar" ? "blocks" : undefined,
    thresholdColors: type === "context_bar" ? true : undefined,
  };
}

export function createLine(segments: Segment[] = []): StatuslineLine {
  return { id: uid(), segments };
}

// ─── Presets ────────────────────────────────────────────────────────────────

// Segment template: same as Segment but without `id` (generated at apply-time)
type SegmentTemplate = Omit<Segment, "id"> & { id?: string };

// Line template: segments without IDs
interface LineTemplate {
  segments: SegmentTemplate[];
}

function seg(type: SegmentType, overrides?: Partial<SegmentTemplate>): SegmentTemplate {
  const def = SEGMENT_DEFINITIONS.find((d) => d.type === type)!;
  return {
    type,
    color: def.defaultColor,
    bold: false,
    prefix: def.defaultPrefix,
    suffix: def.defaultSuffix,
    customText: type === "text" ? "hello" : undefined,
    barWidth: type === "context_bar" ? 10 : undefined,
    barStyle: type === "context_bar" ? "blocks" : undefined,
    thresholdColors: type === "context_bar" ? true : undefined,
    ...overrides,
  };
}

export interface Preset {
  name: string;
  description: string;
  emoji: string;
  _lines: LineTemplate[];
}

/** Instantiate a preset's templates into real StatuslineLines with unique IDs */
export function instantiatePreset(preset: Preset): StatuslineLine[] {
  return preset._lines.map((lt) => createLine(
    lt.segments.map((st) => ({ ...createSegment(st.type), ...st, id: uid() })),
  ));
}

export const PRESETS: Preset[] = [
  {
    name: "Minimal",
    description: "Model name and context percentage",
    emoji: "\u26A1",
    _lines: [{ segments: [seg("model"), seg("context_pct")] }],
  },
  {
    name: "Developer",
    description: "Model, directory, git branch, and context bar",
    emoji: "\uD83D\uDCBB",
    _lines: [
      {
        segments: [
          seg("model"),
          seg("directory", { prefix: " \uD83D\uDCC1 " }),
          seg("git_branch"),
          seg("git_status"),
        ],
      },
      {
        segments: [
          seg("context_bar", { thresholdColors: true }),
          seg("context_pct"),
          seg("separator"),
          seg("cost", { prefix: " \uD83D\uDCB0 $" }),
          seg("separator"),
          seg("duration", { prefix: " \u23F1\uFE0F " }),
        ],
      },
    ],
  },
  {
    name: "Dashboard",
    description: "Full multi-line dashboard with everything",
    emoji: "\uD83D\uDCCA",
    _lines: [
      {
        segments: [
          seg("model", { color: "cyan" }),
          seg("directory", { prefix: " \uD83D\uDCC1 " }),
          seg("git_branch", { prefix: " \uD83C\uDF3F " }),
          seg("git_status"),
          seg("vim_mode", { color: "yellow" }),
        ],
      },
      {
        segments: [
          seg("context_bar", { thresholdColors: true, barWidth: 20 }),
          seg("context_pct"),
          seg("separator"),
          seg("cost", { prefix: " \uD83D\uDCB0 $", color: "yellow" }),
          seg("separator"),
          seg("duration", { prefix: " \u23F1\uFE0F " }),
          seg("separator"),
          seg("lines_changed", { prefix: " \uD83D\uDCDD ", color: "green" }),
        ],
      },
    ],
  },
  {
    name: "Cost Tracker",
    description: "Focused on cost and API usage",
    emoji: "\uD83D\uDCB5",
    _lines: [
      {
        segments: [
          seg("model"),
          seg("separator"),
          seg("cost", { prefix: " \uD83D\uDCB0 $", color: "yellow" }),
          seg("separator"),
          seg("duration", { prefix: " \u23F1\uFE0F " }),
          seg("separator"),
          seg("tokens", { color: "bright_black" }),
        ],
      },
    ],
  },
  {
    name: "Git Power",
    description: "Git-focused with branch and file status",
    emoji: "\uD83C\uDF3F",
    _lines: [
      {
        segments: [
          seg("model"),
          seg("directory", { prefix: " \uD83D\uDCC1 " }),
          seg("git_branch", { prefix: " \uD83C\uDF3F ", color: "green" }),
          seg("git_status", { color: "yellow" }),
          seg("separator"),
          seg("lines_changed", { color: "cyan" }),
        ],
      },
    ],
  },
  {
    name: "Rate Watcher",
    description: "Monitor rate limits for Pro/Max subscribers",
    emoji: "\uD83D\uDD04",
    _lines: [
      {
        segments: [
          seg("model"),
          seg("separator"),
          seg("context_pct"),
          seg("separator"),
          seg("rate_limit_5h", { color: "yellow" }),
          seg("separator"),
          seg("rate_limit_7d", { color: "cyan" }),
        ],
      },
    ],
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  info: "Info",
  context: "Context Window",
  git: "Git",
  cost: "Cost & Stats",
  advanced: "Advanced",
  utility: "Utility",
};
