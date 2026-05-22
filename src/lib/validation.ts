export function validatePhone(phone: string): { valid: boolean; normalized: string; error?: string } {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return { valid: false, normalized: phone, error: "Enter a valid 10-digit mobile number" };
  const normalized =
    digits.startsWith("91") && digits.length === 12 ? `+${digits}` : `+91${digits.slice(-10)}`;
  return { valid: true, normalized };
}

export function validateName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: "Please enter your name" };
  if (trimmed.length < 2) return { valid: false, error: "Name is too short" };
  return { valid: true };
}
