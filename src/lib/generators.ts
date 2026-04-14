import {
  type StatuslineConfig,
  type Segment,
  type StatuslineLine,
  ANSI_COLORS,
} from "./statusline";

/** Map segment types that share the same extraction to a common key */
function extractionKey(type: string): string {
  if (type === "context_bar" || type === "context_pct") return "context_pct";
  if (type === "git_branch" || type === "git_status") return "git";
  return type;
}

// ─── Bash Generator ─────────────────────────────────────────────────────────

function bashColorVar(color: string, bold: boolean): string {
  if (color === "default" && !bold) return "";
  const parts: string[] = [];
  if (bold) parts.push("1");
  if (color !== "default") parts.push(ANSI_COLORS[color as keyof typeof ANSI_COLORS]?.code ?? "0");
  return `'\\033[${parts.join(";")}m'`;
}

function bashExtractVar(seg: Segment): string[] {
  const lines: string[] = [];
  switch (seg.type) {
    case "model":
      lines.push(`MODEL=$(echo "$input" | jq -r '.model.display_name')`);
      break;
    case "directory":
      lines.push(`DIR=$(echo "$input" | jq -r '.workspace.current_dir')`);
      break;
    case "session_name":
      lines.push(`SESSION_NAME=$(echo "$input" | jq -r '.session_name // ""')`);
      break;
    case "version":
      lines.push(`VERSION=$(echo "$input" | jq -r '.version')`);
      break;
    case "vim_mode":
      lines.push(`VIM_MODE=$(echo "$input" | jq -r '.vim.mode // ""')`);
      break;
    case "agent":
      lines.push(`AGENT_NAME=$(echo "$input" | jq -r '.agent.name // ""')`);
      break;
    case "context_bar":
    case "context_pct":
      lines.push(
        `PCT=$(echo "$input" | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)`,
      );
      break;
    case "tokens":
      lines.push(
        `INPUT_TOKENS=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')`,
      );
      lines.push(
        `OUTPUT_TOKENS=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0')`,
      );
      break;
    case "cost":
      lines.push(`COST=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')`);
      break;
    case "duration":
      lines.push(
        `DURATION_MS=$(echo "$input" | jq -r '.cost.total_duration_ms // 0')`,
      );
      break;
    case "lines_changed":
      lines.push(
        `LINES_ADDED=$(echo "$input" | jq -r '.cost.total_lines_added // 0')`,
      );
      lines.push(
        `LINES_REMOVED=$(echo "$input" | jq -r '.cost.total_lines_removed // 0')`,
      );
      break;
    case "rate_limit_5h":
      lines.push(
        `RATE_5H=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')`,
      );
      break;
    case "rate_limit_7d":
      lines.push(
        `RATE_7D=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')`,
      );
      break;
    case "worktree":
      lines.push(
        `WORKTREE=$(echo "$input" | jq -r '.worktree.name // ""')`,
      );
      break;
  }
  return lines;
}

function bashSegmentExpr(seg: Segment): string {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const colorStart = bashColorVar(seg.color, seg.bold);
  const reset = colorStart ? "'\\033[0m'" : "";
  const wrap = (inner: string) => {
    if (!colorStart) return inner;
    return `${colorStart}${inner}${reset}`;
  };

  switch (seg.type) {
    case "model":
      return wrap(`${esc(seg.prefix)}\${MODEL}${esc(seg.suffix)}`);
    case "directory":
      return wrap(
        `${esc(seg.prefix)}\${DIR##*/}${esc(seg.suffix)}`,
      );
    case "session_name":
      return wrap(
        `${esc(seg.prefix)}\${SESSION_NAME}${esc(seg.suffix)}`,
      );
    case "version":
      return wrap(`${esc(seg.prefix)}\${VERSION}${esc(seg.suffix)}`);
    case "vim_mode":
      return wrap(
        `${esc(seg.prefix)}\${VIM_MODE}${esc(seg.suffix)}`,
      );
    case "agent":
      return wrap(
        `${esc(seg.prefix)}\${AGENT_NAME}${esc(seg.suffix)}`,
      );
    case "context_bar": {
      return `\${BAR_COLOR}\${BAR}\${RESET_COLOR}`;
    }
    case "context_pct":
      return wrap(`${esc(seg.prefix)}\${PCT}${esc(seg.suffix)}`);
    case "tokens":
      return wrap(
        `${esc(seg.prefix)}\$((INPUT_TOKENS/1000))k in / \$((OUTPUT_TOKENS/1000))k out${esc(seg.suffix)}`,
      );
    case "cost":
      return wrap(
        `${esc(seg.prefix)}\$(printf '%.2f' "\$COST")${esc(seg.suffix)}`,
      );
    case "duration":
      return wrap(
        `${esc(seg.prefix)}\${MINS}m \${SECS}s${esc(seg.suffix)}`,
      );
    case "lines_changed":
      return wrap(
        `${esc(seg.prefix)}+\${LINES_ADDED} -\${LINES_REMOVED}${esc(seg.suffix)}`,
      );
    case "rate_limit_5h":
      return wrap(
        `${esc(seg.prefix)}\$(printf '%.0f' "\$RATE_5H")${esc(seg.suffix)}`,
      );
    case "rate_limit_7d":
      return wrap(
        `${esc(seg.prefix)}\$(printf '%.0f' "\$RATE_7D")${esc(seg.suffix)}`,
      );
    case "worktree":
      return wrap(
        `${esc(seg.prefix)}\${WORKTREE}${esc(seg.suffix)}`,
      );
    case "separator":
      return wrap(" | ");
    case "text":
      return wrap(
        `${esc(seg.prefix)}${esc(seg.customText ?? "")}${esc(seg.suffix)}`,
      );
    default:
      return "";
  }
}

function bashContextBar(seg: Segment): string[] {
  const width = seg.barWidth ?? 10;
  let filledChar = "\u2588";
  let emptyChar = "\u2591";
  if (seg.barStyle === "hashes") {
    filledChar = "#";
    emptyChar = "-";
  } else if (seg.barStyle === "dots") {
    filledChar = "\\u25CF";
    emptyChar = "\\u25CB";
  }

  const lines: string[] = [];
  if (seg.thresholdColors) {
    lines.push(`# Context bar with threshold colors`);
    lines.push(`if [ "$PCT" -ge 90 ]; then BAR_COLOR='\\033[31m'`);
    lines.push(`elif [ "$PCT" -ge 70 ]; then BAR_COLOR='\\033[33m'`);
    lines.push(`else BAR_COLOR='\\033[32m'; fi`);
  } else {
    const cv = bashColorVar(seg.color, seg.bold);
    lines.push(`BAR_COLOR=${cv || "''"}`);
  }
  lines.push(`RESET_COLOR='\\033[0m'`);
  lines.push(`BAR_WIDTH=${width}`);
  lines.push(`FILLED=$((PCT * BAR_WIDTH / 100))`);
  lines.push(`EMPTY=$((BAR_WIDTH - FILLED))`);
  lines.push(`BAR=""`);
  lines.push(
    `[ "$FILLED" -gt 0 ] && printf -v FILL "%\${FILLED}s" && BAR="\${FILL// /${filledChar}}"`,
  );
  lines.push(
    `[ "$EMPTY" -gt 0 ] && printf -v PAD "%\${EMPTY}s" && BAR="\${BAR}\${PAD// /${emptyChar}}"`,
  );
  return lines;
}

export function generateBash(config: StatuslineConfig): string {
  const lines: string[] = ["#!/bin/bash", "input=$(cat)", ""];

  // Collect all unique extraction variables needed
  const extractedTypes = new Set<string>();
  const allSegments = config.lines.flatMap((l) => l.segments);
  const extractions: string[] = [];
  let hasContextBar = false;
  let contextBarSeg: Segment | null = null;
  let hasGit = false;
  let hasDuration = false;

  for (const seg of allSegments) {
    const key = extractionKey(seg.type);
    if (!extractedTypes.has(key)) {
      extractedTypes.add(key);
      extractions.push(...bashExtractVar(seg));
    }
    if (seg.type === "context_bar") {
      hasContextBar = true;
      contextBarSeg = seg;
    }
    if (seg.type === "git_branch" || seg.type === "git_status") hasGit = true;
    if (seg.type === "duration") hasDuration = true;
  }

  lines.push("# Extract fields from JSON input");
  lines.push(...extractions);
  lines.push("");

  if (hasDuration) {
    lines.push("# Calculate duration");
    lines.push("DURATION_SEC=$((DURATION_MS / 1000))");
    lines.push("MINS=$((DURATION_SEC / 60))");
    lines.push("SECS=$((DURATION_SEC % 60))");
    lines.push("");
  }

  if (hasGit) {
    lines.push("# Git info");
    lines.push(
      'if git rev-parse --git-dir > /dev/null 2>&1; then',
    );
    if (extractedTypes.has("git_branch")) {
      lines.push(
        '    BRANCH=$(git branch --show-current 2>/dev/null)',
      );
    }
    if (extractedTypes.has("git_status")) {
      lines.push(
        "    STAGED=$(git diff --cached --numstat 2>/dev/null | wc -l | tr -d ' ')",
      );
      lines.push(
        "    MODIFIED=$(git diff --numstat 2>/dev/null | wc -l | tr -d ' ')",
      );
    }
    lines.push("fi");
    lines.push("");
  }

  if (hasContextBar && contextBarSeg) {
    lines.push(...bashContextBar(contextBarSeg));
    lines.push("");
  }

  // Generate echo statements for each line
  lines.push("# Output");
  for (const line of config.lines) {
    const parts = line.segments.map((s) => bashSegmentExpr(s));
    lines.push(`echo -e "${parts.join("")}"`);
  }

  return lines.join("\n");
}

// ─── Python Generator ───────────────────────────────────────────────────────

function pyColorExpr(color: string, bold: boolean): string {
  if (color === "default" && !bold) return "";
  const parts: string[] = [];
  if (bold) parts.push("1");
  if (color !== "default")
    parts.push(ANSI_COLORS[color as keyof typeof ANSI_COLORS]?.code ?? "0");
  return `'\\033[${parts.join(";")}m'`;
}

export function generatePython(config: StatuslineConfig): string {
  const lines: string[] = [
    "#!/usr/bin/env python3",
    "import json, sys, subprocess, os",
    "",
    "data = json.load(sys.stdin)",
    "",
  ];

  const extracted = new Set<string>();
  const allSegments = config.lines.flatMap((l) => l.segments);
  let hasGit = false;
  let hasContextBar = false;
  let contextBarSeg: Segment | null = null;

  // Extract variables
  lines.push("# Extract fields");
  for (const seg of allSegments) {
    const eKey = extractionKey(seg.type);
    if (extracted.has(eKey)) continue;
    extracted.add(eKey);
    switch (seg.type) {
      case "model":
        lines.push(`model = data['model']['display_name']`);
        break;
      case "directory":
        lines.push(
          `directory = os.path.basename(data['workspace']['current_dir'])`,
        );
        break;
      case "session_name":
        lines.push(`session_name = data.get('session_name', '')`);
        break;
      case "version":
        lines.push(`version = data.get('version', '')`);
        break;
      case "vim_mode":
        lines.push(
          `vim_mode = data.get('vim', {}).get('mode', '')`,
        );
        break;
      case "agent":
        lines.push(
          `agent_name = data.get('agent', {}).get('name', '')`,
        );
        break;
      case "context_bar":
      case "context_pct":
        lines.push(
          `pct = int(data.get('context_window', {}).get('used_percentage', 0) or 0)`,
        );
        break;
      case "tokens":
        lines.push(
          `input_tokens = data.get('context_window', {}).get('total_input_tokens', 0) or 0`,
        );
        lines.push(
          `output_tokens = data.get('context_window', {}).get('total_output_tokens', 0) or 0`,
        );
        break;
      case "cost":
        lines.push(
          `cost = data.get('cost', {}).get('total_cost_usd', 0) or 0`,
        );
        break;
      case "duration":
        lines.push(
          `duration_ms = data.get('cost', {}).get('total_duration_ms', 0) or 0`,
        );
        lines.push(`mins, secs = duration_ms // 60000, (duration_ms % 60000) // 1000`);
        break;
      case "lines_changed":
        lines.push(
          `lines_added = data.get('cost', {}).get('total_lines_added', 0) or 0`,
        );
        lines.push(
          `lines_removed = data.get('cost', {}).get('total_lines_removed', 0) or 0`,
        );
        break;
      case "rate_limit_5h":
        lines.push(
          `rate_5h = data.get('rate_limits', {}).get('five_hour', {}).get('used_percentage')`,
        );
        break;
      case "rate_limit_7d":
        lines.push(
          `rate_7d = data.get('rate_limits', {}).get('seven_day', {}).get('used_percentage')`,
        );
        break;
      case "worktree":
        lines.push(
          `worktree = data.get('worktree', {}).get('name', '')`,
        );
        break;
      case "git_branch":
      case "git_status":
        hasGit = true;
        break;
    }
    if (seg.type === "context_bar") {
      hasContextBar = true;
      contextBarSeg = seg;
    }
  }
  lines.push("");

  // ANSI color constants
  lines.push("# Colors");
  lines.push(`RESET = '\\033[0m'`);
  const usedColors = new Set<string>();
  for (const seg of allSegments) {
    if (seg.color !== "default") usedColors.add(seg.color);
  }
  for (const c of usedColors) {
    const code = ANSI_COLORS[c as keyof typeof ANSI_COLORS]?.code ?? "0";
    lines.push(
      `${c.toUpperCase()} = '\\033[${code}m'`,
    );
  }
  lines.push("");

  if (hasGit) {
    lines.push("# Git info");
    lines.push("branch = ''");
    lines.push("staged = 0");
    lines.push("modified = 0");
    lines.push("try:");
    lines.push(
      "    subprocess.check_output(['git', 'rev-parse', '--git-dir'], stderr=subprocess.DEVNULL)",
    );
    lines.push(
      "    branch = subprocess.check_output(['git', 'branch', '--show-current'], text=True, stderr=subprocess.DEVNULL).strip()",
    );
    lines.push(
      "    staged_out = subprocess.check_output(['git', 'diff', '--cached', '--numstat'], text=True).strip()",
    );
    lines.push(
      "    modified_out = subprocess.check_output(['git', 'diff', '--numstat'], text=True).strip()",
    );
    lines.push(
      "    staged = len(staged_out.split('\\n')) if staged_out else 0",
    );
    lines.push(
      "    modified = len(modified_out.split('\\n')) if modified_out else 0",
    );
    lines.push("except:");
    lines.push("    pass");
    lines.push("");
  }

  if (hasContextBar && contextBarSeg) {
    const width = contextBarSeg.barWidth ?? 10;
    let filledChar = "\u2588";
    let emptyChar = "\u2591";
    if (contextBarSeg.barStyle === "hashes") {
      filledChar = "#";
      emptyChar = "-";
    } else if (contextBarSeg.barStyle === "dots") {
      filledChar = "\u25CF";
      emptyChar = "\u25CB";
    }
    lines.push("# Context bar");
    if (contextBarSeg.thresholdColors) {
      lines.push(
        `bar_color = '\\033[31m' if pct >= 90 else '\\033[33m' if pct >= 70 else '\\033[32m'`,
      );
    } else {
      const cv = pyColorExpr(contextBarSeg.color, contextBarSeg.bold);
      lines.push(`bar_color = ${cv || "''"}`);
    }
    lines.push(`filled = pct * ${width} // 100`);
    lines.push(
      `bar = '${filledChar}' * filled + '${emptyChar}' * (${width} - filled)`,
    );
    lines.push("");
  }

  // Generate print statements
  lines.push("# Output");
  for (const line of config.lines) {
    const parts = line.segments.map((s) => pySegmentExpr(s));
    lines.push(`print(f"${parts.join("")}")`);
  }

  return lines.join("\n");
}

function pySegmentExpr(seg: Segment): string {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "\\'");
  const colorName = seg.color !== "default" ? seg.color.toUpperCase() : null;
  const wrap = (inner: string) => {
    if (!colorName && !seg.bold) return inner;
    if (seg.bold && colorName) return `{f'\\033[1m'}{${colorName}}${inner}{RESET}`;
    if (seg.bold) return `{f'\\033[1m'}${inner}{RESET}`;
    return `{${colorName}}${inner}{RESET}`;
  };

  switch (seg.type) {
    case "model":
      return wrap(`${esc(seg.prefix)}{model}${esc(seg.suffix)}`);
    case "directory":
      return wrap(`${esc(seg.prefix)}{directory}${esc(seg.suffix)}`);
    case "session_name":
      return wrap(`${esc(seg.prefix)}{session_name}${esc(seg.suffix)}`);
    case "version":
      return wrap(`${esc(seg.prefix)}{version}${esc(seg.suffix)}`);
    case "vim_mode":
      return wrap(`${esc(seg.prefix)}{vim_mode}${esc(seg.suffix)}`);
    case "agent":
      return wrap(`${esc(seg.prefix)}{agent_name}${esc(seg.suffix)}`);
    case "context_bar":
      return `{bar_color}{bar}{RESET}`;
    case "context_pct":
      return wrap(`${esc(seg.prefix)}{pct}${esc(seg.suffix)}`);
    case "tokens":
      return wrap(
        `${esc(seg.prefix)}{input_tokens//1000}k in / {output_tokens//1000}k out${esc(seg.suffix)}`,
      );
    case "cost":
      return wrap(`${esc(seg.prefix)}{cost:.2f}${esc(seg.suffix)}`);
    case "duration":
      return wrap(`${esc(seg.prefix)}{mins}m {secs}s${esc(seg.suffix)}`);
    case "lines_changed":
      return wrap(
        `${esc(seg.prefix)}+{lines_added} -{lines_removed}${esc(seg.suffix)}`,
      );
    case "rate_limit_5h":
      return wrap(
        `${esc(seg.prefix)}{rate_5h:.0f}${esc(seg.suffix)}`,
      );
    case "rate_limit_7d":
      return wrap(
        `${esc(seg.prefix)}{rate_7d:.0f}${esc(seg.suffix)}`,
      );
    case "worktree":
      return wrap(`${esc(seg.prefix)}{worktree}${esc(seg.suffix)}`);
    case "separator":
      return wrap(" | ");
    case "text":
      return wrap(`${esc(seg.prefix)}${esc(seg.customText ?? "")}${esc(seg.suffix)}`);
    default:
      return "";
  }
}

// ─── Node.js Generator ──────────────────────────────────────────────────────

export function generateNode(config: StatuslineConfig): string {
  const lines: string[] = [
    "#!/usr/bin/env node",
    "const { execSync } = require('child_process');",
    "const path = require('path');",
    "",
    "let input = '';",
    "process.stdin.on('data', chunk => input += chunk);",
    "process.stdin.on('end', () => {",
    "    const data = JSON.parse(input);",
    "",
  ];

  const extracted = new Set<string>();
  const allSegments = config.lines.flatMap((l) => l.segments);
  let hasGit = false;
  let hasContextBar = false;
  let contextBarSeg: Segment | null = null;

  lines.push("    // Extract fields");
  for (const seg of allSegments) {
    const eKey = extractionKey(seg.type);
    if (extracted.has(eKey)) continue;
    extracted.add(eKey);
    switch (seg.type) {
      case "model":
        lines.push(`    const model = data.model.display_name;`);
        break;
      case "directory":
        lines.push(
          `    const dir = path.basename(data.workspace.current_dir);`,
        );
        break;
      case "session_name":
        lines.push(`    const sessionName = data.session_name || '';`);
        break;
      case "version":
        lines.push(`    const version = data.version || '';`);
        break;
      case "vim_mode":
        lines.push(`    const vimMode = data.vim?.mode || '';`);
        break;
      case "agent":
        lines.push(`    const agentName = data.agent?.name || '';`);
        break;
      case "context_bar":
      case "context_pct":
        lines.push(
          `    const pct = Math.floor(data.context_window?.used_percentage || 0);`,
        );
        break;
      case "tokens":
        lines.push(
          `    const inputTokens = data.context_window?.total_input_tokens || 0;`,
        );
        lines.push(
          `    const outputTokens = data.context_window?.total_output_tokens || 0;`,
        );
        break;
      case "cost":
        lines.push(`    const cost = data.cost?.total_cost_usd || 0;`);
        break;
      case "duration":
        lines.push(`    const durationMs = data.cost?.total_duration_ms || 0;`);
        lines.push(
          `    const mins = Math.floor(durationMs / 60000);`,
        );
        lines.push(
          `    const secs = Math.floor((durationMs % 60000) / 1000);`,
        );
        break;
      case "lines_changed":
        lines.push(
          `    const linesAdded = data.cost?.total_lines_added || 0;`,
        );
        lines.push(
          `    const linesRemoved = data.cost?.total_lines_removed || 0;`,
        );
        break;
      case "rate_limit_5h":
        lines.push(
          `    const rate5h = data.rate_limits?.five_hour?.used_percentage;`,
        );
        break;
      case "rate_limit_7d":
        lines.push(
          `    const rate7d = data.rate_limits?.seven_day?.used_percentage;`,
        );
        break;
      case "worktree":
        lines.push(`    const worktree = data.worktree?.name || '';`);
        break;
      case "git_branch":
      case "git_status":
        hasGit = true;
        break;
    }
    if (seg.type === "context_bar") {
      hasContextBar = true;
      contextBarSeg = seg;
    }
  }
  lines.push("");

  // Color constants
  lines.push("    // Colors");
  lines.push(`    const RESET = '\\x1b[0m';`);
  const usedColors = new Set<string>();
  for (const seg of allSegments) {
    if (seg.color !== "default") usedColors.add(seg.color);
  }
  for (const c of usedColors) {
    const code = ANSI_COLORS[c as keyof typeof ANSI_COLORS]?.code ?? "0";
    lines.push(
      `    const ${c.toUpperCase()} = '\\x1b[${code}m';`,
    );
  }
  lines.push("");

  if (hasGit) {
    lines.push("    // Git info");
    lines.push("    let branch = '', staged = 0, modified = 0;");
    lines.push("    try {");
    lines.push(
      "        execSync('git rev-parse --git-dir', { stdio: 'ignore' });",
    );
    lines.push(
      "        branch = execSync('git branch --show-current', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();",
    );
    lines.push(
      "        staged = execSync('git diff --cached --numstat', { encoding: 'utf8' }).trim().split('\\n').filter(Boolean).length;",
    );
    lines.push(
      "        modified = execSync('git diff --numstat', { encoding: 'utf8' }).trim().split('\\n').filter(Boolean).length;",
    );
    lines.push("    } catch {}");
    lines.push("");
  }

  if (hasContextBar && contextBarSeg) {
    const width = contextBarSeg.barWidth ?? 10;
    let filledChar = "\u2588";
    let emptyChar = "\u2591";
    if (contextBarSeg.barStyle === "hashes") {
      filledChar = "#";
      emptyChar = "-";
    } else if (contextBarSeg.barStyle === "dots") {
      filledChar = "\u25CF";
      emptyChar = "\u25CB";
    }
    lines.push("    // Context bar");
    if (contextBarSeg.thresholdColors) {
      lines.push(
        `    const barColor = pct >= 90 ? '\\x1b[31m' : pct >= 70 ? '\\x1b[33m' : '\\x1b[32m';`,
      );
    } else {
      const code =
        ANSI_COLORS[contextBarSeg.color as keyof typeof ANSI_COLORS]?.code ?? "0";
      lines.push(`    const barColor = '\\x1b[${code}m';`);
    }
    lines.push(`    const filled = Math.floor(pct * ${width} / 100);`);
    lines.push(
      `    const bar = '${filledChar}'.repeat(filled) + '${emptyChar}'.repeat(${width} - filled);`,
    );
    lines.push("");
  }

  // Generate console.log for each line
  lines.push("    // Output");
  for (const line of config.lines) {
    const expr = nodeLineExpr(line);
    lines.push(`    console.log(${expr});`);
  }

  lines.push("});");
  return lines.join("\n");
}

function nodeSegmentExpr(seg: Segment): string {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
  const colorName = seg.color !== "default" ? seg.color.toUpperCase() : null;
  const wrap = (inner: string) => {
    if (!colorName && !seg.bold) return inner;
    const boldPrefix = seg.bold ? "\\x1b[1m" : "";
    if (colorName)
      return `${boldPrefix}\${${colorName}}${inner}\${RESET}`;
    return `${boldPrefix}${inner}\${RESET}`;
  };

  switch (seg.type) {
    case "model":
      return wrap(`${esc(seg.prefix)}\${model}${esc(seg.suffix)}`);
    case "directory":
      return wrap(`${esc(seg.prefix)}\${dir}${esc(seg.suffix)}`);
    case "session_name":
      return wrap(
        `${esc(seg.prefix)}\${sessionName}${esc(seg.suffix)}`,
      );
    case "version":
      return wrap(
        `${esc(seg.prefix)}\${version}${esc(seg.suffix)}`,
      );
    case "vim_mode":
      return wrap(
        `${esc(seg.prefix)}\${vimMode}${esc(seg.suffix)}`,
      );
    case "agent":
      return wrap(
        `${esc(seg.prefix)}\${agentName}${esc(seg.suffix)}`,
      );
    case "context_bar":
      return `\${barColor}\${bar}\${RESET}`;
    case "context_pct":
      return wrap(`${esc(seg.prefix)}\${pct}${esc(seg.suffix)}`);
    case "tokens":
      return wrap(
        `${esc(seg.prefix)}\${Math.floor(inputTokens/1000)}k in / \${Math.floor(outputTokens/1000)}k out${esc(seg.suffix)}`,
      );
    case "cost":
      return wrap(
        `${esc(seg.prefix)}\${cost.toFixed(2)}${esc(seg.suffix)}`,
      );
    case "duration":
      return wrap(
        `${esc(seg.prefix)}\${mins}m \${secs}s${esc(seg.suffix)}`,
      );
    case "lines_changed":
      return wrap(
        `${esc(seg.prefix)}+\${linesAdded} -\${linesRemoved}${esc(seg.suffix)}`,
      );
    case "rate_limit_5h":
      return wrap(
        `${esc(seg.prefix)}\${Math.round(rate5h)}${esc(seg.suffix)}`,
      );
    case "rate_limit_7d":
      return wrap(
        `${esc(seg.prefix)}\${Math.round(rate7d)}${esc(seg.suffix)}`,
      );
    case "worktree":
      return wrap(
        `${esc(seg.prefix)}\${worktree}${esc(seg.suffix)}`,
      );
    case "separator":
      return wrap(" | ");
    case "text":
      return wrap(
        `${esc(seg.prefix)}${esc(seg.customText ?? "")}${esc(seg.suffix)}`,
      );
    default:
      return "";
  }
}

function nodeLineExpr(line: StatuslineLine): string {
  const parts = line.segments.map((s) => nodeSegmentExpr(s));
  return "`" + parts.join("") + "`";
}

// ─── Settings JSON Generator ────────────────────────────────────────────────

export function generateSettings(
  config: StatuslineConfig,
  scriptPath: string,
): string {
  const settings: Record<string, unknown> = {
    statusLine: {
      type: "command",
      command: scriptPath,
      ...(config.padding > 0 ? { padding: config.padding } : {}),
      ...(config.refreshInterval ? { refreshInterval: config.refreshInterval } : {}),
    },
  };
  return JSON.stringify(settings, null, 2);
}

// ─── Test Command Generator ─────────────────────────────────────────────────

export function generateTestCommand(scriptPath: string): string {
  return `echo '${JSON.stringify(
    {
      model: { display_name: "Opus 4.6" },
      workspace: { current_dir: "/home/user/project" },
      context_window: { used_percentage: 42, total_input_tokens: 85000, total_output_tokens: 12000 },
      cost: {
        total_cost_usd: 1.23,
        total_duration_ms: 345000,
        total_lines_added: 156,
        total_lines_removed: 23,
      },
      session_id: "test-session",
      version: "2.1.90",
      rate_limits: {
        five_hour: { used_percentage: 23.5 },
        seven_day: { used_percentage: 41.2 },
      },
    },
  )}' | ${scriptPath}`;
}

// ─── Install Prompt Generator ───────────────────────────────────────────────

const EXT_MAP: Record<string, string> = { bash: ".sh", python: ".py", node: ".js" };
const LANG_MAP: Record<string, string> = { bash: "bash", python: "python", node: "javascript" };

export function generateInstallPrompt(config: StatuslineConfig): string {
  const ext = EXT_MAP[config.language];
  const langLabel = LANG_MAP[config.language];
  const scriptPath = `~/.claude/statusline${ext}`;

  const script =
    config.language === "bash"
      ? generateBash(config)
      : config.language === "python"
        ? generatePython(config)
        : generateNode(config);

  const settingsJson = generateSettings(config, scriptPath);

  return `Install this custom statusline for Claude Code:

1. Save this script to ${scriptPath}:

\`\`\`${langLabel}
${script}
\`\`\`

2. Make it executable: \`chmod +x ${scriptPath}\`

3. Read my ~/.claude/settings.json (create it if it doesn't exist), and merge in this config. Only add or update the "statusLine" key — do not remove or modify any other settings:

\`\`\`json
${settingsJson}
\`\`\``;
}
