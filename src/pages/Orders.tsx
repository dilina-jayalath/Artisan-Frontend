import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { orderApi, reviewApi, type Order, type OrderItem, type Review } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "@/components/StarRating";
import { Loader2, MessageSquare, Package } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-accent/20 text-accent",
  DELIVERED: "bg-green-100 text-green-800",
};

const reviewableStatuses = new Set(["PAID", "SHIPPED", "DELIVERED"]);

type ReviewTarget = {
  orderId: string;
  listingId: string;
  title: string;
};

const getReviewKey = (orderId: string, listingId: string) => `${orderId}:${listingId}`;

const getReviewedItemMap = (reviews: Review[], userId: string) =>
  reviews.reduce<Record<string, Review>>((acc, review) => {
    if (review.userId === userId && review.orderId) {
      acc[getReviewKey(review.orderId, review.listingId)] = review;
    }
    return acc;
  }, {});

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviewedItems, setReviewedItems] = useState<Record<string, Review>>({});
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    let cancelled = false;

    const loadOrders = async () => {
      setLoading(true);
      try {
        const fetchedOrders = user.role === "SELLER"
          ? await orderApi.getSellerOrders(user.userId)
          : await orderApi.getOrders(user.userId);

        if (cancelled) return;
        setOrders(fetchedOrders);

        if (user.role !== "BUYER") {
          setReviewedItems({});
          return;
        }

        const listingIds = Array.from(new Set(
          fetchedOrders.flatMap((order) => order.items.map((item) => item.listingId)),
        ));

        if (listingIds.length === 0) {
          setReviewedItems({});
          return;
        }

        try {
          const reviews = await reviewApi.getForListings(listingIds);
          if (cancelled) return;
          setReviewedItems(getReviewedItemMap(reviews, user.userId));
        } catch {
          if (!cancelled) setReviewedItems({});
        }
      } catch {
        if (!cancelled) {
          setOrders([]);
          setReviewedItems({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  const openReviewDialog = (order: Order, item: OrderItem) => {
    setReviewTarget({
      orderId: order.id,
      listingId: item.listingId,
      title: item.title,
    });
    setReviewRating(5);
    setReviewComment("");
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !reviewTarget) return;

    setSubmittingReview(true);
    try {
      const created = await reviewApi.create({
        orderId: reviewTarget.orderId,
        listingId: reviewTarget.listingId,
        userId: user.userId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviewedItems((current) => ({
        ...current,
        [getReviewKey(created.orderId, created.listingId)]: created,
      }));
      setReviewDialogOpen(false);
      setReviewTarget(null);
      toast.success("Review posted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to post review");
    } finally {
      setSubmittingReview(false);
    }
  };

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
                {order.items.map((item) => {
                  const reviewKey = getReviewKey(order.id, item.listingId);
                  const existingReview = reviewedItems[reviewKey];
                  const canReview = user.role === "BUYER" && reviewableStatuses.has(order.status);

                  return (
                    <div
                      key={`${order.id}-${item.listingId}`}
                      className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{item.title} x {item.quantity}</p>
                        {existingReview && (
                          <p className="text-xs text-muted-foreground">
                            Reviewed {existingReview.rating}/5
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        {canReview && (
                          existingReview ? (
                            <Button type="button" variant="outline" size="sm" disabled>
                              Reviewed
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openReviewDialog(order, item)}
                            >
                              <MessageSquare className="h-4 w-4" />
                              Add review
                            </Button>
                          )
                        )}
                        <span className="tabular-nums">${item.lineTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
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

      <Dialog
        open={reviewDialogOpen}
        onOpenChange={(open) => {
          if (submittingReview) return;
          setReviewDialogOpen(open);
          if (!open) setReviewTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review {reviewTarget?.title}</DialogTitle>
            <DialogDescription>
              Share your rating and feedback for this purchased item.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <StarRating rating={reviewRating} onChange={setReviewRating} size={24} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-comment">Comment</Label>
              <Textarea
                id="review-comment"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="Tell others about the quality, packaging, or delivery experience."
                maxLength={1000}
                disabled={submittingReview}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={submittingReview}
                onClick={() => setReviewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingReview}>
                {submittingReview ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post review"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
