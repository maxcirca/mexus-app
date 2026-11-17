/**
 * Shared definitions for the app and the API.
 *
 * The field list itself will be generated from Notion "Mexus Items" into
 * `schema.json` (ADR-003, Day 9). Until then this package only holds the
 * section codes.
 */

export const SECTIONS = {
  mor: "Check-in",
  mid: "Stand-up",
  eve: "Check-out",
} as const;

export type Section = keyof typeof SECTIONS;

export function isSection(value: string): value is Section {
  return Object.hasOwn(SECTIONS, value);
}
