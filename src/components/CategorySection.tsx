"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";

const CategorySection = forwardRef<
  HTMLDivElement,
  { title: string; prefix: string }
>(({ title, prefix }, ref) => {
  const { addItem, removeItem, cart } = useCart();
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const products = Array.from({ length: 12 }, (_, i) => `${prefix}-${i + 1}`);

  /* ---------- Carousel Auto Slide ---------- */
  const startAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIndex(prev => (prev + 4) % products.length);
    }, 12000);
  };

  useEffect(() => {
    startAutoSlide();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  /* ---------- Manual Move ---------- */
  const move = (dir: number) => {
    startAutoSlide();
    setIndex(prev => (prev + dir + products.length) % products.length);
  };

  const visible = products.slice(index, index + 4);

  return (
    <section ref={ref} className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold">{title}</h2>
        <button className="underline font-bold">View All</button>
      </div>

      {/* Carousel */}
      <div className="relative flex items-center">
        <button
          onClick={() => move(-4)}
          className="text-3xl px-3 font-bold"
        >
          ‹
        </button>

        <div className="grid grid-cols-4 gap-6 flex-1">
          {visible.map(id => {
            const quantity = cart[id] ?? 0;

            return (
              <div
                key={id}
                className="border-2 rounded-xl p-6 text-center font-bold"
              >
                {/* Product Placeholder */}
                <div className="bg-gray-200 h-32 rounded mb-4 flex items-center justify-center">
                  {id}
                </div>

                {/* Controls */}
                <div className="flex justify-center items-center gap-4">
                  <button
                    onClick={() => {
                      startAutoSlide();
                      addItem(id);
                    }}
                    className="px-3 py-1 bg-black text-white rounded"
                  >
                    +
                  </button>

                  <span className="min-w-[20px] text-lg font-extrabold">
                    {quantity}
                  </span>

                  <button
                    onClick={() => {
                      if (quantity > 0) {
                        startAutoSlide();
                        removeItem(id);
                      }
                    }}
                    disabled={quantity === 0}
                    className="px-3 py-1 border-2 rounded disabled:opacity-40"
                  >
                    −
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => move(4)}
          className="text-3xl px-3 font-bold"
        >
          ›
        </button>
      </div>
    </section>
  );
});

CategorySection.displayName = "CategorySection";
export default CategorySection;
