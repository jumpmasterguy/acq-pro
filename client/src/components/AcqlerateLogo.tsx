interface AcqllerateLogoProps {
  /** Size of the icon square in pixels */
  iconSize?: number;
  /** Whether to show the wordmark next to the icon */
  showWordmark?: boolean;
  /** Additional className for the wrapper */
  className?: string;
}

/**
 * Official Acqlerate brand logo.
 * Teal rounded-square icon + "Acql" (dark) + "erate" (teal) wordmark.
 */
export function AcqlerateLogo({
  iconSize = 36,
  showWordmark = true,
  className = "",
}: AcqllerateLogoProps) {
  const textSize = Math.round(iconSize * 0.52);
  const gap = Math.round(iconSize * 0.33);

  return (
    <div
      className={`flex items-center ${className}`}
      style={{ gap }}
      aria-label="Acqlerate"
    >
      {/* Icon mark */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <rect width="100" height="100" rx="22" fill="#01696f" />
        <g transform="translate(50,50)">
          {/* Outer hexagon */}
          <polygon
            points="0,-28 24.2,-14 24.2,14 0,28 -24.2,14 -24.2,-14"
            fill="none"
            stroke="white"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Inner rotated hexagon */}
          <polygon
            points="0,-16 13.9,-8 13.9,8 0,16 -13.9,8 -13.9,-8"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinejoin="round"
            transform="rotate(30)"
          />
          {/* Center dot */}
          <circle cx="0" cy="0" r="3.5" fill="white" />
        </g>
      </svg>

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
          <span style={{ color: "white" }}>Acql</span>
          <span style={{ color: "#01696f" }}>erate</span>
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
