import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { orderApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  emptyPaymentDetails,
  formatBillingPostalCode,
  formatCardNumber,
  formatCvv,
  formatExpiryDate,
  hasPaymentErrors,
  type PaymentDetails,
  type PaymentField,
  validatePaymentDetails,
} from "@/lib/paymentValidation";
import { CreditCard, Loader2, ShieldCheck, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

type PaymentTouched = Partial<Record<PaymentField, boolean>>;

const paymentFields: PaymentField[] = [
  "cardholderName",
  "cardNumber",
  "expiryDate",
  "cvv",
  "billingPostalCode",
];

const inputCls =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

function getAllPaymentFieldsTouched(): PaymentTouched {
  return paymentFields.reduce((touched, field) => {
    touched[field] = true;
    return touched;
  }, {} as PaymentTouched);
}

export default function CartPage() {
  const { user } = useAuth();
  const { items, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>(emptyPaymentDetails);
  const [paymentTouched, setPaymentTouched] = useState<PaymentTouched>({});

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(false);
  }, [user, navigate]);

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const paymentErrors = validatePaymentDetails(paymentDetails);

  const updatePaymentField = (field: PaymentField, value: string) => {
    const formatters: Record<PaymentField, (entry: string) => string> = {
      cardholderName: (entry) => entry,
      cardNumber: formatCardNumber,
      expiryDate: formatExpiryDate,
      cvv: formatCvv,
      billingPostalCode: formatBillingPostalCode,
    };

    setPaymentDetails((current) => ({
      ...current,
      [field]: formatters[field](value),
    }));
  };

  const markPaymentFieldTouched = (field: PaymentField) => {
    setPaymentTouched((current) => ({ ...current, [field]: true }));
  };

  const getPaymentError = (field: PaymentField) =>
    paymentTouched[field] ? paymentErrors[field] : undefined;

  const getPaymentInputClass = (field: PaymentField) =>
    `${inputCls} ${getPaymentError(field) ? "border-destructive focus:ring-destructive" : ""}`;

  const handleCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const currentErrors = validatePaymentDetails(paymentDetails);
    if (hasPaymentErrors(currentErrors)) {
      setPaymentTouched(getAllPaymentFieldsTouched());
      toast.error("Please fix the payment details before checkout.");
      return;
    }

    setCheckingOut(true);
    try {
      await orderApi.checkout(user.userId);
      toast.success("Order placed successfully!");
      setPaymentDetails(emptyPaymentDetails);
      setPaymentTouched({});
      clearCart();
      navigate("/orders");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container-page py-8 max-w-2xl mx-auto space-y-6 animate-fade-up">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShoppingCart className="w-6 h-6" /> Your Cart
      </h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-muted-foreground">Your cart is empty</p>
          <Button variant="outline" onClick={() => navigate("/listings")}>
            Browse listings
          </Button>
        </div>
      ) : (
        <form onSubmit={handleCheckout} className="space-y-6" noValidate>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.listingId}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity} x ${item.unitPrice.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold tabular-nums">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.listingId)}
                    aria-label={`Remove ${item.title} from cart`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <section className="space-y-4 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CreditCard className="h-5 w-5" />
                Payment
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--success))]" />
                Protected
              </span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cardholderName" className="text-sm font-medium">
                Name on card
              </label>
              <input
                id="cardholderName"
                name="cardholderName"
                type="text"
                autoComplete="cc-name"
                value={paymentDetails.cardholderName}
                onChange={(event) => updatePaymentField("cardholderName", event.target.value)}
                onBlur={() => markPaymentFieldTouched("cardholderName")}
                disabled={checkingOut}
                className={getPaymentInputClass("cardholderName")}
                aria-invalid={Boolean(getPaymentError("cardholderName"))}
                aria-describedby={getPaymentError("cardholderName") ? "cardholderName-error" : undefined}
                maxLength={70}
              />
              {getPaymentError("cardholderName") && (
                <p id="cardholderName-error" className="text-xs text-destructive">
                  {getPaymentError("cardholderName")}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cardNumber" className="text-sm font-medium">
                Card number
              </label>
              <input
                id="cardNumber"
                name="cardNumber"
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                value={paymentDetails.cardNumber}
                onChange={(event) => updatePaymentField("cardNumber", event.target.value)}
                onBlur={() => markPaymentFieldTouched("cardNumber")}
                disabled={checkingOut}
                className={getPaymentInputClass("cardNumber")}
                aria-invalid={Boolean(getPaymentError("cardNumber"))}
                aria-describedby={getPaymentError("cardNumber") ? "cardNumber-error" : undefined}
                maxLength={19}
              />
              {getPaymentError("cardNumber") && (
                <p id="cardNumber-error" className="text-xs text-destructive">
                  {getPaymentError("cardNumber")}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="expiryDate" className="text-sm font-medium">
                  Expiry date
                </label>
                <input
                  id="expiryDate"
                  name="expiryDate"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  value={paymentDetails.expiryDate}
                  onChange={(event) => updatePaymentField("expiryDate", event.target.value)}
                  onBlur={() => markPaymentFieldTouched("expiryDate")}
                  disabled={checkingOut}
                  className={getPaymentInputClass("expiryDate")}
                  aria-invalid={Boolean(getPaymentError("expiryDate"))}
                  aria-describedby={getPaymentError("expiryDate") ? "expiryDate-error" : undefined}
                  maxLength={5}
                />
                {getPaymentError("expiryDate") && (
                  <p id="expiryDate-error" className="text-xs text-destructive">
                    {getPaymentError("expiryDate")}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cvv" className="text-sm font-medium">
                  CVV
                </label>
                <input
                  id="cvv"
                  name="cvv"
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={paymentDetails.cvv}
                  onChange={(event) => updatePaymentField("cvv", event.target.value)}
                  onBlur={() => markPaymentFieldTouched("cvv")}
                  disabled={checkingOut}
                  className={getPaymentInputClass("cvv")}
                  aria-invalid={Boolean(getPaymentError("cvv"))}
                  aria-describedby={getPaymentError("cvv") ? "cvv-error" : undefined}
                  maxLength={3}
                />
                {getPaymentError("cvv") && (
                  <p id="cvv-error" className="text-xs text-destructive">
                    {getPaymentError("cvv")}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="billingPostalCode" className="text-sm font-medium">
                Billing postal code
              </label>
              <input
                id="billingPostalCode"
                name="billingPostalCode"
                type="text"
                autoComplete="postal-code"
                value={paymentDetails.billingPostalCode}
                onChange={(event) => updatePaymentField("billingPostalCode", event.target.value)}
                onBlur={() => markPaymentFieldTouched("billingPostalCode")}
                disabled={checkingOut}
                className={getPaymentInputClass("billingPostalCode")}
                aria-invalid={Boolean(getPaymentError("billingPostalCode"))}
                aria-describedby={
                  getPaymentError("billingPostalCode") ? "billingPostalCode-error" : undefined
                }
                maxLength={10}
              />
              {getPaymentError("billingPostalCode") && (
                <p id="billingPostalCode-error" className="text-xs text-destructive">
                  {getPaymentError("billingPostalCode")}
                </p>
              )}
            </div>
          </section>
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-lg font-bold">Total</span>
            <span className="text-lg font-bold tabular-nums">${total.toFixed(2)}</span>
          </div>
          <Button type="submit" disabled={checkingOut} className="w-full" size="lg">
            {checkingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay ${total.toFixed(2)}
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
