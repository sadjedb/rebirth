export class ConcurrencyError extends Error {
  constructor(message = "This record was changed by someone else since you loaded it.") {
    super(message);
    this.name = "ConcurrencyError";
  }
}

/**
 * Throws ConcurrencyError if the submitted timestamp doesn't match the
 * current database value — meaning another admin saved this record after
 * the current user loaded the edit form. Callers should run this check
 * before opening a transaction, so a stale-data rejection never gets
 * mixed up with (or masked by) an actual mutation failure.
 *
 *   const current = await prisma.product.findUnique({ where: { id }, select: { updatedAt: true } });
 *   assertNotStale(submittedUpdatedAt, current.updatedAt);
 */
export function assertNotStale(submittedUpdatedAt: string, currentUpdatedAt: Date): void {
  const submitted = new Date(submittedUpdatedAt).getTime();
  const current = currentUpdatedAt.getTime();
  if (Number.isNaN(submitted) || submitted !== current) {
    throw new ConcurrencyError();
  }
}
