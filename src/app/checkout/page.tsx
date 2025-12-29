
"use client";
import React, { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  doc as firestoreDoc,
  updateDoc,
} from "firebase/firestore";

// Types
type CartItem = {
  docId?: string;
  ID: number | string;
  Quantity: number;
  Size?: string;
  UserMail?: string;
  AddedOn?: any;
  isCustomized?: boolean;
  customizationText?: string;
  customPrice?: number;
};

type CustomerDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
  pinCode: string;
  stateCity: string;
};

type OrderStatus = "checkout" | "processing" | "success" | "failed";

// Helper functions
function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match('(^|;)\\s*' + name + "=([^;]+)");
  return match ? decodeURIComponent(match[2]) : null;
}

const formatCurrency = (n: number) => {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  } catch (e) {
    return `₹${n}`;
  }
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

function CheckoutContent() {
  const { user, loading } = useAuth();
  const { cart, removeItem } = useCart();
  const router = useRouter();
  
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [inventoryMap, setInventoryMap] = useState<Record<string, any>>({});
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("checkout");
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: "",
    email: user?.email || "",
    phone: "",
    address: "",
    pinCode: "",
    stateCity: "",
  });
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showCustomFor, setShowCustomFor] = useState<Record<string, boolean>>({});
  const [discountCode, setDiscountCode] = useState("");
  const [discountCodeStatus, setDiscountCodeStatus] = useState<"idle"|"valid"|"invalid"|"checking">("idle");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const searchParams = useSearchParams();
  const buyNowParam = searchParams.get("buyNow");
  const [isBuyNow, setIsBuyNow] = useState(false);
  const emailInitializedRef = useRef(false);
  useEffect(() => {
  if(loading) return;
    const raw = sessionStorage.getItem("postAuthAction");
  if (!raw) return;

  const action = JSON.parse(raw);
  if (action.type !== "BUY_NOW") return;

  sessionStorage.setItem(
    "buyNowItem",
    JSON.stringify(action.payload)
  );

  sessionStorage.removeItem("postAuthAction");
}, [loading]);



  // Auto-fill email when user is available
  useEffect(() => {
    if (user?.email && !emailInitializedRef.current) {
      setCustomerDetails(prev => ({ ...prev, email: user.email || "" }));
      emailInitializedRef.current = true;
    }
  }, [user]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch cart items
  useEffect(() => {
    let unsub: (() => void) | undefined;
    setItems([]);
    setLoadingItems(true);
    const storedBuyNow = sessionStorage.getItem("buyNowItem");
if (storedBuyNow) {
  try {
    const parsed = JSON.parse(storedBuyNow);
    setItems([
      {
        ID: parsed.productId,
        Quantity: parsed.quantity,
        Size: parsed.size,
      },
    ]);
    setIsBuyNow(true);
  } catch (e) {
    console.error("Invalid buyNowItem:", e);
  }
  setLoadingItems(false);
  return () => {};
}

    // If a buyNow parameter is present, use that single item for checkout
    if (buyNowParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(buyNowParam));
        // Ensure shape matches CartItem
        const single: CartItem = {
          ID: parsed.ID,
          Quantity: parsed.Quantity || 1,
          Size: parsed.Size,
          ...(parsed.isCustomized && {
            isCustomized: true,
            customizationText: parsed.customizationText,
            customPrice: parsed.customPrice || 0
          })
        };
        setItems([single]);
        setIsBuyNow(true);
      } catch (e) {
        console.error("Invalid buyNow param:", e);
        setItems([]);
        setIsBuyNow(false);
      }
      setLoadingItems(false);
      return () => {};
    }

    setIsBuyNow(false);

    if (user && user.email) {
      const colRef = collection(db!, "Cart");
      const q = query(colRef, where("UserMail", "==", user.email));
      unsub = onSnapshot(q, (snap) => {
        const rows: CartItem[] = snap.docs.map((d) => ({ docId: d.id, ...(d.data() as any) }));
        setItems(rows);
        setLoadingItems(false);
      }, (e) => {
        console.error("Cart read error:", e);
        setLoadingItems(false);
      });
    } else {
      // guest: read from cookie
      const raw = readCookie("guest_cart");
      try {
        const parsed = raw ? JSON.parse(raw) : [];
        setItems(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setItems([]);
      }
      setLoadingItems(false);
    }

    return () => unsub && unsub();
  }, [user, buyNowParam]);

  // Fetch inventory details for cart items
  useEffect(() => {
    if (!items || items.length === 0) {
      setInventoryMap({});
      return;
    }

    const ids = items.map((it) => it.ID).filter(Boolean);
    const chunks: any[] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

    async function fetchChunks() {
      const map: Record<string, any> = {};
      for (const chunk of chunks) {
        try {
          const q = query(collection(db!, "inventory"), where("ID", "in", chunk));
          const snap = await getDocs(q);
          snap.docs.forEach((d) => {
            const data = d.data();
            const key = String(data?.ID ?? d.id);
            map[key] = { ...data, _docId: d.id };
          });
        } catch (e) {
          try {
            const allSnap = await getDocs(collection(db!, "inventory"));
            allSnap.docs.forEach((d) => {
              const data = d.data();
              const key = String(data?.ID ?? d.id);
              if (ids.map(String).includes(key)) map[key] = { ...data, _docId: d.id };
            });
          } catch (err) {
            console.error("Failed fetching inventory details:", err);
          }
        }
      }
      setInventoryMap(map);
    }

    fetchChunks();
  }, [items]);

  const grandTotal = items.reduce((sum, it) => {
    const basePrice = inventoryMap[String(it.ID)]?.Price != null ? Number(inventoryMap[String(it.ID)].Price) : 0;
    const customPrice = it.isCustomized && it.customPrice ? Number(it.customPrice) : 0;
    const totalPrice = basePrice + customPrice;
    const qty = Number(it.Quantity || 0);
    return sum + (isNaN(totalPrice) ? 0 : totalPrice * qty);
  }, 0);

  const discountAmount = discountCodeStatus === "valid" && discountPercent > 0 ? Math.round(grandTotal * (discountPercent / 100)) : 0;
  const discountedTotal = grandTotal - discountAmount;

  const handleInputChange = (field: keyof CustomerDetails, value: string) => {
    if (field === "phone") {
      // Only allow digits, max 10
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    if (field === "pinCode") {
      // Only allow digits, max 6
      value = value.replace(/\D/g, "").slice(0, 6);
    }
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return customerDetails.name.trim() && 
           customerDetails.email.trim() && 
           customerDetails.phone.trim() && 
           customerDetails.address.trim() &&
           customerDetails.pinCode.trim() &&
           customerDetails.stateCity.trim() &&
           items.length > 0;
  };

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      alert("Payment system is loading, please try again.");
      return;
    }

    if (!isFormValid()) {
      alert("Please fill all required fields.");
      return;
    }

    // Final stock validation before placing order
    const stockIssues: string[] = [];
    items.forEach((item) => {
      const prod: any = inventoryMap[String(item.ID)];
      if (!prod) return;

      const qty = Number(item.Quantity || 0);
      if (!qty || qty <= 0) return;

      let sizeStock: number | undefined;
      const size = (item.Size || "").toUpperCase();
      if (size === "S") sizeStock = prod.StockS;
      else if (size === "M") sizeStock = prod.StockM;
      else if (size === "L") sizeStock = prod.StockL;
      else if (size === "XL") sizeStock = prod.StockXL;

      const maxAllowed =
        (typeof sizeStock === "number" ? sizeStock : undefined) ??
        (typeof prod.Stock === "number" ? prod.Stock : undefined);

      if (typeof maxAllowed === "number" && qty > maxAllowed) {
        const label = prod.ProductName || prod.Description || prod.Product || `Item ${item.ID}`;
        stockIssues.push(`${label} (${size || ""}) - only ${maxAllowed} left`);
      }
    });

    if (stockIssues.length > 0) {
      alert(
        "Some items are out of stock or exceed available quantity. Please adjust your cart:\n\n" +
          stockIssues.join("\n")
      );
      return;
    }

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      alert("Payment setup issue: Razorpay key is not configured. Please contact support.");
      return;
    }

    setOrderStatus("processing");

    const orderData = {
      items: items.map(item => ({
        ID: item.ID,
        Quantity: item.Quantity,
        Size: item.Size,
        product: inventoryMap[String(item.ID)],
        ...(item.isCustomized && {
          isCustomized: true,
          customizationText: item.customizationText,
          customPrice: item.customPrice || 0
        })
      })),
      // Store the typed checkout email under customer
      customer: customerDetails,
      total: discountedTotal,
      discountCode: discountCodeStatus === "valid" ? discountCode : "",
      discountPercent: discountCodeStatus === "valid" ? discountPercent : 0,
      discountAmount: discountCodeStatus === "valid" ? discountAmount : 0,
      createdAt: new Date().toISOString(),
      userId: user?.uid || null,
      // Always store the signed-in user's email under userEmail
      userEmail: user?.email || null,
      // Tracking ID is assigned later from the admin panel
      trackingId: "",
    };

    const options = {
      key: razorpayKeyId, // Your Razorpay Key ID
      amount: discountedTotal * 100, // Amount in paise (multiply by 100)
      currency: "INR",
      name: "Ballerz",
      description: `Order for ${items.length} items`,
      handler: async function (response: any) {
        try {
          // Payment successful - save order to Firebase
          const finalOrderData = {
            ...orderData,
            paymentId: response.razorpay_payment_id,
            status: "placed",
            createdAt: serverTimestamp(),
          };

          const orderRef = await addDoc(collection(db!, "Orders"), finalOrderData);
          setOrderDetails({ ...finalOrderData, orderId: orderRef.id });
          setOrderStatus("success");

          // Decrease stock for each ordered item based on size
          try {
            const sizeFieldMap: Record<string, string> = {
              S: "StockS",
              M: "StockM",
              L: "StockL",
              XL: "StockXL",
            };

            await Promise.all(
              items.map(async (item) => {
                const prod: any = inventoryMap[String(item.ID)];
                if (!prod?._docId) return;

                const qty = Number(item.Quantity || 0);
                if (!qty || qty <= 0) return;

                const updates: Record<string, number> = {};

                // Decrement size-specific stock
                if (item.Size) {
                  const sizeKey = sizeFieldMap[String(item.Size).toUpperCase()];
                  if (sizeKey && typeof prod[sizeKey] === "number") {
                    const current = Number(prod[sizeKey] || 0);
                    updates[sizeKey] = Math.max(0, current - qty);
                  }
                }

                // Decrement overall stock if present
                if (typeof prod.Stock === "number") {
                  const currentTotal = Number(prod.Stock || 0);
                  updates.Stock = Math.max(0, currentTotal - qty);
                }

                if (Object.keys(updates).length === 0) return;

                await updateDoc(firestoreDoc(db!, "inventory", prod._docId), updates);
              })
            );
          } catch (stockErr) {
            console.error("Failed to update inventory stock after order:", stockErr);
          }

          // Clear cart after successful order only when this was a regular cart checkout.
          // For buy-now single-item purchases we do not clear the user's cart.
          if (!isBuyNow) {
            if (user && user.email) {
              // Clear Firestore cart items for logged-in users
              try {
                const cartItemsToDelete = items.filter(item => item.docId);
                await Promise.all(
                  cartItemsToDelete.map(item => 
                    deleteDoc(firestoreDoc(db!, "Cart", item.docId!))
                  )
                );

                // Clear cart context for UI updates
                Object.keys(cart).forEach((id) => {
                  const totalCount = cart[id] || 0;
                  for (let i = 0; i < totalCount; i++) {
                    removeItem(id);
                  }
                });
              } catch (error) {
                console.error("Error clearing user cart:", error);
              }
            } else {
              // Clear guest cart
              document.cookie = "guest_cart=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";

              // Clear cart context for UI updates
              Object.keys(cart).forEach((id) => {
                const totalCount = cart[id] || 0;
                for (let i = 0; i < totalCount; i++) {
                  removeItem(id);
                }
              });
            }
          }
          if (isBuyNow) {
  sessionStorage.removeItem("buyNowItem");
}

          // Fire-and-forget: send pink-themed invoice email to customer
          try {
            const safeOrderForEmail = {
              id: orderRef.id,
              status: "placed",
              total: discountedTotal,
              customer: customerDetails,
              items: orderData.items,
              createdAt: new Date().toISOString(),
            };

            fetch("/api/send-invoice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order: safeOrderForEmail,
                orderId: orderRef.id,
                sendTo: customerDetails.email,
              }),
            }).catch((err) => {
              console.error("Failed to trigger invoice email:", err);
            });
          } catch (emailErr) {
            console.error("Error preparing invoice email:", emailErr);
          }
        } catch (error) {
          console.error("Error saving order:", error);
          setOrderStatus("failed");
        }
      },
      modal: {
        ondismiss: function() {
          setOrderStatus("failed");
        }
      },
      prefill: {
        name: customerDetails.name,
        email: customerDetails.email,
        contact: customerDetails.phone,
      },
      theme: {
        color: "#4F46E5",
      },
    };

    try {
      if (!window.Razorpay) {
        console.error("Razorpay script not loaded or window.Razorpay is undefined");
        alert("Payment system failed to load. Please refresh the page and try again.");
        setOrderStatus("failed");
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response);
        setOrderStatus("failed");
      });
      rzp.open();
    } catch (error) {
      console.error("Error opening Razorpay:", error);
      setOrderStatus("failed");
    }
  };

  if (loading || loadingItems) {
    return (
      <div className="min-h-screen flex items-center justify-center text-black px-4">
        <div className="text-center bg-white/90 border border-gray-200 rounded-2xl shadow px-6 py-8 max-w-md w-full">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-500 mx-auto mb-4"></div>
          </div>
          <h2 className="text-xl font-semibold text-black mb-2">Loading Checkout</h2>
          <p className="text-gray-600 text-sm">Please wait while we prepare your order...</p>
        </div>
      </div>
    );
  }

  if (orderStatus === "success") {
    return (
      <div className="px-4 py-10 md:px-10 md:py-14 flex justify-center text-black">
        <div className="bg-white/90 border border-gray-200 p-8 lg:p-10 rounded-2xl shadow max-w-md w-full text-center space-y-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-black">Order Confirmed</h1>

          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-gray-300 flex items-center justify-center">
              <svg
                className="w-9 h-9 text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-base font-semibold text-black">
              Order #{orderDetails?.orderId}
            </p>
          </div>

          <p className="text-sm text-gray-500 border-t border-b border-gray-200 py-4">
            We&apos;ll send a confirmation to your email soon.
          </p>

          <div className="space-y-3">
            <p className="text-sm text-gray-700">Need help? Chat with us on WhatsApp</p>
            <div className="mx-auto max-w-xs flex items-center gap-3 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 bg-gray-50">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold">
                W
              </span>
              <span className="truncate text-left">+91 8087847122</span>
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-4 w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (orderStatus === "failed") {
    return (
      <div className="px-4 py-10 md:px-10 md:py-14 flex justify-center text-black">
        <div className="bg-white/90 border border-gray-200 p-8 lg:p-12 rounded-2xl shadow text-center max-w-md w-full">
          <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-black mb-4">Payment Failed</h1>
          <p className="text-gray-600 mb-8 text-sm lg:text-base">
            Your payment could not be processed. Please try again or contact support for assistance.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition-all duration-200 transform hover:scale-105"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/")}
              className="bg-gray-200 text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 transform hover:scale-105"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-10 md:px-10 md:py-14 flex justify-center text-black">
        <div className="text-center bg-white/90 border border-gray-200 rounded-2xl shadow px-8 py-10 max-w-md w-full">
          <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-black mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto text-sm lg:text-base">
            Looks like you haven't added any items to your cart yet. Start shopping to see your items here.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-900 transition-all duration-200 transform hover:scale-105"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-10 md:px-10 md:py-14 text-black flex justify-center">
      <div className="w-full max-w-md bg-white/90 border border-gray-200 rounded-xl shadow-sm px-4 py-6">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Checkout</h1>
          <span className="text-xs text-gray-500">
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        </header>

        {/* Shipping Details */}
        <section className="border rounded-lg mb-6">
          <div className="px-4 py-3 border-b text-sm font-semibold tracking-wide uppercase text-gray-700">
            Shipping Details
          </div>
          <div className="px-4 py-4 space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={customerDetails.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm placeholder-gray-400"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={customerDetails.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm placeholder-gray-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone
              </label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-xs text-gray-700 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  value={customerDetails.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm placeholder-gray-400"
                  placeholder="10 digit mobile number"
                  maxLength={10}
                  pattern="[0-9]{10}"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={customerDetails.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm placeholder-gray-400 resize-none"
                rows={2}
                placeholder="Street, area, city"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={customerDetails.pinCode}
                  onChange={(e) => handleInputChange("pinCode", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm placeholder-gray-400"
                  placeholder="6 digit PIN"
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  State / City
                </label>
                <input
                  type="text"
                  value={customerDetails.stateCity}
                  onChange={(e) => handleInputChange("stateCity", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm placeholder-gray-400"
                  placeholder="State / City"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Order Summary */}
        <section className="border rounded-lg mb-6">
          <div className="px-4 py-3 border-b text-sm font-semibold tracking-wide uppercase text-gray-700">
            Order Summary
          </div>
          <div className="px-4 py-3 text-sm">
            <ul className="divide-y divide-gray-200 mb-3">
              {items.map((item) => {
                const key = String(item.ID);
                const prod = inventoryMap[key];
                const basePrice = prod?.Price != null ? Number(prod.Price) : 0;
                const customPrice = item.isCustomized && item.customPrice ? Number(item.customPrice) : 0;
                const linePrice = (basePrice + customPrice) * Number(item.Quantity || 0);

                return (
                  <li
                    key={String(item.docId ?? item.ID)}
                    className="py-2 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        • {prod?.ProductName ?? prod?.Description ?? ""}
                        {item.Quantity > 1 ? `× ${item.Quantity}` : ""}
                      </p>
                      {item.Size && (
                        <p className="text-xs text-gray-500">Size: {item.Size}</p>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(linePrice)}
                    </div>
                  </li>
                );
              })}
            </ul>

            <hr className="mb-2" />
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(grandTotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="text-gray-600">Discount ({discountPercent}%)</span>
                <span className="text-green-600 font-medium">- {formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">Free</span>
            </div>
            <hr className="my-2" />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>
                {formatCurrency(discountAmount > 0 ? discountedTotal : grandTotal)}
              </span>
            </div>
          </div>
        </section>

        {/* Place Order Button */}
        <button
          onClick={handlePayment}
          disabled={!isFormValid() || orderStatus === "processing" || !razorpayLoaded}
          className={`w-full py-3 rounded-md text-sm font-semibold tracking-wide transition-colors ${
            isFormValid() && razorpayLoaded && orderStatus !== "processing"
              ? "bg-black text-white hover:bg-gray-900"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {orderStatus === "processing"
            ? "Processing..."
            : `Place Order • ${formatCurrency(discountAmount > 0 ? discountedTotal : grandTotal)}`}
        </button>

        {!razorpayLoaded && (
          <p className="text-[11px] text-gray-500 mt-2 text-center">
            Initializing secure payment...
          </p>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-black">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}





