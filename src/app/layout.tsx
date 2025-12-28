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
    icon: '/Blush%20logo.jpg',
    shortcut: '/Blush%20logo.jpg',
    apple: '/Blush%20logo.jpg',
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
            <ul className="space-y-2 text-sm">
              <li><a href="/shipping-policy" className="hover:underline">Shipping Policy</a></li>
              <li><a href="/refund-policy" className="hover:underline">Return & Refund</a></li>
              <li><a href="/privacy-policy" className="hover:underline">Privacy Policy</a></li>
              <li><a href="/tos" className="hover:underline">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Contact (CENTER) */}
          <div>
            <h4 className="text-black font-semibold text-lg mb-4">
              Contact
            </h4>
            <ul className="space-y-2 text-sm">
              <li>📞 +91 XXXXXXXXXX</li>
              <li>✉️ hello@blush.com</li>
            </ul>
          </div>

          {/* Follow */}
          <div>
            <h4 className="text-black font-semibold text-lg mb-4">
              Follow
            </h4>

            <div className="flex justify-center md:justify-start gap-5">

              {/* Facebook */}
              <a href="#" aria-label="Facebook" className="hover:opacity-70">
                <svg className="w-5 h-5 fill-black" viewBox="0 0 24 24">
                  <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2v-2.9h2V9.7c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2v1.5h2.3l-.4 2.9h-1.9v7A10 10 0 0022 12z"/>
                </svg>
              </a>

              {/* Twitter (X) */}
              <a href="#" aria-label="Twitter" className="hover:opacity-70">
                <svg className="w-5 h-5 fill-black" viewBox="0 0 24 24">
                  <path d="M18.9 2H22l-7.2 8.2L23 22h-6.8l-5.4-6.6L5 22H2l7.7-8.8L1 2h7l4.9 6L18.9 2z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a href="#" aria-label="Instagram" className="hover:opacity-70">
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
            className="block mx-auto text-xl md:text-2xl tracking-wide transition-colors"
            style={{
              color: '#000',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              fontStyle: 'normal',
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
    backgroundImage: "url('/blush theme.png')",
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
