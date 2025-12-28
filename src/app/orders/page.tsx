"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { generateInvoice } from "@/utils/generateInvoice";

type OrderStatus = "placed" | "shipped" | "done";

type OrderItem = {
  ID: number | string;
  Quantity: number;
  Size?: string;
  isCustomized?: boolean;
  customizationText?: string;
  customPrice?: number;
  product?: {
    Description?: string;
    Price?: number;
  };
};

type Order = {
  id: string;
  createdAt: any;
  userEmail: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    pinCode?: string;
    stateCity?: string;
  };
  total: number;
  status: OrderStatus;
  items: OrderItem[];
};

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  /* 🔐 Auth guard */
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/sign-in");
    }
  }, [user, loading, router]);

  /* 🔥 Fetch orders */
  useEffect(() => {
    // Wait for auth to finish
    if (loading) return;

    // If there is no signed-in user or no email, stop loading and show empty state
    if (!user || !user.email) {
      setOrders([]);
      setFetching(false);
      return;
    }

    if (!db) {
      setFetching(false);
      return;
    }

    const q = query(
      collection(db, "Orders"),
      where("userEmail", "==", user.email)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: Order[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));

        // Sort newest first using createdAt timestamp if available
        rows.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });
        setOrders(rows);
        setFetching(false);
      },
      () => {
        // On error, stop the loading spinner instead of hanging
        setFetching(false);
      }
    );

    return () => unsub();
  }, [user, loading]);

  /* 🛒 Buy again */
  const handleBuyAgain = async (items: OrderItem[]) => {
    if (!user?.email) return;

    const cartRef = collection(db!, "Cart");

    for (const item of items) {
      const baseData = {
        ID: item.ID,
        Quantity: item.Quantity,
        Size: item.Size || "S",
        UserMail: user.email,
        ["Added On"]: serverTimestamp(),
      };

      if (item.isCustomized) {
        await addDoc(cartRef, {
          ...baseData,
          isCustomized: true,
          customizationText: item.customizationText,
          customPrice: item.customPrice || 0,
        });
      } else {
        const q = query(
          cartRef,
          where("UserMail", "==", user.email),
          where("ID", "==", item.ID),
          where("Size", "==", item.Size || "S"),
          where("isCustomized", "==", false)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          const ref = snap.docs[0].ref;
          const prevQty = snap.docs[0].data().Quantity || 0;

          await updateDoc(ref, {
            Quantity: prevQty + item.Quantity,
            ["Added On"]: serverTimestamp(),
          });
        } else {
          await addDoc(cartRef, { ...baseData, isCustomized: false });
        }
      }

      for (let i = 0; i < item.Quantity; i++) {
        addItem(String(item.ID));
      }
    }

    router.push("/cart");
  };

  const formatDate = (ts: any) =>
    ts?.toDate
      ? ts.toDate().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

  // Extra safety: ensure we only render orders for the signed-in user's email
  const visibleOrders = user?.email
    ? orders.filter((o) => o.userEmail === user.email)
    : orders;

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white font-semibold bg-black">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-8 lg:px-12 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-8 space-y-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Your Orders
          </h1>
        </div>

        <button
          onClick={() => router.back()}
          className="font-medium hover:underline text-gray-300 w-fit"
        >
          ← Back
        </button>
      </div>

        {visibleOrders.length === 0 ? (
        <p className="text-gray-300">You have no orders yet.</p>
      ) : (
        <div className="space-y-6">
            {visibleOrders.map((order) => {
            /* ===== DISCOUNT LOGIC (ADDED) ===== */
            const normalTotal = order.items.reduce((sum, item) => {
              const base = item.product?.Price ?? 0;
              const custom = item.isCustomized ? item.customPrice ?? 0 : 0;
              return sum + (base + custom) * item.Quantity;
            }, 0);

            const discountAmount = normalTotal - order.total;
            const discountPercent =
              normalTotal > 0
                ? Math.round((discountAmount / normalTotal) * 100)
                : 0;

            return (
              <div
                key={order.id}
                className="border border-gray-600 rounded-xl p-4 sm:p-6 space-y-4"
              >
                {/* Meta */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold break-all">
                      Order ID:{" "}
                      <span className="font-mono">{order.id}</span>
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <span className="px-4 py-1 rounded-full border border-gray-500 font-medium capitalize w-fit">
                    {order.status}
                  </span>
                </div>

                {/* Customer Details */}
                {order.customer && (
                  <div className="mt-3 text-sm text-gray-300 space-y-1">
                    <p className="font-semibold text-white">Customer</p>
                    <p>
                      {order.customer.name || ""}
                      {order.customer.email || order.userEmail
                        ? ` (${order.customer.email || order.userEmail})`
                        : ""}
                    </p>
                    {order.customer.phone && <p>Phone: {order.customer.phone}</p>}
                    {order.customer.address && <p>Address: {order.customer.address}</p>}
                    {(order.customer.stateCity || order.customer.pinCode) && (
                      <p>
                        {(order.customer.stateCity || "").trim()}
                        {order.customer.stateCity && order.customer.pinCode ? " - " : ""}
                        {(order.customer.pinCode || "").trim()}
                      </p>
                    )}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item, idx) => {
                    const base = item.product?.Price ?? 0;
                    const custom = item.isCustomized ? item.customPrice ?? 0 : 0;
                    const total = (base + custom) * item.Quantity;

                    const imgSrc =
                      (item as any).product?.ImageUrl1 || "/favicon.ico";

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <div className="flex items-center gap-3 flex-1">
                            <img
                              src={imgSrc}
                              alt={item.product?.Description || "Product"}
                              className="w-12 h-12 rounded object-cover bg-gray-900 border border-gray-700"
                            />
                            <div>
                              <p className="font-medium">
                                {item.product?.Description ?? "Product"} × {item.Quantity}
                              </p>
                              <p className="text-xs text-gray-400">
                                ID: {item.ID} • Size: {item.Size || "N/A"}
                              </p>
                            </div>
                          </div>
                          <span className="whitespace-nowrap font-semibold">
                            Rs. {total}
                          </span>
                        </div>

                        {item.isCustomized && (
                          <div className="ml-3 p-2 bg-gray-900 border border-gray-700 rounded">
                            <p className="text-xs text-blue-400">
                              Customized: "{item.customizationText}"
                            </p>
                            {custom > 0 && (
                              <p className="text-xs text-blue-300">
                                +Rs. {custom} customization fee
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ===== TOTAL + DISCOUNT (ADDED) ===== */}
                <div className="space-y-1">
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-400">
                      <span>Discount ({discountPercent}%)</span>
                      <span>- Rs. {discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total</span>
                    <span>Rs. {order.total}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  <button className="px-4 py-2 border border-gray-500 rounded font-medium hover:bg-gray-800">
                    Track Order
                  </button>

                  <button
                    onClick={() => handleBuyAgain(order.items)}
                    className="px-4 py-2 border border-gray-500 rounded font-medium hover:bg-gray-800"
                  >
                    Buy Again
                  </button>

                  <button
                    onClick={() => generateInvoice(order)}
                    className="px-4 py-2 border border-gray-500 rounded font-medium hover:bg-gray-800"
                  >
                    Download Invoice
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
