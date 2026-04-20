export interface PaymentDetails {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  billingPostalCode: string;
}

export type PaymentField = keyof PaymentDetails;
export type PaymentErrors = Partial<Record<PaymentField, string>>;

export const emptyPaymentDetails: PaymentDetails = {
  cardholderName: "",
  cardNumber: "",
  expiryDate: "",
  cvv: "",
  billingPostalCode: "",
};

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCardNumber(value: string) {
  const digits = digitsOnly(value).slice(0, 16);
  return digits.match(/.{1,4}/g)?.join(" ") || "";
}

export function formatExpiryDate(value: string) {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatCvv(value: string) {
  return digitsOnly(value).slice(0, 3);
}

export function formatBillingPostalCode(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9 -]/g, "")
    .slice(0, 10);
}

export function passesLuhnCheck(cardNumber: string) {
  const digits = digitsOnly(cardNumber);
  if (digits.length !== 16) return false;

  let sum = 0;
  let doubleDigit = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);

    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}

function validateCardholderName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "Name on card is required.";
  if (trimmed.length < 2) return "Enter the name as it appears on the card.";
  if (/\d/.test(trimmed)) return "Name on card cannot include numbers.";
  if (!/^[A-Za-z .'-]+$/.test(trimmed)) {
    return "Name on card can only include letters, spaces, apostrophes, hyphens, and periods.";
  }
  return "";
}

function validateCardNumber(cardNumber: string) {
  const digits = digitsOnly(cardNumber);
  if (!digits) return "Card number is required.";
  if (digits.length !== 16) return "Card number must be 16 digits.";
  if (!passesLuhnCheck(digits)) return "Enter a valid card number.";
  return "";
}

function validateExpiryDate(expiryDate: string, now: Date) {
  const digits = digitsOnly(expiryDate);
  if (!digits) return "Expiry date is required.";
  if (digits.length !== 4) return "Use MM/YY format.";

  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2));

  if (month < 1 || month > 12) return "Expiry month must be between 01 and 12.";

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return "Card expiry date cannot be in the past.";
  }

  return "";
}

function validateCvv(cvv: string) {
  const digits = digitsOnly(cvv);
  if (!digits) return "CVV is required.";
  return digits.length === 3 ? "" : "CVV must be 3 digits.";
}

function validateBillingPostalCode(postalCode: string) {
  const trimmed = postalCode.trim();
  if (!trimmed) return "Billing postal code is required.";
  if (trimmed.length < 3 || trimmed.length > 10) {
    return "Billing postal code must be 3 to 10 characters.";
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]*[A-Za-z0-9]$/.test(trimmed)) {
    return "Billing postal code can only include letters, numbers, spaces, or hyphens.";
  }
  return "";
}

export function validatePaymentDetails(details: PaymentDetails, now = new Date()): PaymentErrors {
  const errors: PaymentErrors = {};

  const nameError = validateCardholderName(details.cardholderName);
  if (nameError) errors.cardholderName = nameError;

  const cardNumberError = validateCardNumber(details.cardNumber);
  if (cardNumberError) errors.cardNumber = cardNumberError;

  const expiryDateError = validateExpiryDate(details.expiryDate, now);
  if (expiryDateError) errors.expiryDate = expiryDateError;

  const cvvError = validateCvv(details.cvv);
  if (cvvError) errors.cvv = cvvError;

  const postalCodeError = validateBillingPostalCode(details.billingPostalCode);
  if (postalCodeError) errors.billingPostalCode = postalCodeError;

  return errors;
}

export function hasPaymentErrors(errors: PaymentErrors) {
  return Object.keys(errors).length > 0;
}
