import { FormCard } from "@/components/admin/ui/FormCard";
import type { AdminOrderAddress } from "@/lib/orders/admin";

/** The one place address lines are formatted for display — used for both
 *  shipping and billing so the two can never drift apart. */
function AddressBlock({ address }: { address: AdminOrderAddress }) {
  return (
    <div className="text-sm text-admin-fg leading-relaxed">
      <p>
        {address.firstName} {address.lastName}
      </p>
      {address.company && <p>{address.company}</p>}
      <p>{address.addressLine1}</p>
      {address.addressLine2 && <p>{address.addressLine2}</p>}
      <p>
        {address.city}, {address.region} {address.postalCode}
      </p>
      <p>{address.country}</p>
      {address.phone && <p className="text-admin-muted mt-1">{address.phone}</p>}
    </div>
  );
}

export function AddressCard({
  shippingAddress,
  billingAddress,
}: {
  shippingAddress: AdminOrderAddress | null;
  billingAddress: AdminOrderAddress | null;
}) {
  return (
    <FormCard title="Addresses">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-admin-muted mb-2">Shipping</p>
          {shippingAddress ? (
            <AddressBlock address={shippingAddress} />
          ) : (
            <p className="text-sm text-admin-muted">No shipping address on file.</p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-admin-muted mb-2">Billing</p>
          {billingAddress ? (
            <AddressBlock address={billingAddress} />
          ) : (
            <p className="text-sm text-admin-muted">Same as shipping</p>
          )}
        </div>
      </div>
    </FormCard>
  );
}
