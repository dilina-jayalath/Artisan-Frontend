import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { listingApi, reviewApi, orderApi, type Listing, type Order, type Review } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "@/components/StarRating";
import { Loader2, ShoppingCart, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

const REVIEWABLE_STATUSES: Order["status"][] = ["PAID", "SHIPPED", "DELIVERED"];

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);
    setReviewRating(0);
    setReviewComment("");

    Promise.allSettled([listingApi.getById(id), reviewApi.getForListing(id)])
      .then(([listingResult, reviewResult]) => {
        if (!active) return;

        if (listingResult.status === "rejected") {
          setListing(null);
          setReviews([]);
          toast.error("Failed to load listing");
          return;
        }

        setListing(listingResult.value);

        if (reviewResult.status === "fulfilled") {
          setReviews(reviewResult.value);
        } else {
          setReviews([]);
          toast.error("Failed to load reviews");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== "BUYER") {
      setBuyerOrders([]);
      setOrdersLoading(false);
      return;
    }

    let active = true;
    setOrdersLoading(true);

    orderApi.getOrders(user.userId)
      .then((orders) => {
        if (active) setBuyerOrders(orders);
      })
      .catch(() => {
        if (!active) return;
        setBuyerOrders([]);
        toast.error("Failed to load your orders");
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!listing || !user || user.role !== "BUYER") {
      if (selectedOrderId) setSelectedOrderId("");
      return;
    }

    const nextEligibleOrders = buyerOrders.filter((order) =>
      REVIEWABLE_STATUSES.includes(order.status) &&
      order.items.some((item) => item.listingId === listing.id) &&
      !reviews.some((review) => review.userId === user.userId && review.orderId === order.id),
    );

    if (nextEligibleOrders.length === 0) {
      if (selectedOrderId) setSelectedOrderId("");
      return;
    }

    if (!nextEligibleOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(nextEligibleOrders[0].id);
    }
  }, [buyerOrders, listing, reviews, selectedOrderId, user]);

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

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || user.role !== "BUYER" || !listing || !selectedOrderId) return;
    if (reviewRating < 1) {
      toast.error("Select a star rating");
      return;
    }

    setSubmittingReview(true);
    try {
      const createdReview = await reviewApi.create({
        listingId: listing.id,
        orderId: selectedOrderId,
        userId: user.userId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviews((current) => [createdReview, ...current]);
      setReviewRating(0);
      setReviewComment("");
      toast.success("Review submitted");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
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
  const purchasedOrders = !listing || !user || user.role !== "BUYER"
    ? []
    : buyerOrders.filter((order) =>
        REVIEWABLE_STATUSES.includes(order.status) &&
        order.items.some((item) => item.listingId === listing.id),
      );
  const eligibleOrders = !listing || !user || user.role !== "BUYER"
    ? []
    : purchasedOrders.filter((order) =>
        !reviews.some((review) => review.userId === user.userId && review.orderId === order.id),
      );
  const selectedOrder = eligibleOrders.find((order) => order.id === selectedOrderId) ?? null;

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
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Reviews ({reviews.length})</h2>
          <p className="text-sm text-muted-foreground">
            Ratings and comments from verified buyers who purchased this item.
          </p>
        </div>

        {!user ? (
          <div className="rounded-xl border bg-card p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">Want to add a review?</h3>
              <p className="text-sm text-muted-foreground">
                Sign in with a buyer account after purchasing this item.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/login")}>
              Sign in
            </Button>
          </div>
        ) : user.role === "BUYER" ? (
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="font-semibold">Write a review</h3>
              <p className="text-sm text-muted-foreground">
                Reviews are available for paid purchases of this product.
              </p>
            </div>

            {ordersLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading your eligible orders...
              </div>
            ) : eligibleOrders.length > 0 ? (
              <form onSubmit={submitReview} className="space-y-4">
                <div className="space-y-2">
                  <Label>Your rating</Label>
                  <div className="flex items-center gap-3">
                    <StarRating rating={reviewRating} onChange={setReviewRating} size={20} />
                    <span className="text-sm text-muted-foreground">
                      {reviewRating > 0 ? `${reviewRating}/5` : "Select a rating"}
                    </span>
                  </div>
                </div>

                {eligibleOrders.length > 1 ? (
                  <div className="space-y-2">
                    <Label htmlFor="review-order">Order</Label>
                    <select
                      id="review-order"
                      value={selectedOrderId}
                      onChange={(event) => setSelectedOrderId(event.target.value)}
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {eligibleOrders.map((order) => (
                        <option key={order.id} value={order.id}>
                          {`Order #${order.id.slice(0, 8)} - ${new Date(order.createdAt).toLocaleDateString()}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : selectedOrder ? (
                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                    {`Reviewing Order #${selectedOrder.id.slice(0, 8)} from ${new Date(selectedOrder.createdAt).toLocaleDateString()}`}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="review-comment">Comment</Label>
                  <Textarea
                    id="review-comment"
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    maxLength={1000}
                    placeholder="Share what you liked about the craftsmanship, quality, or delivery."
                  />
                  <p className="text-xs text-muted-foreground">
                    {reviewComment.length}/1000 characters
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={submittingReview || !selectedOrderId || reviewRating < 1}
                >
                  {submittingReview ? "Submitting..." : "Submit review"}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                {purchasedOrders.length > 0
                  ? "You have already reviewed every eligible purchase of this product."
                  : "Purchase this product to unlock reviews."}
              </p>
            )}
          </div>
        ) : null}

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
                  <div className="text-right space-y-1">
                    <StarRating rating={r.rating} size={14} />
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {r.comment || "No written comment."}
                </p>
                {r.sellerReply && (
                  <div className="rounded-md border bg-muted/40 px-3 py-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Seller reply
                    </p>
                    <p className="mt-1 text-sm">{r.sellerReply}</p>
                    {r.sellerReplyUpdatedAt && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Updated {new Date(r.sellerReplyUpdatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
