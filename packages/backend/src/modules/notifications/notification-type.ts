// Canonical notification types per UBIQUITOUS_LANGUAGE.md (post-router model).
export type CanonicalNotificationType =
  | 'crisis_red'
  | 'concern_yellow'
  | 'info'
  | 'chat';

const LEGACY_MAP: Record<string, CanonicalNotificationType> = {
  crisis: 'crisis_red',
  sos_alert: 'crisis_red',
  concern_detected: 'concern_yellow',
  appointment: 'info',
  direct_message: 'chat',
  achievement: 'info',
};

const CANONICAL: ReadonlySet<CanonicalNotificationType> = new Set([
  'crisis_red',
  'concern_yellow',
  'info',
  'chat',
]);

// Tolerant read: maps any historical or canonical value of notifications.type
// to the four canonical buckets. New writes always use canonical values directly.
// Unknown values default to 'info' to avoid breaking the UI on legacy rows.
export function normalizeNotificationType(raw: string): CanonicalNotificationType {
  if (CANONICAL.has(raw as CanonicalNotificationType)) {
    return raw as CanonicalNotificationType;
  }
  return LEGACY_MAP[raw] ?? 'info';
}
