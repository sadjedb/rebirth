type SealProps = {
  className?: string;
  size?: number;
};

/**
 * The brand's signature mark — a lacquer-red seal in the spirit of a hanko
 * stamp, imprinted rather than illustrated. Appears once per view: on the
 * hero, on product hover, and small in the footer. It should never
 * multiply within a single section — its rarity is what makes it read as
 * a mark of authenticity rather than decoration.
 */
export function Seal({ className = "", size = 56 }: SealProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        r="47"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M50 28 L50 72 M34 40 L66 40 M34 60 L66 60 M38 28 L38 72 M62 28 L62 72"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
      />
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" opacity="0.5" />
    </svg>
  );
}
