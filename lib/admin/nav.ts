export type NavItem = {
  label: string;
  href: string;
  implemented: boolean;
  children?: NavItem[];
};

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", implemented: true },
  {
    label: "Catalog",
    href: "/admin/products",
    implemented: false,
    children: [
      { label: "Products", href: "/admin/products", implemented: true },
      { label: "Categories", href: "/admin/categories", implemented: false },
      { label: "Collections", href: "/admin/collections", implemented: false },
      { label: "Inventory", href: "/admin/inventory", implemented: false },
      { label: "Brands", href: "/admin/brands", implemented: false },
      { label: "Tags", href: "/admin/tags", implemented: false },
    ],
  },
  {
    label: "Orders",
    href: "/admin/orders",
    implemented: false,
    children: [
      { label: "All Orders", href: "/admin/orders", implemented: true },
      { label: "Returns", href: "/admin/orders/returns", implemented: false },
      { label: "Refunds", href: "/admin/orders/refunds", implemented: false },
    ],
  },
  {
    label: "Customers",
    href: "/admin/customers",
    implemented: false,
    children: [
      { label: "Customers", href: "/admin/customers", implemented: true },
      { label: "Customer Groups", href: "/admin/customers/groups", implemented: false },
    ],
  },
  {
    label: "Marketing",
    href: "/admin/marketing",
    implemented: false,
    children: [
      // Module 5: one unified system, not two — "Discounts" was a stale
      // separate placeholder for the same concept Coupon already covers
      // (see the Module 5 architecture notes). Collapsed into this entry.
      { label: "Coupons", href: "/admin/coupons", implemented: true },
      { label: "Email Campaigns", href: "/admin/marketing/campaigns", implemented: false },
      { label: "Featured Products", href: "/admin/marketing/featured", implemented: false },
    ],
  },
  {
    label: "Content",
    href: "/admin/content",
    implemented: false,
    children: [
      { label: "Homepage", href: "/admin/content/homepage", implemented: false },
      { label: "Hero Sections", href: "/admin/content/hero", implemented: false },
      { label: "Banners", href: "/admin/content/banners", implemented: false },
      { label: "Lookbook", href: "/admin/content/lookbook", implemented: false },
      { label: "Blog", href: "/admin/content/blog", implemented: false },
      { label: "FAQ", href: "/admin/content/faq", implemented: false },
    ],
  },
  { label: "Media Library", href: "/admin/media", implemented: false },
  { label: "Reviews", href: "/admin/reviews", implemented: true },
  { label: "Shipping", href: "/admin/shipping", implemented: false },
  { label: "Taxes", href: "/admin/taxes", implemented: false },
  { label: "Analytics", href: "/admin/analytics", implemented: false },
  { label: "Settings", href: "/admin/settings", implemented: false },
  { label: "Users & Roles", href: "/admin/users", implemented: false },
  { label: "Activity Logs", href: "/admin/activity", implemented: false },
  { label: "System", href: "/admin/system", implemented: false },
];
