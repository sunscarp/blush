"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useSearchParams } from "next/navigation";

type Product = {
  ID: number;
  Description: string;
  ImageUrl1: string;
  Price: number;
  Product: string;
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const params = useSearchParams();
  const search = params.get("search")?.toLowerCase() || "";

  useEffect(() => {
    const fetchProducts = async () => {
      const snap = await getDocs(collection(db, "inventory"));
      setProducts(snap.docs.map(d => d.data() as Product));
    };
    fetchProducts();
  }, []);

  const filtered = products.filter(p => {
    if (filter && p.Product !== filter) return false;
    if (search && !p.Description.toLowerCase().includes(search)) return false;
    return true;
  });

  const categories = Array.from(new Set(products.map(p => p.Product)));

  return (
    <>
      <Navbar />

      <main className="px-10 pt-32 space-y-6">
        <div className="flex gap-4 items-center">
          <select
            onChange={e => setFilter(e.target.value || null)}
            className="border-2 rounded px-3 py-2 font-bold"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {filtered.map(p => (
            <Link
              key={p.ID}
              href={`/product/${encodeURIComponent(p.Description)}`}
              className="border-2 rounded-xl p-4 font-bold hover:shadow-lg"
            >
              <div className="aspect-square border rounded mb-3 overflow-hidden">
                <img
                  src={p.ImageUrl1}
                  alt={p.Description}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate">{p.Description}</div>
              <div>₹{p.Price}</div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
