
export interface HighlightRule {
    word: string;
    color: 'red' | 'yellow' | 'green';
    glow?: boolean;
}

export const GLOBAL_HIGHLIGHTS: HighlightRule[] = [
  { word: "urgent", color: "red", glow: true },
  { word: "error", color: "red" },
  { word: "critical", color: "red", glow: true },
  { word: "failed", color: "red" },
  { word: "priority", color: "yellow" },
  { word: "warning", color: "yellow" },
  { word: "caution", color: "yellow" },
  { word: "success", color: "green" },
  { word: "complete", color: "green" },
  { word: "achieved", color: "green" },
  { word: "saved", color: "green" },
];
