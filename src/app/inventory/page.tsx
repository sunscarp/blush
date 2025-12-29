
"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import InventoryTable from "./InventoryTable";

export default function InventoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin(user);
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/sign-in");
    }
  }, [user, authLoading, router]);

  React.useEffect(() => {
    if (!authLoading && !adminLoading && user && !isAdmin) {
      router.replace("/");
    }
  }, [user, authLoading, adminLoading, isAdmin, router]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-semibold text-black">
        Loading...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // Will be redirected
  }

  return (
    <div className="px-4 py-10 md:px-10 md:py-14 text-black flex justify-center">
      <main className="w-full max-w-5xl">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold">Inventory</h1>
              <p className="text-sm text-gray-600 mt-1">Admin inventory view — the table is mounted below.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/order-management"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Manage Orders
              </Link>
              <button
                onClick={() => router.back()}
                className="px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        </header>

        <section>
          <InventoryTable />
        </section>
      </main>
    </div>
  );
}
