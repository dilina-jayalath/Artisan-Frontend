import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { listingApi, type CreateListingPayload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

const CATEGORIES = ["jewelry", "textiles", "pottery", "woodwork"];

export default function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateListingPayload>({
    title: "", description: "", category: CATEGORIES[0],
    imageUrls: [], price: 0, currency: "USD", stockQuantity: 1, country: "",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user || user.role !== "SELLER") {
    return <div className="container-page py-20 text-center text-muted-foreground">Only sellers can access this page.</div>;
  }

  const update = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));
  const addImage = () => {
    if (imageUrl.trim()) {
      update("imageUrls", [...form.imageUrls, imageUrl.trim()]);
      setImageUrl("");
    }
  };
  const removeImage = (i: number) => update("imageUrls", form.imageUrls.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || form.price <= 0) return;
    setLoading(true);
    try {
      await listingApi.create({ ...form, sellerId: user.userId });
      toast.success("Listing created!");
      navigate("/listings");
    } catch (err: any) {
      toast.error(err.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="container-page py-8 max-w-xl mx-auto space-y-6 animate-fade-up">
      <h1 className="text-2xl font-bold">Create a listing</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)} required className={inputCls} placeholder="Handmade Silver Ring" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} required rows={3}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Describe your item..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select value={form.category} onChange={(e) => update("category", e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Country</label>
            <input type="text" value={form.country} onChange={(e) => update("country", e.target.value)} className={inputCls} placeholder="e.g. India" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Price (USD)</label>
            <input type="number" min="0.01" step="0.01" value={form.price || ""} onChange={(e) => update("price", parseFloat(e.target.value) || 0)} required className={inputCls} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Stock</label>
            <input type="number" min="1" value={form.stockQuantity} onChange={(e) => update("stockQuantity", parseInt(e.target.value) || 1)} required className={inputCls} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Image URLs</label>
          <div className="flex gap-2">
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={`${inputCls} flex-1`} placeholder="https://example.com/image.jpg" />
            <Button type="button" variant="outline" size="icon" onClick={addImage}><Plus className="w-4 h-4" /></Button>
          </div>
          {form.imageUrls.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {form.imageUrls.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden bg-muted group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <X className="w-4 h-4 text-background" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create listing"}
        </Button>
      </form>
    </div>
  );
}
