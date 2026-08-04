import Image from "next/image";

/**
 * Persistent brand backdrop. Fixed to the viewport (not the page) so it
 * stays in place while scrolling and is visible behind every route without
 * being added per-page. Kept deliberately faint — this is a watermark, the
 * same way a seal or a woven motif sits quietly behind a garment's lining,
 * not a hero image competing with product and copy.
 *
 * pointer-events-none + aria-hidden: purely decorative, never intercepts
 * clicks or gets announced to screen readers.
 */
export function BlossomBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-30 overflow-hidden pointer-events-none select-none"
    >
      <div className="absolute top-0 -right-4 md:-right-6 w-[220px] h-[464px] md:w-[340px] md:h-[717px] opacity-[0.16]">
        <Image
          src="/branding/blossom-branch.png"
          alt=""
          fill
          sizes="(max-width: 768px) 220px, 340px"
          className="object-contain object-top"
          priority
        />
      </div>
    </div>
  );
}
