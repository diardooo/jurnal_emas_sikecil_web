/**
 * Trash retention window (JES-114). Soft-deleted rows stay recoverable for this
 * many days, then the purge-deleted cron hard-deletes them. One source of truth
 * shared by the cron, the Trash UI countdown, and tests.
 */
export const SOFT_DELETE_RETENTION_DAYS = 30;

/** The cutoff instant: rows soft-deleted at/before this are due for purge. */
export function purgeCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - SOFT_DELETE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}
