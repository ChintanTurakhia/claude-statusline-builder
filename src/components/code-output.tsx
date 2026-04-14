"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type StatuslineConfig } from "@/lib/statusline";
import {
  generateBash,
  generatePython,
  generateNode,
  generateSettings,
  generateTestCommand,
  generateInstallPrompt,
} from "@/lib/generators";

interface CodeOutputProps {
  config: StatuslineConfig;
  onLanguageChange: (lang: "bash" | "python" | "node") => void;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
    >
      {copied ? (
        <>
          <CheckIcon /> Copied!
        </>
      ) : (
        <>
          <CopyIcon /> {label ?? "Copy"}
        </>
      )}
    </Button>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function CopyInstallButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [text]);

  return (
    <Button
      variant="default"
      onClick={handleCopy}
      className="w-full h-11 text-sm font-semibold cursor-pointer"
    >
      {copied ? (
        <>
          <CheckIcon /> Copied! Now paste into Claude Code
        </>
      ) : (
        <>
          <TerminalIcon /> Copy Install Prompt
        </>
      )}
    </Button>
  );
}

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

const SHEBANG_RE = new RegExp("^(#![/].*)$", "gm");
const COMMENT_RE = /^(#.*)$/gm;
const JS_COMMENT_RE = new RegExp("^(\\s*[/][/].*)$", "gm");

function highlightBash(code: string): string {
  return code
    .replace(SHEBANG_RE, '<span class="text-[#c084fc]">$1</span>')
    .replace(COMMENT_RE, '<span class="text-[#52525b]">$1</span>')
    .replace(
      /\b(if|then|elif|else|fi|for|do|done|while|echo|printf|jq|git|wc|tr|cut|cat)\b/g,
      '<span class="text-[#60a5fa]">$1</span>',
    )
    .replace(
      /(\$\{[^}]+\}|\$\([^)]+\)|\$\w+)/g,
      '<span class="text-[#4ade80]">$1</span>',
    )
    .replace(
      /'([^']*)'/g,
      "<span class=\"text-[#fbbf24]\">&#39;$1&#39;</span>",
    );
}

function highlightPython(code: string): string {
  return code
    .replace(SHEBANG_RE, '<span class="text-[#c084fc]">$1</span>')
    .replace(COMMENT_RE, '<span class="text-[#52525b]">$1</span>')
    .replace(
      /\b(import|from|def|if|elif|else|try|except|pass|print|int|len|os|sys|json|subprocess)\b/g,
      '<span class="text-[#60a5fa]">$1</span>',
    )
    .replace(
      /('[^']*'|f'[^']*')/g,
      '<span class="text-[#fbbf24]">$1</span>',
    );
}

function highlightJS(code: string): string {
  return code
    .replace(SHEBANG_RE, '<span class="text-[#c084fc]">$1</span>')
    .replace(JS_COMMENT_RE, '<span class="text-[#52525b]">$1</span>')
    .replace(
      /\b(const|let|var|function|if|else|try|catch|require|process|console|Math|JSON)\b/g,
      '<span class="text-[#60a5fa]">$1</span>',
    )
    .replace(/(`[^`]*`)/g, '<span class="text-[#fbbf24]">$1</span>')
    .replace(/('[^']*')/g, '<span class="text-[#4ade80]">$1</span>');
}

const EXTENSIONS: Record<string, string> = { bash: ".sh", python: ".py", node: ".js" };
const LANG_LABELS: Record<string, string> = { bash: "Bash", python: "Python", node: "Node.js" };

export function CodeOutput({ config, onLanguageChange }: CodeOutputProps) {
  const script =
    config.language === "bash"
      ? generateBash(config)
      : config.language === "python"
        ? generatePython(config)
        : generateNode(config);

  const ext = EXTENSIONS[config.language];
  const scriptPath = `~/.claude/statusline${ext}`;
  const settingsJson = generateSettings(config, scriptPath);
  const testCmd = generateTestCommand(scriptPath);
  const installPrompt = generateInstallPrompt(config);

  const highlighted =
    config.language === "bash"
      ? highlightBash(script)
      : config.language === "python"
        ? highlightPython(script)
        : highlightJS(script);

  return (
    <div className="space-y-4">
      {/* Quick Install */}
      <Card className="border-primary/30 overflow-hidden bg-primary/[0.03]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Quick Install
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Copy and paste into Claude Code — it handles the rest
          </p>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <CopyInstallButton text={installPrompt} />
          <details className="group">
            <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
              Preview prompt
            </summary>
            <pre className="mt-2 text-[11px] leading-4 text-[#e4e4e7] p-3 bg-[#09090b] rounded-xl border border-[#27272a] font-mono overflow-x-auto max-h-[200px] overflow-y-auto whitespace-pre-wrap">
              {installPrompt}
            </pre>
          </details>
        </CardContent>
      </Card>

      {/* Script output */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              Generated Script
            </CardTitle>
            <CopyButton text={script} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs
            value={config.language}
            onValueChange={(v) => onLanguageChange(v as "bash" | "python" | "node")}
          >
            <TabsList className="h-8 bg-secondary">
              {(["bash", "python", "node"] as const).map((lang) => (
                <TabsTrigger key={lang} value={lang} className="text-xs px-3 h-6 cursor-pointer">
                  {LANG_LABELS[lang]}
                </TabsTrigger>
              ))}
            </TabsList>
            {(["bash", "python", "node"] as const).map((lang) => (
              <TabsContent key={lang} value={lang} className="mt-3">
                {/* Code block always dark */}
                <pre className="text-xs leading-5 text-[#e4e4e7] overflow-x-auto p-4 bg-[#09090b] rounded-xl border border-[#27272a] max-h-[400px] overflow-y-auto font-mono">
                  <code dangerouslySetInnerHTML={{ __html: highlighted }} />
                </pre>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Settings JSON */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              settings.json
            </CardTitle>
            <CopyButton text={settingsJson} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-2">
            Add this to <code className="text-primary font-mono font-medium">~/.claude/settings.json</code>
          </p>
          <pre className="text-xs leading-5 text-[#e4e4e7] p-4 bg-[#09090b] rounded-xl border border-[#27272a] font-mono overflow-x-auto">
            {settingsJson}
          </pre>
        </CardContent>
      </Card>

      {/* Manual Installation */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Manual Installation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="space-y-2.5">
            {[
              <>Save script to <code className="text-primary font-mono font-medium">{scriptPath}</code></>,
              <>Make it executable: <code className="text-primary font-mono font-medium">chmod +x {scriptPath}</code></>,
              <>Add the settings JSON to <code className="text-primary font-mono font-medium">~/.claude/settings.json</code></>,
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 border border-primary/20">
                  {i + 1}
                </span>
                <span className="text-xs text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground">Test with mock data:</p>
              <CopyButton text={testCmd} label="Copy" />
            </div>
            <pre className="text-[10px] leading-4 text-[#e4e4e7] p-3 bg-[#09090b] rounded-xl border border-[#27272a] font-mono overflow-x-auto">
              {testCmd}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
