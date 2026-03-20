const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8084";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("artisan_token");
  const isAuthRequest = path.startsWith("/api/auth/");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token && !isAuthRequest) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    if (contentType.includes("application/json")) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || body?.error || res.statusText);
    }

    const body = await res.text();
    throw new Error(body || res.statusText);
  }

  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// ── Auth ──
export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  role: string;
  displayName: string;
  expiresIn: number;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  role: "BUYER" | "SELLER";
  country?: string;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    request<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
};

// ── Users ──
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: "BUYER" | "SELLER";
  country?: string;
}

export const userApi = {
  getProfile: (id: string) => request<UserProfile>(`/api/users/${id}`),
  updateProfile: (id: string, data: Partial<Pick<UserProfile, "displayName" | "country" | "avatarUrl">>) =>
    request<UserProfile>(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

// ── Listings ──
export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: string;
  country?: string;
  imageUrls: string[];
  price: number;
  currency: string;
  stockQuantity: number;
  active: boolean;
  createdAt: string;
}

export interface CreateListingPayload {
  sellerId: string;
  title: string;
  description: string;
  category: string;
  country?: string;
  imageUrls: string[];
  price: number;
  currency: string;
  stockQuantity: number;
}

export const listingApi = {
  getAll: () => request<Listing[]>("/api/listings"),
  getById: (id: string) => request<Listing>(`/api/listings/${id}`),
  search: (q: string) => request<Listing[]>(`/api/listings/search?q=${encodeURIComponent(q)}`),
  getByCategory: (cat: string) => request<Listing[]>(`/api/listings/category/${encodeURIComponent(cat)}`),
  getBySeller: (sellerId: string) => request<Listing[]>(`/api/listings/seller/${encodeURIComponent(sellerId)}`),
  create: (data: CreateListingPayload) =>
    request<Listing>("/api/listings", { method: "POST", body: JSON.stringify(data) }),
};

// ── Orders / Cart ──
export interface CartItem {
  listingId: string;
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface Cart {
  id: string;
  buyerId: string;
  items: CartItem[];
}

export interface OrderItem extends CartItem {
  lineTotal: number;
}

export interface Order {
  id: string;
  buyerId: string;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED";
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  createdAt: string;
}

export const orderApi = {
  addToCart: (buyerId: string, listingId: string, quantity: number) =>
    request<void>("/api/orders/cart", {
      method: "POST",
      headers: { "X-Buyer-Id": buyerId },
      body: JSON.stringify({ listingId, quantity }),
    }),
  checkout: (buyerId: string) =>
    request<Order>("/api/orders/checkout", {
      method: "POST",
      headers: { "X-Buyer-Id": buyerId },
    }),
  getOrders: (buyerId: string) =>
    request<Order[]>("/api/orders", { headers: { "X-Buyer-Id": buyerId } }),
  getSellerOrders: (sellerId: string) =>
    request<Order[]>(`/api/orders/seller/${encodeURIComponent(sellerId)}`),
  getOrder: (id: string) => request<Order>(`/api/orders/${id}`),
};

// ── Reviews ──
export interface Review {
  id: string;
  listingId: string;
  orderId: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewPayload {
  listingId: string;
  orderId: string;
  userId: string;
  rating: number;
  comment: string;
}

export const reviewApi = {
  getForListing: (listingId: string) =>
    request<Review[]>(`/api/reviews/listing/${listingId}`),
  getForListings: (listingIds: string[]) =>
    request<Review[]>(
      `/api/reviews/listings?${listingIds.map((id) => `listingIds=${encodeURIComponent(id)}`).join("&")}`,
    ),
  create: (data: CreateReviewPayload) =>
    request<Review>("/api/reviews", { method: "POST", body: JSON.stringify(data) }),
};
