import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gem, Truck, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="container-page py-24 md:py-32 space-y-8 text-center animate-fade-up">
        <h1 className="text-4xl md:text-6xl font-bold leading-[1.08] max-w-3xl mx-auto">
          Discover unique handcrafted goods from artisans worldwide
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          A curated marketplace connecting buyers with independent craftspeople. Every piece tells a story.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/listings">
            <Button size="lg">
              Browse marketplace <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" size="lg">
              Start selling
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-16 border-t">
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { icon: Gem, title: "Handmade quality", desc: "Every item is crafted by skilled artisans with attention to detail and authentic materials." },
            { icon: Truck, title: "Direct from makers", desc: "Buy directly from creators — no middlemen, fair prices, and a personal connection." },
            { icon: Shield, title: "Secure checkout", desc: "Your purchases are protected with secure payment processing and order tracking." },
          ].map((f, i) => (
            <div
              key={f.title}
              className="space-y-3 opacity-0 animate-fade-up"
              style={{ animationDelay: `${200 + i * 120}ms`, animationFillMode: "forwards" }}
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <f.icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16 border-t">
        <h2 className="text-2xl font-bold mb-8">Shop by category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["jewelry", "textiles", "pottery", "woodwork"].map((cat, i) => (
            <Link
              key={cat}
              to={`/listings?category=${cat}`}
              className="group relative h-40 rounded-lg overflow-hidden bg-muted flex items-end p-4 opacity-0 animate-fade-up"
              style={{ animationDelay: `${400 + i * 100}ms`, animationFillMode: "forwards" }}
            >
              <span className="text-base font-semibold capitalize group-hover:text-accent transition-colors">
                {cat}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
