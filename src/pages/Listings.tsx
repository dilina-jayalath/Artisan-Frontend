import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listingApi, type Listing } from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import { Loader2, Search } from "lucide-react";

const CATEGORIES = ["all", "jewelry", "textiles", "pottery", "woodwork"];

export default function ListingsPage() {
  const [params, setParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(params.get("q") || "");
  const activeCategory = params.get("category") || "all";
  const query = params.get("q") || "";

  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      try {
        let data: Listing[];
        if (query) {
          data = await listingApi.search(query);
        } else if (activeCategory && activeCategory !== "all") {
          data = await listingApi.getByCategory(activeCategory);
        } else {
          data = await listingApi.getAll();
        }
        setListings(data);
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [query, activeCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setParams({ q: searchInput.trim() });
    } else {
      setParams({});
    }
  };

  return (
    <div className="container-page py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          {query ? `Results for "${query}"` : activeCategory !== "all" ? `${activeCategory}` : "All listings"}
        </h1>
        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search..."
            className="w-full h-9 pl-9 pr-4 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setParams(cat === "all" ? {} : { category: cat }); setSearchInput(""); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No listings found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
