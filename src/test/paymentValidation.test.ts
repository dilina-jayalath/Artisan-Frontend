import { describe, expect, it } from "vitest";
import {
  formatBillingPostalCode,
  formatCardNumber,
  formatCvv,
  formatExpiryDate,
  passesLuhnCheck,
  type PaymentDetails,
  validatePaymentDetails,
} from "@/lib/paymentValidation";

const now = new Date("2026-04-21T12:00:00Z");

const validPayment: PaymentDetails = {
  cardholderName: "Sahan Perera",
  cardNumber: "4242 4242 4242 4242",
  expiryDate: "12/30",
  cvv: "123",
  billingPostalCode: "10100",
};

describe("payment validation", () => {
  it("formats payment fields while removing invalid characters", () => {
    expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(formatExpiryDate("1230")).toBe("12/30");
    expect(formatCvv("12a34")).toBe("123");
    expect(formatBillingPostalCode("ab@12-345678")).toBe("AB12-34567");
  });

  it("accepts valid card details", () => {
    expect(validatePaymentDetails(validPayment, now)).toEqual({});
  });

  it("requires every payment field", () => {
    expect(validatePaymentDetails({ ...validPayment, cardholderName: "" }, now).cardholderName).toBe(
      "Name on card is required.",
    );
    expect(validatePaymentDetails({ ...validPayment, cardNumber: "" }, now).cardNumber).toBe(
      "Card number is required.",
    );
    expect(validatePaymentDetails({ ...validPayment, expiryDate: "" }, now).expiryDate).toBe(
      "Expiry date is required.",
    );
    expect(validatePaymentDetails({ ...validPayment, cvv: "" }, now).cvv).toBe("CVV is required.");
    expect(validatePaymentDetails({ ...validPayment, billingPostalCode: "" }, now).billingPostalCode).toBe(
      "Billing postal code is required.",
    );
  });

  it("requires exactly 16 card digits", () => {
    expect(validatePaymentDetails({ ...validPayment, cardNumber: "4242 4242 4242" }, now).cardNumber).toBe(
      "Card number must be 16 digits.",
    );
  });

  it("rejects invalid card numbers with Luhn validation", () => {
    expect(passesLuhnCheck("4242 4242 4242 4242")).toBe(true);
    expect(validatePaymentDetails({ ...validPayment, cardNumber: "4242 4242 4242 4241" }, now).cardNumber).toBe(
      "Enter a valid card number.",
    );
  });

  it("rejects invalid or expired expiry dates", () => {
    expect(validatePaymentDetails({ ...validPayment, expiryDate: "13/30" }, now).expiryDate).toBe(
      "Expiry month must be between 01 and 12.",
    );
    expect(validatePaymentDetails({ ...validPayment, expiryDate: "03/26" }, now).expiryDate).toBe(
      "Card expiry date cannot be in the past.",
    );
    expect(validatePaymentDetails({ ...validPayment, expiryDate: "04/26" }, now).expiryDate).toBeUndefined();
  });

  it("requires exactly 3 CVV digits", () => {
    expect(validatePaymentDetails({ ...validPayment, cvv: "123" }, now).cvv).toBeUndefined();
    expect(validatePaymentDetails({ ...validPayment, cvv: "12" }, now).cvv).toBe("CVV must be 3 digits.");
    expect(validatePaymentDetails({ ...validPayment, cvv: "1234" }, now).cvv).toBe("CVV must be 3 digits.");
  });

  it("rejects invalid name and postal code formats", () => {
    expect(validatePaymentDetails({ ...validPayment, cardholderName: "Sahan 123" }, now).cardholderName).toBe(
      "Name on card cannot include numbers.",
    );
    expect(validatePaymentDetails({ ...validPayment, billingPostalCode: "1@" }, now).billingPostalCode).toBe(
      "Billing postal code must be 3 to 10 characters.",
    );
  });
});
