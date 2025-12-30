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
  ShortTruction?: string;
  ImageUrl1?: string;
  ImageUrl2?: string;
  ImageUrl3?: string;
  StockS?: number;
  StockM?: number;
  StockL?: number;
  StockXL?: number;
  Stock?: number;
  Category?: string;
};

export default function ProductPage() {
  const { productname } = useParams();
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
  const [shareCopied, setShareCopied] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [showAdded, setShowAdded] = useState(false);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productname || !db) return;

      const q = query(
        collection(db!, "inventory"),
        where("ProductName", "==", decodeURIComponent(productname as string))
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        setProduct(snap.docs[0].data() as Product);
      }

      setLoading(false);
    };

    fetchProduct();
  }, [productname]);

  // Reset quantity when size changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedSize]);

  // Fetch cart quantity for this product and size
  useEffect(() => {
    const fetchCartQuantity = async () => {
      if (!user?.email || !db || !product) return;

      // Check if this product uses general stock (Purses, Earrings) or size-based stock
      const currentCategory = (product as any).Category || (product as any).Product || "";
      const isGeneralStockProduct = currentCategory === "Purses" || currentCategory === "Earrings" || 
                                     currentCategory.toLowerCase().includes("purse") || 
                                     currentCategory.toLowerCase().includes("earring");

      // For general stock products, use "One Size" as the size identifier
      const sizeToUse = isGeneralStockProduct ? "One Size" : selectedSize;

      const cartRef = collection(db!, "Cart");
      const q = query(
        cartRef,
        where("UserMail", "==", user.email),
        where("ID", "==", product.ID),
        where("Size", "==", sizeToUse)
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

  // Fetch cross-category recommendations (Style It With)
  useEffect(() => {
    if (!product || !db) return;

    const fetchStyleItWith = async () => {
      // Determine complementary categories based on current product
      const currentCategoryRaw = (product as any).Product ?? (product as any).Category ?? (product as any).ProductName ?? "";
      const currentCategory = typeof currentCategoryRaw === 'string' ? currentCategoryRaw : String(currentCategoryRaw || "");
      let targetCategories: string[] = [];

      // Guard: only call toLowerCase on a string
      const catLower = currentCategory ? currentCategory.toLowerCase() : "";

      // If it's a dress, recommend accessories (purses, earrings)
      if (catLower.includes('dress')) {
        targetCategories = ['Purses', 'Earrings'];
      }
      // If it's an accessory (purse or earring), recommend dresses and other accessories
      else if (catLower.includes('purse')) {
        targetCategories = ['Short Dresses', 'Party Dresses', 'Earrings'];
      }
      else if (catLower.includes('earring')) {
        targetCategories = ['Short Dresses', 'Party Dresses', 'Purses'];
      }
      // For other categories, show a mix of everything except the current category
      else {
        targetCategories = ['Short Dresses', 'Party Dresses', 'Purses', 'Earrings'];
      }

      // Fetch products from target categories
      const allRecommendations: Product[] = [];

      for (const category of targetCategories) {
        try {
          const q = query(
            collection(db!, "inventory"),
            where("Product", "==", category)
          );
          const snap = await getDocs(q);
          const categoryProducts = snap.docs.map((d) => d.data() as Product);
          allRecommendations.push(...categoryProducts);
        } catch (error) {
          console.log(`No products found for category: ${category}`);
        }
      }

      // Shuffle and select 4 random recommendations
      const shuffled = allRecommendations
        .filter((p) => p.ID !== product.ID) // Exclude current product
        .sort(() => 0.5 - Math.random());
      
      setRelatedProducts(shuffled.slice(0, 4));
    };

    fetchStyleItWith();
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

  // Check if this product uses general stock (Purses, Earrings) or size-based stock
  const currentCategory = (product as any).Category || (product as any).Product || "";
  const isGeneralStockProduct = currentCategory === "Purses" || currentCategory === "Earrings" || 
                                 currentCategory.toLowerCase().includes("purse") || 
                                 currentCategory.toLowerCase().includes("earring");

  // Get available stock for selected size (accounting for items already in cart)
  const getAvailableStock = () => {
    // For general stock products (Purses, Earrings)
    if (isGeneralStockProduct) {
      const totalStock = product.Stock !== undefined ? product.Stock : 0;
      return Math.max(0, totalStock - cartQuantity);
    }
    
    // For size-based stock products (Dresses, etc.)
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
      alert(isGeneralStockProduct ? "This item is out of stock" : "This size is out of stock");
      return;
    }

    if (quantity > availableStock) {
      alert(isGeneralStockProduct 
        ? `Only ${availableStock} items available`
        : `Only ${availableStock} items available in size ${selectedSize}`
      );
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

    // For general stock products, use "One Size" as the size identifier
    const sizeToUse = isGeneralStockProduct ? "One Size" : selectedSize;

    const q = query(
      cartRef,
      where("UserMail", "==", user.email),
      where("ID", "==", product.ID),
      where("Size", "==", sizeToUse)
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
        Size: sizeToUse,
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

  const handleShare = async () => {
    const link = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: (product as any)?.ProductName || product.Description || "Product",
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(link);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(link);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch (e) {
        alert("Could not copy link. Please copy manually: " + link);
      }
    }
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
            <div className="relative">
              <img
                src={images[imageIndex] || "/placeholder.png"}
                alt={product.Description}
                className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-contain cursor-zoom-in"
                onClick={() => setZoomImage(images[imageIndex] || "/placeholder.png")}
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#ffb6c1] text-white px-3 py-2 rounded-full"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#ffb6c1] text-white px-3 py-2 rounded-full"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* DOT NAVIGATION */}
            <div className="flex gap-2 mt-4 justify-center">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={`h-3 w-3 rounded-full transition-colors duration-200 border-2 focus:outline-none ${
                    i === imageIndex ? "bg-[#ffb6c1] border-[#ffb6c1]" : "bg-[#ffd1dc] border-[#ffd1dc]"
                  }`}
                  aria-label={`Show image ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* DETAILS */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 
                className="text-gray-900 leading-tight flex-1"
                style={{ 
                  fontFamily: 'Montserrat',
                  fontWeight: '600',
                  fontSize: '40px',
                  lineHeight: '1.2'
                }}
              >
                {(product as any).ProductName ? (product as any).ProductName : product.Description}
              </h1>
              {/* Share button: only visible on mobile */}
              <div className="relative block sm:hidden ml-3">
                <button 
                  onClick={handleShare}
                  className="w-10 h-10 bg-[#ffd1dc] rounded-full hover:bg-[#ffb6c1] transition-colors flex items-center justify-center flex-shrink-0"
                  style={{ borderRadius: '50%' }}
                  title="Share product"
                >
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                {shareCopied && (
                  <div className="absolute top-full mt-2 -right-2 bg-gray-800 text-white text-xs font-medium px-3 py-1 rounded shadow-lg whitespace-nowrap">
                    Link copied
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div 
                className="text-gray-900"
                style={{ 
                  fontFamily: 'Montserrat',
                  fontWeight: '600',
                  fontSize: '36px'
                }}
              >
                ₹{product.Price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* SIZE (only for size-based products, not for Purses/Earrings) */}
            {!isGeneralStockProduct && (
              <div className="mb-3">
                <p className="mb-2 text-sm">Size:</p>
                <div className="flex gap-2 flex-wrap">
                  {['S', 'M', 'L', 'XL'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-sm border font-semibold transition-colors duration-150 flex items-center justify-center ${
                        selectedSize === size
                          ? "bg-[#ffb6c1] text-white"
                          : "border-[#ffd1dc] text-black"
                      }`}
                      style={{
                        width: '48px',
                        height: '40px',
                        fontSize: '15px',
                        lineHeight: 1.1
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QUANTITY (now below size or immediately below price for general stock products) */}
            <div className="mb-5">
              <label 
                className="text-gray-900 mb-2 block"
                style={{
                  fontFamily: 'Montserrat',
                  fontWeight: '600',
                  fontSize: '15px'
                }}
              >
                Quantity:
              </label>
              {availableStock === 0 && (
                <p className="text-sm text-red-500 mb-2">
                  {isGeneralStockProduct ? "Out of stock" : `Out of stock in size ${selectedSize}`}
                </p>
              )}
              <div className="flex items-start space-x-3">
                <div className="flex items-center border border-gray-300" style={{ height: '54px' }}>
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-2 py-2 text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    style={{ fontSize: '14px' }}
                    disabled={availableStock === 0}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantity}
                    onChange={() => {}}
                    className="w-12 sm:w-16 h-[54px] px-2 py-2 text-center border-0 bg-transparent focus:outline-none text-gray-900 select-none"
                    style={{
                      fontFamily: 'Montserrat',
                      fontWeight: '600',
                      fontSize: '14px',
                      height: '54px'
                    }}
                    readOnly
                  />
                  <button
                    onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                    className="px-2 py-2 text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    style={{ fontSize: '14px' }}
                    disabled={availableStock === 0 || quantity >= availableStock}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={availableStock === 0}
                  className={`flex items-center justify-center px-2 py-2 transition-all duration-200 ${
                    availableStock === 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#ffd1dc] hover:bg-[#ffb6c1] text-black'
                  }`}
                  style={{
                    fontFamily: 'Montserrat',
                    fontWeight: '600',
                    fontSize: '14px',
                    borderRadius: '0',
                    height: '54px',
                    width: '350px',
                    maxWidth: '100%'
                  }}
                >
                  {availableStock === 0 ? 'Sold Out' : 'Add to Cart'}
                </button>
              </div>
              {/* Description & Short Instructions (shown below Quantity) */}
              <div className="mt-4 text-sm text-gray-800">
                <h3 className="font-semibold mb-1">Description</h3>
                <p className="text-sm text-gray-700">{product.Description}</p>

                <h3 className="font-semibold mt-3 mb-1">Short-Tructions</h3>
                <p className="text-sm text-gray-700">{product.ShortTruction ? product.ShortTruction : (product.Material ? product.Material : 'No Short-Tructions available.')}</p>
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span 
                    className="text-gray-900"
                    style={{
                      fontFamily: 'Montserrat',
                      fontWeight: '400',
                      fontSize: '13px'
                    }}
                  >
                    Free Shipping PAN India
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-7V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span 
                    className="text-gray-900"
                    style={{
                      fontFamily: 'Montserrat',
                      fontWeight: '400',
                      fontSize: '13px'
                    }}
                  >
                    Secure payment processing through Razorpay
                  </span>
                </div>
              </div>
              {showAdded && (
                <div className="text-green-600 text-center mt-4">
                  Added to Cart!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STYLE IT WITH */}
      {relatedProducts.length > 0 && (
        <div className="relative z-10 bg-white text-black pl-8 pr-8 sm:pl-16 sm:pr-16 lg:pl-32 lg:pr-32 pt-0 pb-12 -mt-16">
          <hr className="border-t border-gray-300 mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Style It With</h2>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-2">
            {relatedProducts.map((rp) => (
              <div key={rp.ID} className="flex-shrink-0 w-1/2 sm:w-auto snap-start text-black transition px-2">
                <button
                  type="button"
                  onClick={() => router.push(`/product/${encodeURIComponent((rp as any).ProductName || rp.Description)}`)}
                  className="cursor-pointer block hover:scale-105 transition-transform"
                  aria-label={`View ${(rp as any).ProductName || rp.Description}`}
                >
                  <img
                    src={rp.ImageUrl1 || "/placeholder.png"}
                    alt={(rp as any).ProductName || rp.Description}
                    className="h-36 sm:h-44 lg:h-52 object-contain mb-0 self-start"
                  />
                </button>

                <div className="flex flex-col items-start mt-1">
                  <p className="text-base font-medium">{(rp as any).ProductName || rp.Description}</p>
                  <p className="font-bold text-lg mt-1">₹{rp.Price}</p>
                </div>
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

      {/* <ReviewCarousel /> removed as per request */}
    </>
  );
}