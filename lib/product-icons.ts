import type { ProductIcon } from "@prisma/client";

export const iconPaths: Record<ProductIcon, string> = {
  jacket:
    "M35 20 L45 15 L50 22 L55 15 L65 20 L65 30 L58 33 L58 80 L42 80 L42 33 L35 30 Z M45 15 L50 30 L55 15",
  trouser: "M38 15 L62 15 L64 80 L54 80 L50 40 L46 80 L36 80 Z",
  tee: "M30 22 L42 15 L50 20 L58 15 L70 22 L64 34 L58 30 L58 80 L42 80 L42 30 L36 34 Z",
};
