import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { orderApi, type Order } from "@/lib/api";
import { Loader2, Package } from "lucide-react";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-accent/20 text-accent",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadOrders = user.role === "SELLER"
      ? orderApi.getSellerOrders(user.userId)
      : orderApi.getOrders(user.userId);

    loadOrders
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user) return null;

  const title = user.role === "SELLER" ? "Incoming Orders" : "Your Orders";
  const emptyState = user.role === "SELLER" ? "No customer orders yet" : "No orders yet";

  return (
    <div className="container-page py-8 max-w-3xl mx-auto space-y-6 animate-fade-up">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Package className="w-6 h-6" /> {title}
      </h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>{emptyState}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="space-y-3 rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
                  {user.role === "SELLER" && (
                    <p className="text-xs text-muted-foreground">Buyer #{order.buyerId.slice(0, 8)}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] || "bg-muted"}`}>
                  {order.status}
                </span>
              </div>

              <div className="space-y-1">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.listingId}`} className="flex justify-between text-sm">
                    <span>{item.title} x {item.quantity}</span>
                    <span className="tabular-nums">${item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Total</span>
                <span className="tabular-nums">
                  {order.currency} {order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
