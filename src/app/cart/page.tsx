"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc as firestoreDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  readGuestCartFromCookie,
  writeGuestCartToCookie,
} from "@/context/CartContext";

type CartItem = {
  docId?: string;
  ID: number | string;
  Quantity: number;
  Size?: string;
  UserMail?: string;
  AddedOn?: string;
  isCustomized?: boolean;
  customizationText?: string;
  customPrice?: number;
};

type InventoryItem = {
  ID: number | string;
  Description?: string;
  Product?: string;
  ProductName?: string;
  ImageUrl1?: string;
  ImageUrl2?: string;
  ImageUrl3?: string;
  Price?: number | string;
   Stock?: number;
   StockS?: number;
   StockM?: number;
   StockL?: number;
   StockXL?: number;
  _docId?: string;
};

function formatCurrency(n: number | string | undefined) {
  const num = Number(n || 0);
  if (!isFinite(num)) return "";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `₹${num}`;
  }
}

export default function CartPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const postAuthHandled = useRef(false);

  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [inventoryMap, setInventoryMap] = useState<Record<string, InventoryItem>>({});

  // Handle deferred add-to-cart after login
  useEffect(() => {
    if (loading) return;
    if (!user?.email) return;
    if (postAuthHandled.current) return;

    const raw =
      typeof window !== "undefined"
        ? sessionStorage.getItem("postAuthAction")
        : null;
    if (!raw) return;

    const action = JSON.parse(raw);
    if (action.type !== "ADD_TO_CART") return;

    postAuthHandled.current = true;

    const addAfterAuth = async () => {
      if (!db) return;
      const cartRef = collection(db, "Cart");

      const q = query(
        cartRef,
        where("UserMail", "==", user.email),
        where("ID", "==", action.payload.productId),
        where("Size", "==", action.payload.size)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const ref = snap.docs[0].ref;
        const prevQty = (snap.docs[0].data() as any).Quantity || 0;

        await updateDoc(ref, {
          Quantity: prevQty + action.payload.quantity,
        });
      } else {
        await addDoc(cartRef, {
          ID: action.payload.productId,
          Quantity: action.payload.quantity,
          Size: action.payload.size,
          UserMail: user.email,
        });
      }

      sessionStorage.removeItem("postAuthAction");
    };

    addAfterAuth();
  }, [user, loading]);

  // Load cart items from Firestore (logged-in) or cookie (guest)
  useEffect(() => {
    let unsub: (() => void) | undefined;
    setLoadingItems(true);

    if (user && user.email && db) {
      const colRef = collection(db, "Cart");
      const q = query(colRef, where("UserMail", "==", user.email));
      unsub = onSnapshot(
        q,
        (snap) => {
          const rows: CartItem[] = snap.docs.map((d) => ({
            docId: d.id,
            ...(d.data() as any),
          }));
          setItems(rows);
          setLoadingItems(false);
        },
        (err) => {
          console.error("Cart onSnapshot error", err);
          setItems([]);
          setLoadingItems(false);
        }
      );
    } else {
      const guest = readGuestCartFromCookie();
      setItems(guest || []);
      setLoadingItems(false);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  // Load inventory for product details
  useEffect(() => {
    if (!db) return;

    async function loadInventory() {
      try {
        const col = collection(db, "inventory");
        const snap = await getDocs(col);
        const arr: InventoryItem[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          arr.push({ ...(data || {}), _docId: d.id });
        });

        const map: Record<string, InventoryItem> = {};
        arr.forEach((p) => {
          map[String(p.ID)] = p;
        });

        setInventoryMap(map);
      } catch (e) {
        console.error("Failed to load inventory", e);
        setInventoryMap({});
      }
    }

    loadInventory();
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.Quantity || 0), 0),
    [items]
  );

  const grandTotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const prod = inventoryMap[String(it.ID)];
      const base = prod?.Price != null ? Number(prod.Price) : 0;
      const custom =
        it.isCustomized && it.customPrice ? Number(it.customPrice) : 0;
      const qty = Number(it.Quantity || 0);
      if (!isFinite(base) || !isFinite(custom) || !isFinite(qty)) return sum;
      return sum + (base + custom) * qty;
    }, 0);
  }, [items, inventoryMap]);

  const shippingAmount = 0;
  const subtotal = grandTotal;
  const total = subtotal + shippingAmount;

  function persistGuest(next: CartItem[]) {
    writeGuestCartToCookie(next || []);
    setItems(next || []); 
  }

  async function changeQuantity(item: CartItem, delta: number) {
    const currentQty = Number(item.Quantity || 0);
    const newQty = Math.max(0, currentQty + delta);

    // If increasing, enforce stock limits based on selected size
    if (delta > 0) {
      const prod = inventoryMap[String(item.ID)];
      if (prod) {
        let sizeStock: number | undefined;
        const size = (item.Size || "").toUpperCase();
        if (size === "S") sizeStock = prod.StockS;
        else if (size === "M") sizeStock = prod.StockM;
        else if (size === "L") sizeStock = prod.StockL;
        else if (size === "XL") sizeStock = prod.StockXL;

        const maxAllowed = sizeStock ?? prod.Stock;
        if (typeof maxAllowed === "number" && newQty > maxAllowed) {
          alert("No more stock available for this size.");
          return;
        }
      }
    }

    if (user && user.email && item.docId && db) {
      try {
        if (newQty <= 0) {
          await deleteDoc(firestoreDoc(db, "Cart", item.docId));
        } else {
          await updateDoc(firestoreDoc(db, "Cart", item.docId), {
            Quantity: newQty,
          });
        }
      } catch (e) {
        console.error("changeQuantity Firestore error", e);
      }
    } else {
      const next = items
        .map((it) => (it === item ? { ...it, Quantity: newQty } : it))
        .filter((it) => it.Quantity > 0);
      persistGuest(next);
    }
  }

  async function removeItem(item: CartItem) {
    if (user && user.email && item.docId && db) {
      try {
        await deleteDoc(firestoreDoc(db, "Cart", item.docId));
      } catch (e) {
        console.error("removeItem Firestore error", e);
      }
    } else {
      const next = items.filter((it) => it !== item);
      persistGuest(next);
    }
  }

  if (loading || loadingItems) {
    return <div className="p-6">Loading cart…</div>;
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-md mx-auto px-4 py-6">
        <header className="border-b pb-3 mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Cart</h1>
          <span className="text-xs text-gray-500">
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
        </header>

        {items.length === 0 ? (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-700 mb-4">
              Your cart is empty. Start adding beautiful pieces to your bag.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center bg-black text-white px-5 py-2.5 rounded-md text-sm font-semibold hover:opacity-90"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <section className="border rounded-lg overflow-hidden mb-4">
              <div className="px-4 py-3 border-b flex items-center gap-2 text-sm font-semibold tracking-wide uppercase text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 4h2l2 12h10l2-8H7" />
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="18" cy="20" r="1.5" />
                </svg>
                <span>Cart</span>
              </div>

              <ul>
                {items.map((it) => {
                  const key = String(it.ID);
                  const prod = inventoryMap[key];
                  const img =
                    prod?.ImageUrl1 ||
                    prod?.ImageUrl2 ||
                    prod?.ImageUrl3 ||
                    "/favicon.ico";
                  const base = prod?.Price != null ? Number(prod.Price) : 0;
                  const custom =
                    it.isCustomized && it.customPrice
                      ? Number(it.customPrice)
                      : 0;
                  const totalPerItem = base + custom;
                  const lineTotal =
                    totalPerItem * Number(it.Quantity || 0);

                  return (
                    <li
                      key={String(it.docId ?? it.ID)}
                      className="px-4 py-4 border-b last:border-b-0 flex gap-3"
                    >
                      <div className="w-16 h-16 border border-gray-200 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0 bg-white">
                        <Link
                          href={`/product/${encodeURIComponent(
                            String(
                              prod?.Description || prod?.Product || key
                            )
                          )}`}
                          className="block w-full h-full relative"
                        >
                          <Image
                            src={img}
                            alt={prod?.Description ?? ""}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </Link>
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900 leading-snug">
                              {prod?.Description ?? ""}
                            </p>
                            {it.Size && (
                              <p className="text-[11px] text-gray-500">
                                Size: {it.Size}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(lineTotal)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(totalPerItem)} each
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => removeItem(it)}
                            className="inline-flex items-center px-3 py-1.5 rounded-full border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
                          >
                            Remove
                          </button>

                          <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden text-sm">
                            <button
                              type="button"
                              onClick={() => changeQuantity(it, -1)}
                              className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-800"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-gray-900 text-sm min-w-[32px] text-center">
                              {it.Quantity}
                            </span>
                            {(() => {
                              const prodForLine = inventoryMap[String(it.ID)];
                              let sizeStock: number | undefined;
                              const size = (it.Size || "").toUpperCase();
                              if (size === "S") sizeStock = prodForLine?.StockS;
                              else if (size === "M") sizeStock = prodForLine?.StockM;
                              else if (size === "L") sizeStock = prodForLine?.StockL;
                              else if (size === "XL") sizeStock = prodForLine?.StockXL;

                              const maxAllowed =
                                (typeof sizeStock === "number" ? sizeStock : undefined) ??
                                (typeof prodForLine?.Stock === "number" ? prodForLine.Stock : undefined);
                              const atMax =
                                typeof maxAllowed === "number" &&
                                Number(it.Quantity || 0) >= maxAllowed;

                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (atMax) return;
                                    changeQuantity(it, +1);
                                  }}
                                  disabled={atMax}
                                  className={`px-3 py-1 bg-white text-gray-800 ${
                                    atMax ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"
                                  }`}
                                >
                                  +
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="px-4 py-3 text-sm space-y-2">
                <hr className="mb-2" />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shippingAmount === 0
                      ? "Free"
                      : formatCurrency(shippingAmount)}
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={() => router.push("/checkout")}
              className="w-full bg-black text-white py-3 rounded-md text-sm font-semibold tracking-wide hover:opacity-95"
            >
              Proceed to Checkout
            </button>

            <div className="mt-3 text-center text-xs text-gray-500">
              <Link
                href="/shop"
                className="underline underline-offset-2 hover:text-gray-700"
              >
                Continue Shopping
              </Link>
              <span className="mx-1">|</span>
              <Link
                href="/contact-us"
                className="underline underline-offset-2 hover:text-gray-700"
              >
                View Policies
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}