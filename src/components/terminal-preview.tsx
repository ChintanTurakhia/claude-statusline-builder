"use client";

import { type StatuslineLine, renderSegmentPreview } from "@/lib/statusline";

interface TerminalPreviewProps {
  lines: StatuslineLine[];
}

export function TerminalPreview({ lines }: TerminalPreviewProps) {
  return (
    <div className="terminal-glow rounded-2xl overflow-hidden border border-border">
      {/* Title bar */}
      <div className="bg-[#18181b] px-4 py-2.5 flex items-center gap-2 border-b border-white/[0.06]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]/80" />
          <div className="w-3 h-3 rounded-full bg-[#eab308]/80" />
          <div className="w-3 h-3 rounded-full bg-[#22c55e]/80" />
        </div>
        <div className="flex-1 text-center text-[11px] text-[#71717a] font-mono">
          ~/my-project &mdash; claude
        </div>
        <div className="w-14" />
      </div>

      {/* Terminal body - always dark */}
      <div className="bg-[#09090b] font-mono text-sm relative">
        <div className="px-5 py-4 space-y-2 min-h-[120px]">
          <div className="text-[#71717a] text-xs">
            <span className="text-[#a1a1aa]">$</span> claude
          </div>
          <div className="mt-4">
            <div className="text-[#e4e4e7] text-xs flex items-start gap-2">
              <span className="text-[#a1a1aa] shrink-0">&gt;</span>
              <span>What would you like to work on?</span>
            </div>
          </div>
          <div className="text-[#e4e4e7] text-xs pl-5">
            <span className="inline-block w-2 h-4 bg-[#e4e4e7] animate-pulse" />
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-white/[0.06]" />

        {/* Statusline */}
        <div className="px-5 py-2.5 space-y-1 min-h-[32px]">
          {lines.length === 0 ? (
            <div className="text-[#52525b] text-sm italic font-sans">
              Add segments to see your statusline preview
            </div>
          ) : (
            lines.map((line) => (
              <div key={line.id} className="flex items-center flex-wrap text-[13px] leading-6">
                {line.segments.map((segment) => {
                  const rendered = renderSegmentPreview(segment);
                  return (
                    <span
                      key={segment.id}
                      style={{
                        color: rendered.color,
                        fontWeight: rendered.bold ? 700 : 400,
                      }}
                    >
                      {rendered.text}
                    </span>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
