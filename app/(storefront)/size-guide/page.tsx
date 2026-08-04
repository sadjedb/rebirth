import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Size guide — ${brand.name}`,
  description: "Measurements for every MONO category, in centimeters and inches.",
};

const topsChart = [
  { size: "XS", chest: "94–98", length: "66", shoulder: "44" },
  { size: "S", chest: "99–103", length: "68", shoulder: "46" },
  { size: "M", chest: "104–108", length: "70", shoulder: "48" },
  { size: "L", chest: "109–114", length: "72", shoulder: "50" },
  { size: "XL", chest: "115–120", length: "74", shoulder: "52" },
];

const bottomsChart = [
  { size: "28", waist: "71–74", hip: "88–91", inseam: "78" },
  { size: "30", waist: "76–79", hip: "93–96", inseam: "79" },
  { size: "32", waist: "81–84", hip: "98–101", inseam: "80" },
  { size: "34", waist: "86–89", hip: "103–106", inseam: "81" },
  { size: "36", waist: "91–94", hip: "108–111", inseam: "82" },
];

function ChartTable({
  columns,
  rows,
}: {
  columns: { key: string; label: string }[];
  rows: Record<string, string>[];
}) {
  return (
    <div className="overflow-x-auto border border-stone/20">
      <table className="w-full text-sm min-w-[420px]">
        <thead>
          <tr className="border-b border-stone/20">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left font-mono text-[11px] uppercase tracking-[0.12em] text-stone px-4 py-3 font-medium"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.size} className={i !== rows.length - 1 ? "border-b border-stone/10" : ""}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 ${col.key === "size" ? "text-sumi font-medium" : "text-stone font-mono"}`}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SizeGuidePage() {
  return (
    <PageShell
      eyebrow="Reference"
      title="Size guide"
      intro="All measurements in centimeters, taken flat, garment measurement — not body measurement. If you fall between sizes, size up for a boxier fit or down for a closer one."
      maxWidth="max-w-4xl"
    >
      <section className="mb-16">
        <h2 className="font-display italic text-2xl text-sumi mb-6">
          Tops &amp; outerwear
        </h2>
        <ChartTable
          columns={[
            { key: "size", label: "Size" },
            { key: "chest", label: "Chest (cm)" },
            { key: "length", label: "Length (cm)" },
            { key: "shoulder", label: "Shoulder (cm)" },
          ]}
          rows={topsChart}
        />
      </section>

      <section className="mb-16">
        <h2 className="font-display italic text-2xl text-sumi mb-6">Bottoms</h2>
        <ChartTable
          columns={[
            { key: "size", label: "Size" },
            { key: "waist", label: "Waist (cm)" },
            { key: "hip", label: "Hip (cm)" },
            { key: "inseam", label: "Inseam (cm)" },
          ]}
          rows={bottomsChart}
        />
      </section>

      <section>
        <h2 className="font-display italic text-2xl text-sumi mb-6">How to measure</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 text-sm text-stone leading-relaxed">
          <div>
            <p className="text-sumi mb-1">Chest</p>
            <p>Lay the garment flat and measure straight across, one inch below the armhole, then double it.</p>
          </div>
          <div>
            <p className="text-sumi mb-1">Length</p>
            <p>From the highest point of the shoulder seam straight down to the hem.</p>
          </div>
          <div>
            <p className="text-sumi mb-1">Waist</p>
            <p>Measure straight across the waistband, just below the fly, then double it.</p>
          </div>
          <div>
            <p className="text-sumi mb-1">Inseam</p>
            <p>From the crotch seam straight down to the bottom of the leg opening.</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
