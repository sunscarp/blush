"use client";

import { useRef } from "react";
import Navbar from "@/components/Navbar";
import CategorySection from "@/components/CategorySection";

export default function Home() {
  const seasonRef = useRef<HTMLDivElement>(null);
  const wcRef = useRef<HTMLDivElement>(null);
  const retroRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Navbar
        onCategoryClick={cat => {
          if (cat === "season") seasonRef.current?.scrollIntoView({ behavior: "smooth" });
          if (cat === "worldcup") wcRef.current?.scrollIntoView({ behavior: "smooth" });
          if (cat === "retro") retroRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <main className="px-10 pt-32 space-y-24">
        <CategorySection ref={seasonRef} title="Season 25/26" prefix="S" />
        <CategorySection ref={wcRef} title="World Cup Jerseys" prefix="W" />
        <CategorySection ref={retroRef} title="Retro Kits" prefix="R" />
      </main>

      <footer className="mt-32 py-6 text-center font-bold border-t">
        © 2025 Ballerz. All rights reserved.
      </footer>
    </>
  );
}
