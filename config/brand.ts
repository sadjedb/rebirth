/**
 * Brand configuration — single source of truth.
 *
 * "MONO" is a placeholder brand name. Swap it here and the name propagates
 * through metadata, nav, footer, and copy. No other file should hardcode
 * the brand name.
 */
export const brand = {
  name: "MONO",
  fullName: "MONO STUDIOS",
  tagline: "Cut from stillness.",
  description:
    "Luxury streetwear built on restraint. Minimal silhouettes, considered materials, made in small runs.",
  domain: "mono-studios.com",
  currency: "USD",
  currencySymbol: "$",
  social: {
    instagram: "https://instagram.com",
  },
  contact: {
    email: "atelier@mono-studios.com",
  },
} as const;
