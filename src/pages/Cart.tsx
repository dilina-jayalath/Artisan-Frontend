import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { orderApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  const { user } = useAuth();
  const { items, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(false);
  }, [user, navigate]);

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleCheckout = async () => {
    if (!user) return;

    setCheckingOut(true);
    try {
      await orderApi.checkout(user.userId);
      toast.success("Order placed successfully!");
      clearCart();
      navigate("/orders");
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
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
        <>
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
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-lg font-bold">Total</span>
            <span className="text-lg font-bold tabular-nums">${total.toFixed(2)}</span>
          </div>
          <Button onClick={handleCheckout} disabled={checkingOut} className="w-full" size="lg">
            {checkingOut ? "Processing..." : "Checkout"}
          </Button>
        </>
      )}
    </div>
  );
}
