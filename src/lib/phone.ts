const E164_REGEX = /^\+[1-9]\d{9,14}$/;

export const isValidE164 = (phone: string): boolean => E164_REGEX.test(phone);

export const normalizePhone = (
  input: string,
  defaultCountry: "MY" = "MY"
): string => {
  const cleaned = input.trim().replace(/[()\s-]/g, "");
  if (!cleaned) {
    return cleaned;
  }

  if (cleaned.startsWith("+600")) {
    return `+60${cleaned.slice(4)}`;
  }

  if (cleaned.startsWith("+60") && cleaned[3] === "0") {
    return `+60${cleaned.slice(4)}`;
  }

  if (defaultCountry === "MY") {
    if (cleaned.startsWith("0")) {
      return `+60${cleaned.slice(1)}`;
    }
    if (cleaned.startsWith("60")) {
      return `+60${cleaned.slice(2)}`;
    }
    if (/^\d+$/.test(cleaned)) {
      return `+60${cleaned}`;
    }
  }

  return cleaned;
};
