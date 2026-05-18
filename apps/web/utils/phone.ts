/**
 * Format a Malaysian phone number for display.
 * Input: +601112345678 or 601112345678 or 01112345678
 * Output: +60 11-1234 5678
 */
export const formatMalaysiaPhone = (value: string | null | undefined): string => {
  if (!value) return "-";

  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("60")
    ? digits.slice(2)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;

  if (!local) return "-";

  // 011-xxxx xxxxx (11 prefix, 8 digits after)
  if (local.startsWith("11") && local.length >= 10) {
    return `+60 ${local.slice(0, 2)}-${local.slice(2, 6)} ${local.slice(6)}`;
  }
  // 01x-xxxx xxxx (other mobile, 7 digits after)
  if (local.startsWith("1") && local.length >= 9) {
    return `+60 ${local.slice(0, 2)}-${local.slice(2, 6)} ${local.slice(6)}`;
  }
  // 03-xxxx xxxx (KL landline)
  if (local.startsWith("3") && local.length >= 9) {
    return `+60 ${local.slice(0, 1)}-${local.slice(1, 5)} ${local.slice(5)}`;
  }
  // Other area codes e.g. 04, 05, 06, 07, 09
  if (local.length >= 9) {
    return `+60 ${local.slice(0, 2)}-${local.slice(2, 5)} ${local.slice(5)}`;
  }

  return `+60 ${local}`;
};
