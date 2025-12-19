"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Product = {
  ID: number;
  Description: string;
  ImageUrl1: string;
  Price: number;
};

export default function CategoryCarousel({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canSlide = products.length > 4;

  const visible = canSlide
    ? products.slice(index, index + 4)
    : products;

  const startAuto = () => {
    if (!canSlide) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIndex(prev => (prev + 4) % products.length);
    }, 12000);
  };

  useEffect(() => {
    startAuto();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [products]);

  const move = (dir: number) => {
    startAuto();
    setIndex(prev => (prev + dir + products.length) % products.length);
  };

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-extrabold">{title}</h2>

      <div className="relative flex items-center">
        {canSlide && (
          <button onClick={() => move(-4)} className="text-3xl px-2">
            ‹
          </button>
        )}

        <div className="grid grid-cols-4 gap-6 flex-1">
          {visible.map(p => (
            <Link
              key={p.ID}
              href={`/product/${encodeURIComponent(p.Description)}`}
              className="border-2 rounded-xl p-4 font-bold hover:shadow-lg transition"
            >
              <div className="aspect-square border rounded mb-3 overflow-hidden">
                <img
                  src={p.ImageUrl1}
                  alt={p.Description}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate">{p.Description}</div>
              <div className="mt-1">₹{p.Price}</div>
            </Link>
          ))}
        </div>

        {canSlide && (
          <button onClick={() => move(4)} className="text-3xl px-2">
            ›
          </button>
        )}
      </div>
    </section>
  );
}
