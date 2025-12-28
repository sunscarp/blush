"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReviewCarousel from "@/components/ReviewCarousel";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

type Product = {
  ID: number;
  Description: string;
  Product: string;
  Price: number;
  Material?: string;
  ImageUrl1?: string;
  ImageUrl2?: string;
  ImageUrl3?: string;
  StockS?: number;
  StockM?: number;
  StockL?: number;
  StockXL?: number;
};

export default function ProductPage() {
  const { description } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("M");
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [showAdded, setShowAdded] = useState(false);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!description || !db) return;

      const q = query(
        collection(db!, "inventory"),
        where("Description", "==", decodeURIComponent(description as string))
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        setProduct(snap.docs[0].data() as Product);
      }

      setLoading(false);
    };

    fetchProduct();
  }, [description]);

  // Reset quantity when size changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedSize]);

  // Fetch cart quantity for this product and size
  useEffect(() => {
    const fetchCartQuantity = async () => {
      if (!user?.email || !db || !product) return;

      const cartRef = collection(db!, "Cart");
      const q = query(
        cartRef,
        where("UserMail", "==", user.email),
        where("ID", "==", product.ID),
        where("Size", "==", selectedSize)
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        const cartItem = snap.docs[0].data();
        setCartQuantity(cartItem.Quantity || 0);
      } else {
        setCartQuantity(0);
      }
    };

    fetchCartQuantity();
  }, [user?.email, product, selectedSize]);

  // Fetch related products
  useEffect(() => {
    if (!product || !db) return;

    const fetchRelated = async () => {
      const q = query(
        collection(db!, "inventory"),
        where("Product", "==", product.Product)
      );

      const snap = await getDocs(q);

      const others = snap.docs
        .map((d) => d.data() as Product)
        .filter((p) => p.Description !== product.Description);

      const shuffled = others.sort(() => 0.5 - Math.random());
      setRelatedProducts(shuffled.slice(0, 4));
    };

    fetchRelated();
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white font-bold bg-black">
        Loading product...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white font-bold bg-black">
        Product not found
      </div>
    );
  }

  const images = [
    product.ImageUrl1 || "/placeholder.png",
    product.ImageUrl2,
    product.ImageUrl3,
  ].filter(Boolean) as string[];

  // Get available stock for selected size (accounting for items already in cart)
  const getAvailableStock = () => {
    const totalStock = (() => {
      switch (selectedSize) {
        case "S":
          return product.StockS || 0;
        case "M":
          return product.StockM || 0;
        case "L":
          return product.StockL || 0;
        case "XL":
          return product.StockXL || 0;
        default:
          return 0;
      }
    })();
    return Math.max(0, totalStock - cartQuantity);
  };

  const availableStock = getAvailableStock();

  const nextImage = () => setImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const handleAddToCart = async () => {
    // Check stock availability
    if (availableStock === 0) {
      alert("This size is out of stock");
      return;
    }

    if (quantity > availableStock) {
      alert(`Only ${availableStock} items available in size ${selectedSize}`);
      return;
    }

    if (!user?.email || !db) {
      sessionStorage.setItem(
        "postAuthAction",
        JSON.stringify({
          type: "ADD_TO_CART",
          payload: {
            productId: product.ID,
            quantity,
            size: selectedSize,
          },
          redirectTo: "/cart",
        })
      );

      router.push("/sign-in");
      return;
    }

    const cartRef = collection(db!, "Cart");

    const q = query(
      cartRef,
      where("UserMail", "==", user.email),
      where("ID", "==", product.ID),
      where("Size", "==", selectedSize)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      const docRef = snap.docs[0].ref;
      const prevQty = snap.docs[0].data().Quantity || 0;

      await updateDoc(docRef, {
        Quantity: prevQty + quantity,
        ["Added On"]: serverTimestamp(),
      });
    } else {
      await addDoc(cartRef, {
        ID: product.ID,
        Quantity: quantity,
        Size: selectedSize,
        UserMail: user.email,
        ["Added On"]: serverTimestamp(),
      });
    }

    for (let i = 0; i < quantity; i++) {
      addItem(String(product.ID));
    }

    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);
  };

  return (
    <>
      {/* MAIN PRODUCT SECTION */}
      <div className="min-h-screen bg-white text-black px-4 sm:px-8 lg:px-12 pt-6 pb-20">
        <button
          onClick={() => router.back()}
          className="mb-6 font-semibold hover:underline"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* IMAGE SECTION */}
          <div>
            <div className="relative bg-gray-50 border rounded-xl p-4 sm:p-6">
              <img
                src={images[imageIndex] || "/placeholder.png"}
                alt={product.Description}
                className="w-full h-[300px] sm:h-[420px] lg:h-[520px] object-contain cursor-zoom-in"
                onClick={() => setZoomImage(images[imageIndex] || "/placeholder.png")}
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black text-white px-3 py-2 rounded-full"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white px-3 py-2 rounded-full"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* THUMBNAILS */}
            <div className="flex gap-3 mt-4 overflow-x-auto">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img || "/placeholder.png"}
                  onClick={() => setImageIndex(i)}
                  className={`h-20 w-20 sm:h-24 sm:w-24 object-contain rounded cursor-pointer border-2 ${
                    i === imageIndex ? "border-black" : "border-transparent"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* DETAILS */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-2">
              {product.Description}
            </h1>

            <p className="text-gray-400 mb-6">{product.Product}</p>

            <p className="text-2xl sm:text-3xl font-semibold mb-6">
              ₹{product.Price}
            </p>

            <p className="mb-4">
              <span className="font-semibold">Material:</span>{" "}
              {product.Material ?? "Premium Fabric"}
            </p>

            {/* QUANTITY */}
            <div className="mb-6">
              <p className="font-semibold mb-2">Quantity:</p>
              {availableStock === 0 && (
                <p className="text-sm text-red-500 mb-2">
                  Out of stock in size {selectedSize}
                </p>
              )}
              <div className="flex items-center gap-4 flex-wrap border rounded-full w-fit px-6 py-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-xl font-bold"
                  disabled={availableStock === 0}
                >
                  −
                </button>
                <span className="font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                  className="text-xl font-bold"
                  disabled={availableStock === 0 || quantity >= availableStock}
                >
                  +
                </button>
              </div>
            </div>

            {/* SIZE */}
            <div className="mb-6">
              <p className="font-semibold mb-2">Size:</p>
              {/* View Size Chart removed */}
              <div className="flex gap-3 flex-wrap">
                {["S", "M", "L", "XL"].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded border font-semibold ${
                      selectedSize === size
                        ? "bg-black text-white"
                        : "border-black text-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={availableStock === 0}
              className={`w-full py-4 rounded-xl font-semibold mb-4 ${
                availableStock === 0
                  ? "bg-gray-400 cursor-not-allowed text-gray-600"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {availableStock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
            {showAdded && (
              <div className="text-green-600 text-center font-semibold mb-4">
                Added to Cart!
              </div>
            )}

            <button
              onClick={() => {
                // Check stock availability
                if (availableStock === 0) {
                  alert("This size is out of stock");
                  return;
                }

                if (quantity > availableStock) {
                  alert(`Only ${availableStock} items available in size ${selectedSize}`);
                  return;
                }

                if (!user?.email) {
                  sessionStorage.setItem(
                    "postAuthAction",
                    JSON.stringify({
                      type: "BUY_NOW",
                      payload: {
                        productId: product.ID,
                        quantity,
                        size: selectedSize,
                      },
                      redirectTo: "/checkout",
                    })
                  );

                  router.push("/sign-in");
                  return;
                }

                sessionStorage.setItem(
                  "buyNowItem",
                  JSON.stringify({
                    productId: product.ID,
                    quantity,
                    size: selectedSize,
                  })
                );

                router.push("/checkout");
              }}
              disabled={availableStock === 0}
              className={`w-full py-4 rounded-xl font-semibold ${
                availableStock === 0
                  ? "bg-gray-400 cursor-not-allowed text-gray-600"
                  : "bg-indigo-500 hover:bg-indigo-600 text-white"
              }`}
            >
              {availableStock === 0 ? "Out of Stock" : "Buy Now"}
            </button>
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="relative z-10 bg-white text-black px-4 sm:px-8 lg:px-12 py-24">
          <h2 className="text-2xl font-semibold mb-6">Related Products</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rp) => (
              <div
                key={rp.ID}
                onClick={() =>
                  router.push(
                    `/product/${encodeURIComponent(rp.Description)}`
                  )
                }
                className="cursor-pointer bg-gray-50 border rounded-xl p-4 text-black hover:scale-105 transition"
              >
                <img
                  src={rp.ImageUrl1 || "/placeholder.png"}
                  alt={rp.Description}
                  className="h-36 sm:h-44 lg:h-48 w-full object-contain mb-3"
                />
                <p className="font-semibold text-sm">{rp.Description}</p>
                <p className="font-bold mt-1">₹{rp.Price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {showSizeChart && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4"
          onClick={() => setShowSizeChart(false)}
        >
          <div
            className="relative bg-white rounded-lg max-w-2xl w-full p-4"
            onClick={(e) => e.stopPropagation()} // prevents closing when clicking image
          >
            {/* Close button */}
            <button
              onClick={() => setShowSizeChart(false)}
              className="absolute top-3 right-3 text-black text-xl font-bold"
            >
              ✕
            </button>

            <img
              src="/printrove-size-chart.jpg"
              alt="Printrove Size Chart"
              className="w-full h-auto rounded"
            />
          </div>
        </div>
      )}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 text-white text-2xl font-bold"
            >
              ✕
            </button>

            <img
              src={zoomImage || "/placeholder.png"}
              alt="Zoomed product"
              className="w-full max-h-[90vh] object-contain cursor-zoom-out"
            />
          </div>
        </div>
      )}

      <ReviewCarousel />
    </>
  );
}
