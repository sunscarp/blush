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
};

export default function ProductPage() {
  const { description } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState("M");
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1); // ✅ NEW
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  // 🔥 Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!description) return;

      const q = query(
        collection(db, "inventory"),
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

  useEffect(() => {
  if (!product) return;

  const fetchRelated = async () => {
    const q = query(
      collection(db, "inventory"),
      where("Product", "==", product.Product)
    );

    const snap = await getDocs(q);

    const others = snap.docs
      .map(d => d.data() as Product)
      .filter(p => p.Description !== product.Description);

    // shuffle and pick 4
    const shuffled = others.sort(() => 0.5 - Math.random());
    setRelatedProducts(shuffled.slice(0, 4));
  };

  fetchRelated();
}, [product]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white font-bold">
        Loading product...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white font-bold">
        Product not found
      </div>
    );
  }

  const images = [
    product.ImageUrl1,
    product.ImageUrl2,
    product.ImageUrl3,
  ].filter(Boolean) as string[];

  const nextImage = () =>
    setImageIndex((prev) => (prev + 1) % images.length);

  const prevImage = () =>
    setImageIndex((prev) => (prev - 1 + images.length) % images.length);

  // 🛒 Add to cart with quantity
  const handleAddToCart = async () => {
    if (!user?.email) {
      router.push("/sign-in");
      return;
    }

    const cartRef = collection(db, "Cart");

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

    // Update cart badge
    for (let i = 0; i < quantity; i++) {
      addItem(String(product.ID));
    }
  };

  return (
    <>
      <div className="min-h-screen bg-black text-white px-12 pt-8 pb-20">
        <button
          onClick={() => router.back()}
          className="mb-6 font-semibold hover:underline"
        >
          ← Back
        </button>

        <div className="grid grid-cols-2 gap-16">
          {/* IMAGE SECTION */}
          <div>
            <div className="relative bg-white rounded-xl p-6">
              <img
                src={images[imageIndex]}
                alt={product.Description}
                className="w-full h-[520px] object-contain"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black text-white px-3 py-2 rounded-full"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black text-white px-3 py-2 rounded-full"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* THUMBNAILS */}
            <div className="flex gap-4 mt-4">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  onClick={() => setImageIndex(i)}
                  className={`h-24 w-24 object-contain rounded cursor-pointer border-2 ${
                    i === imageIndex ? "border-white" : "border-transparent"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* DETAILS */}
          <div>
            <h1 className="text-4xl font-semibold mb-2">
              {product.Description}
            </h1>

            <p className="text-gray-400 mb-6">{product.Product}</p>

            <p className="text-3xl font-semibold mb-6">
              ₹{product.Price}
            </p>

            <p className="mb-4">
              <span className="font-semibold">Material:</span>{" "}
              {product.Material ?? "Premium Fabric"}
            </p>

            {/* ✅ QUANTITY */}
            <div className="mb-6">
              <p className="font-semibold mb-2">Quantity:</p>
              <div className="flex items-center gap-6 border rounded-full w-fit px-6 py-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-xl font-bold"
                >
                  −
                </button>
                <span className="font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="text-xl font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* SIZE */}
            <div className="mb-6">
              <p className="font-semibold mb-2">Size:</p>
              <div className="flex gap-3">
                {["S", "M", "L", "XL"].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded border font-semibold ${
                      selectedSize === size
                        ? "bg-white text-black"
                        : "border-white text-white"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-indigo-600 hover:bg-indigo-700 py-4 rounded-xl font-semibold mb-4"
            >
              Add to Cart
            </button>

            <button
              onClick={() => {
                handleAddToCart();
                router.push("/checkout");
              }}
              className="w-full bg-indigo-500 hover:bg-indigo-600 py-4 rounded-xl font-semibold"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
      {/* RELATED PRODUCTS */}
{relatedProducts.length > 0 && (
  <div className="mt-24">
    <h2 className="text-2xl font-semibold mb-6">Related Products</h2>

    <div className="grid grid-cols-4 gap-6">
      {relatedProducts.map((rp) => (
        <div
          key={rp.ID}
          onClick={() =>
            router.push(`/product/${encodeURIComponent(rp.Description)}`)
          }
          className="cursor-pointer bg-white rounded-xl p-4 text-black hover:scale-105 transition"
        >
          <img
            src={rp.ImageUrl1}
            alt={rp.Description}
            className="h-48 w-full object-contain mb-3"
          />
          <p className="font-semibold text-sm">{rp.Description}</p>
          <p className="font-bold mt-1">₹{rp.Price}</p>
        </div>
      ))}
    </div>
  </div>
)}

      <ReviewCarousel />
    </>
  );
}
