"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Product = {
  ID: number;
  Description: string;
  ImageUrl1: string;
  Price: number;
  ProductName: string;
  Category?: string;
};

function ShopContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<string>("relevance");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [expandedMain, setExpandedMain] = useState<Record<string, boolean>>({});
  const params = useSearchParams();
  const search = params.get("search")?.toLowerCase() || "";

  const formatCurrency = (n: number) => {
    try {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
    } catch (e) {
      return `₹${n}`;
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (!db) return;
      const snap = await getDocs(collection(db!, "inventory"));
      setProducts(snap.docs.map(d => d.data() as Product));
    };
    fetchProducts();
  }, []);

  const filtered = products.filter(p => {
    // match using the Firestore 'Category' field
    if (filter && (p.Category ?? null) !== filter) return false;
    if (search && !p.Description.toLowerCase().includes(search)) return false;
    return true;
  });

  const sorted = (() => {
    const s = [...filtered];
    if (sort === "price-asc") return s.sort((a, b) => (a.Price ?? 0) - (b.Price ?? 0));
    if (sort === "price-desc") return s.sort((a, b) => (b.Price ?? 0) - (a.Price ?? 0));
    return s;
  })();

  // only include the explicit categories you asked for and categories from data
  const defaultCategories = ["Party Wear Dresses", "Short Dresses", "Purses", "Earrings"];
  const categories = Array.from(new Set([...defaultCategories, ...products.map(p => p.Category ?? "")]));

  const subcategoryMap: Record<string, { label: string; value: string }[]> = {
    Dresses: [
      { label: "Party", value: "Party Dresses" },
      { label: "Short", value: "Short Dresses" }
    ],
    Accessories: [
      { label: "Purses", value: "Purses" },
      { label: "Earrings", value: "Earrings" }
    ]
  };

  // when arriving with ?category=..., apply it
  useEffect(() => {
    try {
      const cat = params.get("category");
      if (cat) {
        setFilter(cat);
        setSelectedSubcategory(cat);
      }
    } catch (e) {
      // ignore
    }
  }, [params]);

  return (
    <div className="bg-white min-h-screen">
      <main className="px-4 py-8 max-w-6xl mx-auto">
        <div className="mb-4">
          <div className="text-sm text-gray-400">Showing {sorted.length} products</div>
        </div>

        <div className="md:flex md:items-start md:gap-6">
          {/* Sidebar - desktop only */}
          <aside className="hidden md:block w-64 shrink-0 md:-ml-6">
            <div className="bg-white border border-pink-50 rounded-md p-4 sticky top-20">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">Filters</div>
                <button
                  onClick={() => { setFilter(null); setSort('relevance'); setSelectedSubcategory(null); }}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-1">
                {/* All option */}
                <button
                  onClick={() => { setFilter(null); setSelectedSubcategory(null); }}
                  className={`w-full text-left px-2 py-1 rounded-md text-sm ${filter === null ? 'bg-[#ffd1dc] text-black' : 'text-gray-800 hover:bg-[#fff0f4]'}`}
                >
                  All
                </button>

                {/* Main dress categories */}
                {/* <button
                  onClick={() => { setFilter("Party Dresses"); setSelectedSubcategory("Party Dresses"); }}
                  className={`w-full text-left px-2 py-1 rounded-md text-sm ${selectedSubcategory === "Party Dresses" ? 'bg-black text-white' : 'text-gray-800 hover:bg-gray-100'}`}
                >
                  Party Wear Dresses
                </button> */}

                <button
                  onClick={() => { setFilter("Party Wear Dresses"); setSelectedSubcategory("Party Wear Dresses"); }}
                  className={`w-full text-left px-2 py-1 rounded-md text-sm ${selectedSubcategory === "Party Wear Dresses" ? 'bg-[#ffd1dc] text-black' : 'text-gray-800 hover:bg-[#fff0f4]'}`}
                >
                  Party Wear Dresses
                </button>

                <button
                  onClick={() => { setFilter("Short Dresses"); setSelectedSubcategory("Short Dresses"); }}
                  className={`w-full text-left px-2 py-1 rounded-md text-sm ${selectedSubcategory === "Short Dresses" ? 'bg-[#ffd1dc] text-black' : 'text-gray-800 hover:bg-[#fff0f4]'}`}
                >
                  Short Dresses
                </button>

                {/* Other categories from your existing data */}
                  {categories.filter(c => c && !["Party Wear Dresses", "Short Dresses", "Purses", "Earrings"].includes(c)).map(c => (
                  <button
                    key={c}
                    onClick={() => { setFilter(c); setSelectedSubcategory(c); }}
                    className={`w-full text-left px-2 py-1 rounded-md text-sm ${selectedSubcategory === c ? 'bg-[#ffd1dc] text-black' : 'text-gray-800 hover:bg-[#fff0f4]'}`}
                  >
                    {c}
                  </button>
                ))}

                {/* Accessories section */}
                <div className="pt-2">
                  <div className="px-2 py-1 text-sm font-medium text-gray-800">Accessories</div>
                    <button
                      onClick={() => { setFilter("Purses"); setSelectedSubcategory("Purses"); }}
                      className={`w-full text-left px-2 py-1 rounded-md text-sm ${selectedSubcategory === "Purses" ? 'bg-[#ffd1dc] text-black' : 'text-gray-800 hover:bg-[#fff0f4]'}`}
                    >
                      • Purses
                    </button>
                    <button
                      onClick={() => { setFilter("Earrings"); setSelectedSubcategory("Earrings"); }}
                      className={`w-full text-left px-2 py-1 rounded-md text-sm ${selectedSubcategory === "Earrings" ? 'bg-[#ffd1dc] text-black' : 'text-gray-800 hover:bg-[#fff0f4]'}`}
                    >
                      • Earrings
                    </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content area */}
          <div className="flex-1">
            {/* Mobile bottom toolbar (only on mobile) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
              <div className="max-w-6xl mx-auto flex divide-x divide-white px-0 py-0">
                <button
                  onClick={() => { setShowFilterPopover(false); setShowMobileSort(s => !s); }}
                  className="flex-1 flex items-center justify-center gap-2 text-sm bg-[#ffe4ec] text-black px-4 py-3 hover:bg-[#fff0f4]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M10 6h6M6 12h10M8 18h8" />
                  </svg>
                  <span>Sort By</span>
                </button>

                <button
                  onClick={() => { setShowMobileSort(false); setShowFilterPopover(s => !s); }}
                  aria-expanded={showFilterPopover}
                  aria-controls="filter-popover"
                  className="flex-1 flex items-center justify-center gap-2 text-sm bg-[#ffe4ec] text-black px-4 py-3 hover:bg-[#fff0f4]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 12h12M10 19h4" />
                  </svg>
                  <span>Filters</span>
                </button>
              </div>

              {/* Mobile sort popover */}
              {showMobileSort && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 w-[90vw] sm:w-72 z-[9999]">
                  <div className="text-sm font-semibold mb-2">Sort</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setSort("relevance"); setShowMobileSort(false); }}
                      className={`w-full text-left px-2 py-1 rounded-md text-sm ${sort === "relevance" ? "bg-[#ffd1dc] text-black" : "text-gray-800 hover:bg-[#fff0f4]"}`}
                    >
                      Relevance
                    </button>
                    <button
                      onClick={() => { setSort("price-asc"); setShowMobileSort(false); }}
                      className={`w-full text-left px-2 py-1 rounded-md text-sm ${sort === "price-asc" ? "bg-[#ffd1dc] text-black" : "text-gray-800 hover:bg-[#fff0f4]"}`}
                    >
                      Price: Low to High
                    </button>
                    <button
                      onClick={() => { setSort("price-desc"); setShowMobileSort(false); }}
                      className={`w-full text-left px-2 py-1 rounded-md text-sm ${sort === "price-desc" ? "bg-[#ffd1dc] text-black" : "text-gray-800 hover:bg-[#fff0f4]"}`}
                    >
                      Price: High to Low
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile filter popover (positioned above toolbar) */}
              {showFilterPopover && (
                <div id="filter-popover" className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 w-[90vw] sm:w-72 z-[9999]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold">Filters</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setFilter(null); setSort("relevance"); setSelectedSubcategory(null); }}
                        className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
                      >
                        Reset
                      </button>
                      <button onClick={() => setShowFilterPopover(false)} className="text-gray-500 text-sm cursor-pointer">Close</button>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    {/* All option */}
                    <button
                      onClick={() => { setFilter(null); setSelectedSubcategory(null); setShowFilterPopover(false); }}
                      className={`w-full text-left px-2 py-1 rounded-md text-sm ${filter === null ? 'bg-[#ffd1dc] text-black' : 'text-gray-800 hover:bg-[#fff0f4]'}`}
                    >
                      All
                    </button>

                    <button
                      onClick={() => { setFilter("Party Wear Dresses"); setSelectedSubcategory("Party Wear Dresses"); setShowFilterPopover(false); }}
                      className={`w-full text-left px-2 py-1 rounded-md text-sm ${selectedSubcategory === "Party Wear Dresses" ? 'bg-[#ffd1dc] text-black' : 'text-gray-800 hover:bg-[#fff0f4]'}`}
                    >
                      Party Wear Dresses
                    </button>

                    <button
                      onClick={() => { setFilter("Short Dresses"); setSelectedSubcategory("Short Dresses"); setShowFilterPopover(false); }}
                      className={`w-full text-left px-2 py-1 rounded-md text-sm ${selectedSubcategory === "Short Dresses" ? 'bg-[#ffd1dc] text-black' : 'text-gray-800 hover:bg-[#fff0f4]'}`}
                    >
                      Short Dresses
                    </button>

                    {categories.filter(c => c && !["Party Wear Dresses", "Short Dresses", "Purses", "Earrings"].includes(c)).map(c => (
                      <button
                        key={c}
                        onClick={() => { setFilter(c); setSelectedSubcategory(c); setShowFilterPopover(false); }}
                        className={`w-full text-left px-2 py-1 rounded-md text-sm ${selectedSubcategory === c ? 'bg-[#ffd1dc] text-black' : 'text-gray-800 hover:bg-[#fff0f4]'}`}
                      >
                        {c}
                      </button>
                    ))}

                    <div className="pt-2">
                      <div className="px-2 py-1 text-sm font-medium text-gray-800">Accessories</div>
                      <button
                        onClick={() => { setFilter("Purses"); setSelectedSubcategory("Purses"); setShowFilterPopover(false); }}
                        className={`w-full text-left px-2 py-1 rounded-md text-sm ${selectedSubcategory === "Purses" ? 'bg-[#ffd1dc] text-black' : 'text-gray-800 hover:bg-[#fff0f4]'}`}
                      >
                        • Purses
                      </button>
                      <button
                        onClick={() => { setFilter("Earrings"); setSelectedSubcategory("Earrings"); setShowFilterPopover(false); }}
                        className={`w-full text-left px-2 py-1 rounded-md text-sm ${selectedSubcategory === "Earrings" ? 'bg-[#ffd1dc] text-black' : 'text-gray-800 hover:bg-[#fff0f4]'}`}
                      >
                        • Earrings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop filter toolbar (top-left) */}
            <div className="hidden md:flex items-center gap-4 mb-6 justify-end">
              <div className="relative">
                <button
                  onClick={() => setSortOpen((s) => !s)}
                  className="flex items-center gap-2 text-sm bg-gray-100 text-gray-800 px-3 py-2 rounded-full hover:bg-gray-200 cursor-pointer"
                  aria-expanded={sortOpen}
                >
                  <span>Sort</span>
                  <span className="text-xs text-gray-500">
                    {sort === "price-asc"
                      ? "Price: Low to High"
                      : sort === "price-desc"
                      ? "Price: High to Low"
                      : "Relevance"}
                  </span>
                  <svg
                    className={`w-4 h-4 transform ${sortOpen ? "rotate-180" : "rotate-0"}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 9l6 6 6-6"
                    />
                  </svg>
                </button>

                {sortOpen && (
                  <div className="absolute mt-2 left-0 bg-white border border-pink-50 rounded-md shadow-lg p-2 w-56 z-30">
                    <button
                      onClick={() => {
                        setSort("relevance");
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded-md text-sm ${
                        sort === "relevance"
                          ? "bg-[#ffd1dc] text-black"
                          : "text-gray-800 hover:bg-[#fff0f4]"
                      }`}
                    >
                      Relevance
                    </button>
                    <button
                      onClick={() => {
                        setSort("price-asc");
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1 mt-1 rounded-md text-sm ${
                        sort === "price-asc"
                          ? "bg-[#ffd1dc] text-black"
                          : "text-gray-800 hover:bg-[#fff0f4]"
                      }`}
                    >
                      Price: Low to High
                    </button>
                    <button
                      onClick={() => {
                        setSort("price-desc");
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1 mt-1 rounded-md text-sm ${
                        sort === "price-desc"
                          ? "bg-[#ffd1dc] text-black"
                          : "text-gray-800 hover:bg-[#fff0f4]"
                      }`}
                    >
                      Price: High to Low
                    </button>
                  </div>
                )}
              </div>


            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                {sorted.map(p => {
                const oldPrice = (p as any).OldPrice ?? (p as any).MSRP ?? null;
                const stock = (p as any).Stock;
                const outOfStock = stock !== undefined && Number(stock) === 0;
                const soldOut = !!(p as any).SoldOut || outOfStock;
                const savePct = oldPrice && oldPrice > p.Price ? Math.round(((oldPrice - p.Price) / oldPrice) * 100) : null;
                return (
                <Link key={p.ID} href={`/product/${encodeURIComponent(p.Description)}`} className="block relative p-0 font-light hover:shadow-sm transition-colors hover:-translate-y-0.5 cursor-pointer overflow-hidden">
                  {outOfStock && (
                    <span
                      className="absolute top-5 left-[-10px] bg-red-200 text-red-800 text-base font-bold px-4 py-1.5 rounded-full shadow-lg"
                      style={{
                        transform: 'rotate(-20deg) scale(1.05)',
                        zIndex: 10,
                        border: '2px solid #f87171',
                        letterSpacing: '1.5px',
                      }}
                    >
                      Out of Stock
                    </span>
                  )}
                  {!outOfStock && soldOut && (
                    <span className="absolute top-3 left-3 bg-[#fff5f7] text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">Sold out</span>
                  )}
                  {savePct && !soldOut && (
                    <span className="absolute top-3 left-3 bg-[#ffd1dc] text-black text-xs font-semibold px-3 py-1 rounded-full">Save {savePct}%</span>
                  )}
                  <div className="w-full overflow-hidden aspect-[4/5]">
                    <img
                      src={p.ImageUrl1 ? p.ImageUrl1 : "/placeholder.png"}
                      alt={p.ProductName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="py-2 px-1">
                    <h3 className="text-sm md:text-lg lg:text-xl font-normal text-gray-900 leading-tight">{p.ProductName}</h3>
                    <div className="mt-2 flex items-baseline gap-3">
                      <div className="text-sm md:text-lg font-bold text-gray-900">{formatCurrency(p.Price)}</div>
                      {oldPrice && oldPrice > p.Price && (
                        <div className="text-sm text-gray-500 line-through">{formatCurrency(oldPrice)}</div>
                      )}
                    </div>
                  </div>
                </Link>
              )})}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}