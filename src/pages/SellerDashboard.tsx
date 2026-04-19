import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { listingApi, orderApi, reviewApi, type CreateListingPayload, type Listing, type Order, type Review } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Loader2, MessageSquare, Package, Pencil, Plus, RefreshCw, Send, Store, X } from "lucide-react";

const CATEGORIES = ["jewelry", "textiles", "pottery", "woodwork"];

type SellerReview = Review & {
  listingTitle?: string;
};

const initialForm = (): Omit<CreateListingPayload, "sellerId"> => ({
  title: "",
  description: "",
  category: CATEGORIES[0],
  imageUrls: [],
  price: 0,
  currency: "USD",
  stockQuantity: 1,
  country: "",
});

export default function SellerDashboard() {
  const { user } = useAuth();
  const [form, setForm] = useState<Omit<CreateListingPayload, "sellerId">>(initialForm);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [editingReplyReviewId, setEditingReplyReviewId] = useState<string | null>(null);

  const update = <K extends keyof Omit<CreateListingPayload, "sellerId">>(
    key: K,
    value: Omit<CreateListingPayload, "sellerId">[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const addImage = () => {
    if (!imageUrl.trim()) return;
    update("imageUrls", [...form.imageUrls, imageUrl.trim()]);
    setImageUrl("");
  };

  const removeImage = (index: number) => {
    update("imageUrls", form.imageUrls.filter((_, currentIndex) => currentIndex !== index));
  };

  const loadDashboard = useCallback(async () => {
    if (!user || user.role !== "SELLER") return;

    setLoading(true);
    try {
      const sellerListings = await listingApi.getBySeller(user.userId);
      const [sellerOrdersResult, sellerReviewsResult] = await Promise.allSettled([
        orderApi.getSellerOrders(user.userId),
        sellerListings.length > 0 ? reviewApi.getForListings(sellerListings.map((listing) => listing.id)) : Promise.resolve([]),
      ]);
      const sellerOrders = sellerOrdersResult.status === "fulfilled" ? sellerOrdersResult.value : [];
      const sellerReviews = sellerReviewsResult.status === "fulfilled" ? sellerReviewsResult.value : [];

      const listingTitleById = Object.fromEntries(sellerListings.map((listing) => [listing.id, listing.title]));
      const reviewsWithListings = sellerReviews.map((review) => ({
        ...review,
        listingTitle: listingTitleById[review.listingId] || "Listing",
      }));

      setListings(sellerListings);
      setOrders(sellerOrders);
      setReviews(reviewsWithListings);
      setReplyDrafts(
        Object.fromEntries(reviewsWithListings.map((review) => [review.id, review.sellerReply || ""])),
      );

      if (sellerOrdersResult.status === "rejected" || sellerReviewsResult.status === "rejected") {
        toast.error("Some dashboard sections could not be loaded");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load seller workspace");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== "SELLER") return;
    if (!form.title.trim() || !form.description.trim() || form.price <= 0) return;

    setSubmitting(true);
    try {
      await listingApi.create({
        sellerId: user.userId,
        ...form,
      });
      setForm(initialForm());
      setImageUrl("");
      toast.success("Listing created");
      await loadDashboard();
    } catch (err: any) {
      toast.error(err.message || "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  const updateReplyDraft = (reviewId: string, value: string) => {
    setReplyDrafts((current) => ({ ...current, [reviewId]: value }));
  };

  const openReplyEditor = (review: SellerReview) => {
    setReplyDrafts((current) => ({ ...current, [review.id]: review.sellerReply || "" }));
    setEditingReplyReviewId(review.id);
  };

  const closeReplyEditor = () => {
    const review = reviews.find((item) => item.id === editingReplyReviewId);
    if (review) {
      setReplyDrafts((current) => ({ ...current, [review.id]: review.sellerReply || "" }));
    }
    setEditingReplyReviewId(null);
  };

  const handleReplySubmit = async (event: React.FormEvent<HTMLFormElement>, review: SellerReview) => {
    event.preventDefault();
    if (!user || user.role !== "SELLER") return;

    const reply = (replyDrafts[review.id] || "").trim();
    if (!reply) {
      toast.error("Write a reply before submitting");
      return;
    }

    setReplyingReviewId(review.id);
    try {
      const updatedReview = await reviewApi.replyToReview(review.id, {
        sellerId: user.userId,
        reply,
      });

      setReviews((current) =>
        current.map((item) =>
          item.id === review.id
            ? { ...updatedReview, listingTitle: item.listingTitle }
            : item,
        ),
      );
      setReplyDrafts((current) => ({ ...current, [review.id]: updatedReview.sellerReply || reply }));
      toast.success(review.sellerReply ? "Reply updated" : "Reply posted");
      setEditingReplyReviewId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save reply");
    } finally {
      setReplyingReviewId(null);
    }
  };

  if (!user || user.role !== "SELLER") {
    return (
      <div className="container-page py-20 text-center text-muted-foreground">
        Only sellers can access this page.
      </div>
    );
  }

  const totalSoldItems = orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );
  const inputCls = "h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const editingReplyReview = reviews.find((review) => review.id === editingReplyReviewId) ?? null;
  const editingReplyDraft = editingReplyReview ? replyDrafts[editingReplyReview.id] ?? "" : "";

  return (
    <div className="container-page space-y-8 py-8 animate-fade-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Seller Studio</p>
          <h1 className="text-3xl font-bold">Manage your storefront</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Create new listings, track incoming orders, and review customer feedback in one place.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadDashboard()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Listings</p>
          <p className="mt-2 text-3xl font-bold">{listings.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Incoming Orders</p>
          <p className="mt-2 text-3xl font-bold">{orders.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Items Sold</p>
          <p className="mt-2 text-3xl font-bold">{totalSoldItems}</p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
        <section className="space-y-5 rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Create a new listing</h2>
              <p className="text-sm text-muted-foreground">Publish another product to your storefront.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className={inputCls}
                placeholder="Handmade Silver Ring"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Describe the craftsmanship, materials, and story behind the piece."
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className={inputCls}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className={inputCls}
                  placeholder="Sri Lanka"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price || ""}
                  onChange={(e) => update("price", Number(e.target.value) || 0)}
                  className={inputCls}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={(e) => update("currency", e.target.value.toUpperCase())}
                  className={inputCls}
                  maxLength={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(e) => update("stockQuantity", Number(e.target.value) || 0)}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Image URLs</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className={`${inputCls} flex-1`}
                  placeholder="https://example.com/product.jpg"
                />
                <Button type="button" variant="outline" size="icon" onClick={addImage}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {form.imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {form.imageUrls.map((url, index) => (
                    <div key={url} className="group relative h-16 w-16 overflow-hidden rounded-md bg-muted">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-4 w-4 text-background" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Publishing..." : "Publish listing"}
            </Button>
          </form>
        </section>

        <div className="space-y-8">
          <section className="space-y-4 rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Your listings</h2>
                <p className="text-sm text-muted-foreground">Keep track of inventory and storefront coverage.</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : listings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No listings yet. Publish your first item above.</p>
            ) : (
              <div className="space-y-3">
                {listings.map((listing) => (
                  <div key={listing.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{listing.title}</p>
                        <p className="text-sm text-muted-foreground">{listing.category}</p>
                      </div>
                      <Link to={`/listings/${listing.id}`} className="text-sm font-medium text-accent hover:underline">
                        View
                      </Link>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>{listing.currency} {listing.price.toFixed(2)}</span>
                      <span>{listing.stockQuantity} in stock</span>
                      <span>{listing.active ? "Active" : "Hidden"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Incoming orders</h2>
                <p className="text-sm text-muted-foreground">Orders that include your products.</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No customer orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">Buyer #{order.buyerId.slice(0, 8)}</p>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      {order.items.map((item) => (
                        <div key={`${order.id}-${item.listingId}`} className="flex justify-between">
                          <span>{item.title} x {item.quantity}</span>
                          <span>{order.currency} {item.lineTotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Customer reviews</h2>
                <p className="text-sm text-muted-foreground">Feedback left on your listings.</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => {
                  const replyDraft = replyDrafts[review.id] ?? review.sellerReply ?? "";

                  return (
                    <div key={review.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{review.userDisplayName}</p>
                          <p className="text-sm text-muted-foreground">{review.listingTitle}</p>
                        </div>
                        <span className="text-sm font-medium">{review.rating}/5</span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{review.comment || "No written comment."}</p>

                      {review.sellerReply ? (
                        <div className="mt-3 rounded-lg border bg-muted/40 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your reply</p>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="-mr-2 -mt-2 h-8 w-8"
                                    onClick={() => openReplyEditor(review)}
                                    aria-label="Update reply"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Update reply</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <p className="mt-1 text-sm">{review.sellerReply}</p>
                          {review.sellerReplyUpdatedAt && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Updated {new Date(review.sellerReplyUpdatedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <form onSubmit={(event) => handleReplySubmit(event, review)} className="mt-4 space-y-2">
                          <label htmlFor={`seller-reply-${review.id}`} className="text-sm font-medium">
                            Reply to review
                          </label>
                          <Textarea
                            id={`seller-reply-${review.id}`}
                            value={replyDraft}
                            onChange={(event) => updateReplyDraft(review.id, event.target.value)}
                            maxLength={1000}
                            rows={3}
                            className="min-h-[92px]"
                            placeholder="Write a public response to this buyer."
                          />
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs text-muted-foreground">{replyDraft.length}/1000 characters</span>
                            <Button
                              type="submit"
                              size="sm"
                              disabled={replyingReviewId === review.id || !replyDraft.trim()}
                            >
                              {replyingReviewId === review.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                              {replyingReviewId === review.id ? "Saving..." : "Post reply"}
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <Dialog open={Boolean(editingReplyReview)} onOpenChange={(open) => {
        if (!open) closeReplyEditor();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update reply</DialogTitle>
            <DialogDescription>
              Edit your public response to this customer review.
            </DialogDescription>
          </DialogHeader>

          {editingReplyReview && (
            <form onSubmit={(event) => handleReplySubmit(event, editingReplyReview)} className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-sm font-medium">{editingReplyReview.userDisplayName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {editingReplyReview.comment || "No written comment."}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor={`seller-reply-dialog-${editingReplyReview.id}`} className="text-sm font-medium">
                  Your reply
                </label>
                <Textarea
                  id={`seller-reply-dialog-${editingReplyReview.id}`}
                  value={editingReplyDraft}
                  onChange={(event) => updateReplyDraft(editingReplyReview.id, event.target.value)}
                  maxLength={1000}
                  rows={5}
                  className="min-h-[140px]"
                  placeholder="Write a public response to this buyer."
                />
                <p className="text-xs text-muted-foreground">{editingReplyDraft.length}/1000 characters</p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeReplyEditor}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={replyingReviewId === editingReplyReview.id || !editingReplyDraft.trim()}
                >
                  {replyingReviewId === editingReplyReview.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                  {replyingReviewId === editingReplyReview.id ? "Saving..." : "Update reply"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
