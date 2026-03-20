import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut, Package, Search, ShoppingCart, User } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/listings?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link to="/" className="shrink-0 text-xl font-bold tracking-tight text-foreground">
            Artisan
          </Link>

          <form onSubmit={handleSearch} className="mx-4 hidden max-w-md flex-1 sm:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search handmade goods..."
                className="h-9 w-full rounded-lg border bg-muted/50 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </form>

          <nav className="flex items-center gap-2">
            <Link to="/listings">
              <Button variant="ghost" size="sm">Browse</Button>
            </Link>

            {isAuthenticated ? (
              <>
                {user?.role === "SELLER" && (
                  <Link to="/seller">
                    <Button variant="ghost" size="sm">
                      <LayoutDashboard className="mr-1 h-4 w-4" /> Studio
                    </Button>
                  </Link>
                )}
                <Link to="/cart">
                  <Button variant="ghost" size="sm">
                    <ShoppingCart className="mr-1 h-4 w-4" /> Cart
                  </Button>
                </Link>
                <Link to="/orders">
                  <Button variant="ghost" size="sm">
                    <Package className="mr-1 h-4 w-4" /> Orders
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="mr-1 h-4 w-4" /> Profile
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  <LogOut className="mr-1 h-4 w-4" /> Sign out
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-16 border-t py-8">
        <div className="container-page text-center text-sm text-muted-foreground">
          Copyright {new Date().getFullYear()} Artisan Marketplace. Handmade with care.
        </div>
      </footer>
    </div>
  );
}
