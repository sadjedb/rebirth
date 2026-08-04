"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormCard } from "@/components/admin/ui/FormCard";
import { useToast } from "@/components/admin/ui/Toast";
import { formatMoney } from "@/lib/money";
import { formatOrderNumber, formatOrderTimestamp, EMAIL_NOT_CONFIGURED_ERROR } from "@/lib/orders/format";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_META } from "@/lib/orders/status";
import { resendOrderConfirmation, resendOrderStatusEmail } from "@/app/admin/orders/[id]/actions";
import type { AdminOrderDetail } from "@/lib/orders/admin";

const BUTTON_CLASSNAME =
  "w-full text-left px-3 py-2 text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg hover:border-admin-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-admin-border";

function buildCustomerInfoText(order: AdminOrderDetail): string {
  const lines = [
    `${order.firstName} ${order.lastName}`,
    order.email,
    order.phone,
  ];
  if (order.shippingAddress) {
    const a = order.shippingAddress;
    lines.push(
      "",
      a.addressLine1,
      ...(a.addressLine2 ? [a.addressLine2] : []),
      `${a.city}, ${a.region} ${a.postalCode}`,
      a.country
    );
  }
  return lines.join("\n");
}

function buildPaymentInfoText(order: AdminOrderDetail): string {
  return [
    `Order ${formatOrderNumber(order.orderNumber)}`,
    `Method: ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`,
    `Status: ${PAYMENT_STATUS_META[order.paymentStatus].label}`,
    `Total: ${formatMoney(order.total, order.currency)}`,
    ...(order.paidAt ? [`Paid: ${formatOrderTimestamp(order.paidAt)}`] : []),
  ].join("\n");
}

export function CustomerServiceCard({
  order,
  canEdit,
}: {
  order: AdminOrderDetail;
  canEdit: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function runResend(label: string, mutate: () => ReturnType<typeof resendOrderConfirmation>) {
    startTransition(async () => {
      const result = await mutate();
      if (result.success) {
        toast({ variant: "success", title: label });
        router.refresh();
      } else if (result.error === EMAIL_NOT_CONFIGURED_ERROR) {
        toast({ variant: "info", title: "Email isn't set up yet", description: result.error });
      } else {
        toast({ variant: "error", title: `Couldn't ${label.toLowerCase()}`, description: result.error });
      }
    });
  }

  function copy(label: string, text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => toast({ variant: "success", title: `${label} copied` }))
      .catch(() => toast({ variant: "error", title: `Couldn't copy ${label.toLowerCase()}` }));
  }

  return (
    <FormCard title="Customer service">
      <div className="space-y-2">
        {canEdit && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => runResend("Confirmation resent", () => resendOrderConfirmation(order.id))}
              className={BUTTON_CLASSNAME}
            >
              Resend order confirmation
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => runResend("Status email resent", () => resendOrderStatusEmail(order.id))}
              className={BUTTON_CLASSNAME}
            >
              Resend status email
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => copy("Customer information", buildCustomerInfoText(order))}
          className={BUTTON_CLASSNAME}
        >
          Copy customer information
        </button>
        <button
          type="button"
          onClick={() => copy("Payment information", buildPaymentInfoText(order))}
          className={BUTTON_CLASSNAME}
        >
          Copy payment information
        </button>

        <a
          href={`/order-confirmation/${order.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${BUTTON_CLASSNAME} block`}
        >
          View receipt ↗
        </a>
      </div>
    </FormCard>
  );
}
