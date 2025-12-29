import Navbar from "@/components/Navbar";
import Link from "next/link";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SearchProvider } from "@/context/SearchContext";


const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Blush Pune",
  description: "Blush - Find your inner Diva",
  icons: {
    icon: '/favicon.jpg',
    shortcut: '/favicon.jpg',
    apple: '/favicon.jpg',
  },
};


function Footer() {
  return (
    <footer className="bg-[#fff0f6] text-black py-10 px-4 w-full">
      <div className="max-w-7xl mx-auto">

        {/* Top Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left border-b border-[#ffe4ef] pb-8">

          {/* Policies */}
          <div>
            <h4 className="text-black font-semibold text-lg mb-4">
              Policies
            </h4>

            <ul className="space-y-2 text-sm mb-4">
              <li><a href="/shipping-policy" className="hover:underline">Shipping Policy</a></li>
              <li><a href="/refund-policy" className="hover:underline">Return & Refund</a></li>
              <li><a href="/privacy-policy" className="hover:underline">Privacy Policy</a></li>
              <li><a href="/tos" className="hover:underline">Terms & Conditions</a></li>
              <li><a href="/about-us" className="hover:underline">About Us</a></li>
            </ul>

            

          </div>

          {/* Contact (CENTER) */}
          <div>
            <h4 className="text-black font-semibold text-lg mb-4">
              Contact
            </h4>

            <ul className="space-y-2 text-sm">
              <li>📞 +91 8087847122</li>
              <li>✉️ prachikamble.blush@gmail.com</li>
              <li>📍 Prism, Aundh, Pune – 411007</li>
              <li>🕘 9:30 AM – 7:30 PM IST</li>
            </ul>
          </div>

          {/* Follow */}
          <div>
            <h4 className="text-black font-semibold text-lg mb-4">
              Follow
            </h4>

            <div className="flex justify-center md:justify-start gap-5">

              {/* Instagram */}
              <a
                href="https://www.instagram.com/blushpune_/?igsh=ejc3czR5OXNqamRq"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:opacity-70"
              >
                <svg className="w-5 h-5 fill-black" viewBox="0 0 24 24">
                  <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h10zm-5 3.5A4.5 4.5 0 1016.5 12 4.5 4.5 0 0012 7.5zm0 7.4a2.9 2.9 0 112.9-2.9 2.9 2.9 0 01-2.9 2.9zm4.8-8.9a1.1 1.1 0 11-1.1-1.1 1.1 1.1 0 011.1 1.1z"/>
                </svg>
              </a>

            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="text-center pt-6 text-sm text-black">
          <span
            className="block mx-auto text-xl md:text-2xl tracking-wide"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
            }}
          >
            BLUSH
          </span>
        </div>

      </div>
    </footer>
  );
}




export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
  className={`${montserrat.variable} font-montserrat antialiased min-h-screen bg-fixed bg-center bg-cover text-gray-900`}
  style={{
    backgroundImage: "url('/Blush%20theme.png')",
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundAttachment: 'fixed',
  }}
>

        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Navbar />
              {children}
              <Footer />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
