/** Shared between agent and consultant-signatory onboarding — both pick from
 * the same backend-defined ID type set (IdTypeEnum / AuthorizedSignatoryIdTypeEnum
 * are two names for the same value set). One source of truth so the two
 * forms can't silently drift if a type is added or a label changes. */
export const ID_TYPES = ['NIN', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_CARD'] as const;

export const ID_TYPE_LABEL: Record<string, string> = {
  NIN: 'NIN',
  PASSPORT: 'International Passport',
  DRIVERS_LICENSE: "Driver's License",
  VOTERS_CARD: "Voter's Card",
};
