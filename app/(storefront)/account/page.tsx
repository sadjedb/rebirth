import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { getSession } from "@/lib/session";
import { getOrdersByUserId, formatOrderNumber, customerStatusLabel } from "@/lib/orders/storefront";
import { formatMoney } from "@/lib/money";
import { logout } from "@/app/(storefront)/account/actions";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Account — ${brand.name}`,
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/account");

  const orders = await getOrdersByUserId(user.id);

  return (
    <>
      <Nav />
      <main className="pt-32 md:pt-40 pb-24 md:pb-32 bg-washi min-h-screen">
        <div className="mx-auto max-w-4xl px-6 md:px-10">
          <div className="flex items-start justify-between mb-14 md:mb-16">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-stone mb-3">
                — Account
              </p>
              <h1 className="font-display italic text-4xl md:text-6xl text-sumi">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-stone mt-3">{user.email}</p>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="text-[13px] uppercase tracking-[0.14em] text-stone border border-stone/30 px-5 py-2.5 hover:border-sumi hover:text-sumi transition-colors"
              >
                Log out
              </button>
            </form>
          </div>

          <section>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone mb-6 border-b border-stone/20 pb-4">
              Order history
            </p>

            {orders.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-display italic text-xl text-sumi mb-2">
                  No orders yet.
                </p>
                <p className="text-sm text-stone mb-6">
                  Orders placed while logged in will show up here.
                </p>
                <Link
                  href="/collection"
                  className="inline-block text-[13px] uppercase tracking-[0.14em] border border-sumi text-sumi px-6 py-3 hover:bg-sumi hover:text-washi transition-colors"
                >
                  Browse collection
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-stone/15">
                {orders.map((order) => {
                  const totalQuantity = order.items.reduce((sum, i) => sum + i.quantity, 0);
                  return (
                    <Link
                      key={order.id}
                      href={`/order-confirmation/${order.id}`}
                      className="flex items-center justify-between py-5 group"
                    >
                      <div>
                        <p className="text-sm text-sumi group-hover:underline">
                          {formatOrderNumber(order.orderNumber)}
                        </p>
                        <p className="text-xs text-stone mt-1">
                          {new Date(order.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                          · {totalQuantity} item{totalQuantity === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm text-sumi">
                          {formatMoney(order.total, order.currency)}
                        </p>
                        <p className="text-xs text-stone mt-1">{customerStatusLabel(order.status)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
