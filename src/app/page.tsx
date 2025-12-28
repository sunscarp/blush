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
  ProductName?: string;
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
      <section className="text-black px-6 md:px-10 pt-8 md:pt-16 rounded-xl">

        <div className="max-w-7xl mx-auto">
          <h2
            className="text-3xl md:text-4xl text-center mb-10 md:mb-14"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontStyle: 'normal' }}
          >
            Browse By Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {categories.map(cat => {
              const images: Record<string, string> = {
  "Party Wear Dresses": "https://img4.dhresource.com/webp/m/0x0/f3/albu/jc/g/04/9244fe94-5e93-4600-9896-f0184a9d807d.jpg",
  "Short Dresses": "https://assets.myntassets.com/dpr_1.5,q_30,w_400,c_limit,fl_progressive/assets/images/2025/APRIL/23/5UJGEshH_07246c064c1f4bf9b7c38cd0fb6a8a3b.jpg",
  "Stockings": "https://assets.myntassets.com/dpr_1.5,q_30,w_400,c_limit,fl_progressive/assets/images/2025/MARCH/29/xu248Xou_cb078b7f8a8e4538910b46c46dff9d3b.jpg",
  "Leather Skirts": "https://assets.myntassets.com/dpr_1.5,q_30,w_400,c_limit,fl_progressive/assets/images/15953978/2022/1/29/a43ec50c-861c-4771-8460-48cf1b0a9f821643433862933-Tokyo-Talkies-Women-Black-A-Line-Slim-Fit-Skirt-631164343386-1.jpg",
};

              const imgSrc = images[cat] || `https://picsum.photos/seed/${encodeURIComponent(cat)}/400/600`;
              return (
                <Link
                  key={cat}
                  href={`/shop?category=${encodeURIComponent(cat)}`}
                  className="group block rounded-none overflow-hidden"
                >
                  {/* Mobile: show category name above image since hover isn't available */}
                  <div className="block md:hidden text-center mb-2">
                    <span className="text-lg font-semibold uppercase text-black">
                      {cat === "Party Wear Dresses" ? "Party Dresses" : cat}
                    </span>
                  </div>

                  <div className="relative h-44 md:h-80 lg:h-96 bg-gray-900 flex items-center justify-center transition">
                    <img
                      src={imgSrc}
                      alt={cat}
                      className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                    {/* Hover overlay with subtle shadow and "Shop X" text */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-base md:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg uppercase tracking-wide text-center px-2">
                        Shop {cat}
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
<section className="text-black px-6 md:px-10 pt-16 pb-12 md:pb-16 bg-transparent">
  <div className="max-w-7xl mx-auto">
    <h2
      className="text-3xl md:text-4xl text-center mb-16"
      style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontStyle: 'normal' }}
    >
      Best Sellers
    </h2>

    <div className="overflow-hidden">
      <div className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            {products.map((p) => (
          <Link
            key={p.ID}
            href={`/product/${encodeURIComponent(p.Description)}`}
            className="flex-none w-[280px] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-1rem)] flex flex-col items-center snap-center px-2"
          >
            <div className="aspect-square border border-gray-300 rounded-none mb-3 overflow-hidden w-full max-w-xs bg-white">
              <img
                src={p.ImageUrl1}
                alt={p.Description}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="truncate text-gray-900 text-base md:text-lg mb-1 w-full text-center">
              {p.ProductName || p.Description}
            </div>

            <div className="mt-1 text-center">
              {p.OriginalPrice && p.OriginalPrice !== p.Price && (
                <span className="line-through text-gray-400 mr-2">
                  ₹{p.OriginalPrice}
                </span>
              )}
              <span className="text-black font-semibold">
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
    <h2
      className="text-3xl md:text-4xl text-center mb-16"
      style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontStyle: 'normal' }}
    >
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
            <div className="aspect-square border border-gray-300 rounded-none mb-3 overflow-hidden w-full max-w-xs bg-white">
              <img
                src={p.ImageUrl1}
                alt={p.Description}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="truncate text-gray-900 text-base md:text-lg mb-1 w-full text-center">
              {p.ProductName || p.Description}
            </div>

            <div className="mt-1 text-center">
              {p.OriginalPrice && p.OriginalPrice !== p.Price && (
                <span className="line-through text-gray-400 mr-2">
                  ₹{p.OriginalPrice}
                </span>
              )}
              <span className="text-black font-semibold">
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
          className="fixed right-6 bottom-6 z-40 rounded-none bg-white text-black px-6 py-3 shadow-2xl hover:bg-gray-200 font-semibold transition-colors"
        >
          Inventory
        </Link>
      )}
    </>
  );
}
