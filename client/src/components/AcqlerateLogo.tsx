interface AcqllerateLogoProps {
  /** Size of the icon square in pixels */
  iconSize?: number;
  /** Whether to show the wordmark next to the icon */
  showWordmark?: boolean;
  /** Additional className for the wrapper */
  className?: string;
  /**
   * Wordmark color scheme. 'auto' (default) follows the sidebar theme token
   * (dark navy "Acq" in light mode, light in dark mode) — correct on a
   * surface that itself follows the app's light/dark toggle. 'light' forces
   * a white "Acq" and a lighter teal "lerate", for a surface that's
   * permanently dark regardless of theme (e.g. the sign-in page's branding
   * panel).
   */
  wordmarkTheme?: "auto" | "light";
}

/**
 * Official Acqlerate brand logo.
 * Teal rounded-square icon + "Acq" (dark) + "lerate" (teal) wordmark.
 */
export function AcqlerateLogo({
  iconSize = 36,
  showWordmark = true,
  className = "",
  wordmarkTheme = "auto",
}: AcqllerateLogoProps) {
  const textSize = Math.round(iconSize * 0.52);
  const gap = Math.round(iconSize * 0.33);

  return (
    <div
      className={`flex items-center ${className}`}
      style={{ gap }}
      aria-label="Acqlerate"
    >
      {/* Icon mark — renders the shipped brand asset rather than a hand-drawn
          copy, so the sidebar mark can never drift from the favicon / app icon.
          Decorative: the wrapper already carries aria-label="Acqlerate". */}
      <img
        src="/acqlerate-icon.svg"
        width={iconSize}
        height={iconSize}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ flexShrink: 0, display: "block" }}
      />

      {/* Wordmark */}
      {showWordmark && (
        <span
          style={{
            fontSize: textSize,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          {wordmarkTheme === "light" ? (
            <span style={{ color: "#ffffff" }}>Acq</span>
          ) : (
            <span className="text-sidebar-foreground">Acq</span>
          )}
          {/* "auto" is meant to follow the theme, but "lerate" was pinned to the
              dark brand teal in both — 2.8:1 on any dark surface, so it was
              barely legible in the dark sidebar and the mobile top bar. Dark
              now uses the brand's own light teal (#4fc3cb), the same value the
              design system lists as "teal on dark". */}
          {wordmarkTheme === "light" ? (
            <span style={{ color: "#2dd4bf" }}>lerate</span>
          ) : (
            <span className="text-[#01696f] dark:text-[#4fc3cb]">lerate</span>
          )}
        </span>
      )}
    </div>
  );
}

/** Icon-only version (no wordmark) */
export function AcqllerateIcon({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <AcqlerateLogo iconSize={size} showWordmark={false} className={className} />
  );
}
