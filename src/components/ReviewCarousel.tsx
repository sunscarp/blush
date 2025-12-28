"use client";

import { useEffect, useRef, useState } from "react";

const reviews = [
  {
    name: "Aarav S.",
    text: "Absolutely loved the fabric quality. The fit is perfect and delivery was faster than expected."
  },
  {
    name: "Ritika M.",
    text: "The designing on this is premium. Definitely ordering again."
  },
  {
    name: "Kunal P.",
    text: "Worth every rupee. Looks exactly like the pictures and feels great to wear."
  },
  {
    name: "Sneha R.",
    text: "Packaging, quality, and support — everything was on point."
  },
  {
    name: "Aditya V.",
    text: "Best thing I’ve bought online so far. Highly recommended."
  },
  {
    name: "Neha K.",
    text: "Stylish, comfortable, and premium. Loved the blush aesthetic."
  }
];

export default function ReviewCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // update button visibility
  const updateScrollButtons = () => {
    const el = containerRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  // scroll by one card
  const scrollByOne = (direction: "left" | "right") => {
    const el = containerRef.current;
    if (!el) return;

    const card = el.querySelector<HTMLElement>("[data-card]");
    if (!card) return;

    const cardWidth = card.offsetWidth + 24; // gap included

    el.scrollBy({
      left: direction === "right" ? cardWidth : -cardWidth,
      behavior: "smooth"
    });
  };

  // auto-scroll every 9 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (canScrollRight) {
        scrollByOne("right");
      }
    }, 9000);

    return () => clearInterval(interval);
  }, [canScrollRight]);

  useEffect(() => {
    updateScrollButtons();
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollButtons);
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, []);

  return (
    <section className="py-16 text-[#1c1c1c]">
      <h2
        className="text-2xl sm:text-3xl md:text-4xl text-center mb-16"
        style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontStyle: 'normal' }}
      >
        Customer Reviews
      </h2>

      <div className="relative">
        {/* LEFT BUTTON */}
        {canScrollLeft && (
          <button
            onClick={() => scrollByOne("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-[#fff0f4] text-black p-3 rounded-full shadow-lg"
          >
            ‹
          </button>
        )}

        {/* RIGHT BUTTON */}
        {canScrollRight && (
          <button
            onClick={() => scrollByOne("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-[#fff0f4] text-black p-3 rounded-full shadow-lg"
          >
            ›
          </button>
        )}

        {/* SCROLL STRIP */}
        <div
          ref={containerRef}
          className="flex gap-6 overflow-x-auto px-6 lg:px-12 scrollbar-hide scroll-smooth"
        >
          {reviews.map((review, idx) => (
            <div
              key={idx}
              data-card
              className="flex-shrink-0 w-[75%] sm:w-[42%] lg:w-[26%]"
            >
              <div className="h-full rounded-2xl bg-[#fff0f4] p-6 shadow-lg flex flex-col justify-between">

                <p className="text-black text-sm sm:text-base leading-relaxed mb-6">
                  “{review.text}”
                </p>

                <div className="text-right">
                  <span className="text-black font-semibold text-sm">
                    — {review.name}
                  </span>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
