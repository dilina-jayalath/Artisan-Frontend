import { Link } from "react-router-dom";
import type { Listing } from "@/lib/api";

export default function ListingCard({ listing }: { listing: Listing }) {
  const imgSrc = listing.imageUrls?.[0] || "/placeholder.svg";

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group block bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={imgSrc}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
      </div>
      <div className="p-4 space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {listing.category}
        </p>
        <h3 className="font-semibold text-foreground leading-snug line-clamp-1">
          {listing.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {listing.description}
        </p>
        <p className="text-base font-bold text-foreground pt-1">
          {listing.currency} {listing.price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
