import { CartProvider } from "@/lib/cart-context";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { BlossomBackdrop } from "@/components/ui/BlossomBackdrop";

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <BlossomBackdrop />
      <CartProvider>
        {children}
        <CartDrawer />
      </CartProvider>
    </>
  );
}
