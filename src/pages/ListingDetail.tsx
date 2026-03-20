import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { listingApi, reviewApi, orderApi, type Listing, type Review } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import StarRating from "@/components/StarRating";
import { Loader2, ShoppingCart, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([listingApi.getById(id), reviewApi.getForListing(id)])
      .then(([l, r]) => {
        setListing(l);
        setReviews(r);
      })
      .catch(() => toast.error("Failed to load listing"))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    if (!user || !listing) return;
    setAdding(true);
    try {
      // Call backend to add to cart
      await orderApi.addToCart(user.userId, listing.id, qty);
      
      // Update local cart context
      addItem({
        listingId: listing.id,
        title: listing.title,
        quantity: qty,
        unitPrice: listing.price,
      });
      
      toast.success("Added to cart!");
      // Optionally navigate to cart
      setTimeout(() => navigate("/cart"), 500);
    } catch (err: any) {
      toast.error(err.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!listing)
    return (
      <div className="container-page py-20 text-center text-muted-foreground">
        Listing not found
      </div>
    );

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="container-page py-8 space-y-12 animate-fade-up">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            <img
              src={listing.imageUrls?.[0] || "/placeholder.svg"}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>
          {listing.imageUrls?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {listing.imageUrls.slice(1).map((url, i) => (
                <div
                  key={i}
                  className="w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0"
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {listing.category}
            </p>
            <h1 className="text-3xl font-bold leading-tight">{listing.title}</h1>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(avgRating)} />
                <span className="text-sm text-muted-foreground">
                  ({reviews.length} reviews)
                </span>
              </div>
            )}
          </div>

          <p className="text-3xl font-bold">
            {listing.currency} {listing.price.toFixed(2)}
          </p>

          <p className="text-muted-foreground leading-relaxed">
            {listing.description}
          </p>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {listing.stockQuantity > 0
                ? `${listing.stockQuantity} in stock`
                : "Out of stock"}
            </span>
            {listing.country && <span>- Ships from {listing.country}</span>}
          </div>

          {user && listing.stockQuantity > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-2 hover:bg-muted transition-colors active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 text-sm font-medium tabular-nums">{qty}</span>
                <button
                  onClick={() =>
                    setQty(Math.min(listing.stockQuantity, qty + 1))
                  }
                  className="p-2 hover:bg-muted transition-colors active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button
                onClick={addToCart}
                disabled={adding}
                className="flex-1"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {adding ? "Adding..." : "Add to cart"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="space-y-6 border-t pt-8">
        <h2 className="text-xl font-bold">Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-lg bg-card border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {r.userDisplayName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <span className="text-sm font-medium">
                      {r.userDisplayName}
                    </span>
                  </div>
                  <StarRating rating={r.rating} size={14} />
                </div>
                <p className="text-sm text-muted-foreground">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
