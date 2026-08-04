import { FormCard } from "@/components/admin/ui/FormCard";
import { OrderNoteForm } from "@/app/admin/orders/components/OrderNoteForm";
import { formatOrderTimestamp } from "@/lib/orders/format";
import type { OrderTimelineEntry } from "@/lib/orders/timeline";

export function NotesCard({
  orderId,
  entries,
  canEdit,
}: {
  orderId: string;
  /** The full timeline — filtered to isNote here rather than queried
   *  separately, since notes have no storage of their own to query
   *  (see lib/orders/timeline.ts). */
  entries: OrderTimelineEntry[];
  canEdit: boolean;
}) {
  const notes = entries.filter((entry) => entry.isNote);

  return (
    <FormCard title="Notes" description="Internal only — never shown to the customer.">
      <div className="space-y-4">
        {notes.length === 0 ? (
          <p className="text-sm text-admin-muted">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note.id} className="text-sm border-b border-admin-border pb-3 last:border-b-0 last:pb-0">
                <p className="text-admin-fg whitespace-pre-wrap break-words">{note.description}</p>
                <p className="text-xs text-admin-muted mt-1">
                  {note.actorLabel} · {formatOrderTimestamp(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}

        {canEdit && <OrderNoteForm orderId={orderId} />}
      </div>
    </FormCard>
  );
}
