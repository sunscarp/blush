"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import CategoryCarousel from "@/components/CategoryCarousel";
import ReviewCarousel from "@/components/ReviewCarousel";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

type Product = {
  ID: number;
  Description: string;
  ImageUrl1: string;
  Price: number;
  OriginalPrice?: number;
  Product: string;
};

export default function Home() {
  const router = useRouter();
  const { totalItems, pulse } = useCart();
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin(user);

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  // Fetch inventory
  useEffect(() => {
    const fetchProducts = async () => {
      if (!db) return;
      const snap = await getDocs(collection(db!, "inventory"));
      setProducts(snap.docs.map(d => d.data() as Product));
    };
    fetchProducts();
  }, []);

  // Local search filtering
  const filtered = search
    ? products.filter(p =>
        p.Description.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  // Group by category
  const grouped = filtered.reduce<Record<string, Product[]>>((acc, p) => {
    acc[p.Product] = acc[p.Product] || [];
    acc[p.Product].push(p);
    return acc;
  }, {});

  // Show four main categories once
  const categories = ["Party Wear Dresses", "Short Dresses", "Stockings", "Leather Skirts"];

  return (
    <>
 {/* Hero Logo Section */}
<section className="w-full flex justify-center items-center py-10 md:py-14">
  <div className="px-8">
    <img
      src="/Blush logo.jpg"
      alt="Blush Logo"
      className="w-48 sm:w-56 md:w-64 lg:w-72 object-contain mx-auto mix-blend-multiply"
    />
  </div>
</section>




      {/* Categories Panel (2x2 grid on mobile, 1x4 on desktop) */}
      <section className="text-black px-6 md:px-10 pt-16 rounded-xl">

        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Browse By Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map(cat => {
              const images: Record<string, string> = {
  "Party Wear Dresses": products.find(p => p.Product === "Party Wear Dresses")?.ImageUrl1 || "/placeholder.png",
  "Short Dresses": products.find(p => p.Product === "Short Dresses")?.ImageUrl1 || "/placeholder.png",
  "Stockings": products.find(p => p.Product === "Stockings")?.ImageUrl1 || "/placeholder.png",
  "Leather Skirts": products.find(p => p.Product === "Leather Skirts")?.ImageUrl1 || "/placeholder.png",
};

              const imgSrc = images[cat] || `https://picsum.photos/seed/${encodeURIComponent(cat)}/400/600`;
              return (
                <Link
                  key={cat}
                  href={`/shop?category=${encodeURIComponent(cat)}`}
                  className="group block rounded-xl overflow-hidden"
                >
                  <div className="relative h-44 md:h-80 lg:h-96 bg-gray-900 flex items-center justify-center hover:opacity-95 transition">
                    <img
                      src={imgSrc}
                      alt={cat}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-base md:text-2xl lg:text-3xl font-bold text-[#c9a24d] drop-shadow-lg uppercase tracking-wide text-center px-2">
                        {cat}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
<section className="text-black px-6 md:px-10 pt-16">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
      Best Sellers
    </h2>

    <div className="overflow-hidden">
      <div className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:gap-8">
        {products.slice(0, 6).map((p) => (
          <Link
            key={p.ID}
            href={`/product/${encodeURIComponent(p.Description)}`}
            className="flex-none w-[280px] md:w-[calc(50%-12px)] lg:w-auto flex flex-col items-center snap-center px-2"
          >
            <div className="aspect-square border border-gray-300 rounded-xl mb-3 overflow-hidden w-full max-w-xs bg-white">
              <img
                src={p.ImageUrl1}
                alt={p.Description}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="truncate text-gray-900 font-semibold text-base md:text-lg mb-1 w-full text-center">
              {p.Description}
            </div>

            <div className="mt-1 text-center">
              {p.OriginalPrice && (
                <span className="line-through text-gray-400 mr-2">
                  ₹{p.OriginalPrice}
                </span>
              )}
              <span className="text-[#d4af37] font-semibold">
                ₹{p.Price}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </div>
</section>

{/* NEW ARRIVALS */}
<section className="text-black px-6 md:px-10 pt-24">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
      New Arrivals
    </h2>

    <div className="overflow-hidden">
      <div className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:gap-8">
        {products.slice(6, 9).map((p) => (
          <Link
            key={p.ID}
            href={`/product/${encodeURIComponent(p.Description)}`}
            className="flex-none w-[280px] md:w-[calc(50%-12px)] lg:w-auto flex flex-col items-center snap-center px-2"
          >
            <div className="aspect-square border border-gray-300 rounded-xl mb-3 overflow-hidden w-full max-w-xs bg-white">
              <img
                src={p.ImageUrl1}
                alt={p.Description}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="truncate text-gray-900 font-semibold text-base md:text-lg mb-1 w-full text-center">
              {p.Description}
            </div>

            <div className="mt-1 text-center">
              {p.OriginalPrice && (
                <span className="line-through text-gray-400 mr-2">
                  ₹{p.OriginalPrice}
                </span>
              )}
              <span className="text-[#d4af37] font-semibold">
                ₹{p.Price}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </div>
</section>


      <ReviewCarousel />

      {/* Inventory Button - Only visible to admins */}
      {!loading && !adminLoading && isAdmin && (
        <Link
          href="/inventory"
          className="fixed right-6 bottom-6 z-40 rounded-full bg-white text-black px-6 py-3 shadow-2xl hover:bg-gray-200 font-semibold transition-colors"
        >
          Inventory
        </Link>
      )}
    </>
  );
}
