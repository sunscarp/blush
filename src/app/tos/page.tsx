"use client";

import { useRouter } from "next/navigation";

export default function TermsAndConditionsPage() {
  const router = useRouter();

  return (
    <div className="px-4 py-10 md:px-10 md:py-14 text-black flex justify-center">
      <div className="w-full max-w-4xl bg-white/95 border border-pink-100 rounded-2xl shadow-sm p-6 md:p-10 space-y-8">

        {/* Header */}
        <header className="space-y-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 hover:underline cursor-pointer"
          >
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </button>

          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Terms &amp; Conditions
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-700 max-w-2xl">
              These terms outline the rules and regulations for using the Blush
              Boutique website and services.
            </p>
          </div>
        </header>

        {/* General Usage */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">General Usage</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            By accessing and using the Blush Boutique website, you agree to comply
            with and be bound by these Terms &amp; Conditions. If you do not agree
            with any part of these terms, you should discontinue use of the site.
          </p>
        </section>

        {/* Product Information */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Product Information</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            We strive to display accurate product details and colors. However,
            actual colors may vary slightly due to lighting, photography, and
            differences in device screens.
          </p>
        </section>

        {/* Pricing */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Pricing</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            All prices listed on the website are subject to change without prior
            notice. Blush Boutique reserves the right to modify prices, offers,
            or discounts at any time.
          </p>
        </section>

        {/* Order Cancellation */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Order Cancellation</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            Blush Boutique reserves the right to cancel or refuse any order in rare
            circumstances such as product unavailability, pricing errors, or
            suspected fraudulent activity. Any payments made will be refunded as
            per our refund policy.
          </p>
        </section>

        {/* Intellectual Property */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">
            Intellectual Property
          </h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            All content on this website, including logos, images, text, graphics,
            and designs, is the exclusive property of Blush Boutique. Unauthorized
            use, reproduction, or distribution of any content is strictly prohibited.
          </p>
        </section>

        {/* Governing Law */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Governing Law</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            These Terms &amp; Conditions shall be governed by and interpreted in
            accordance with the laws of India. Any disputes arising from the use
            of this website shall be subject to Indian jurisdiction.
          </p>
        </section>

        {/* Footer CTA */}
        <section className="pt-2 border-t border-pink-100 text-sm md:text-base text-gray-800">
          <p>
            If you have any questions regarding these Terms &amp; Conditions,
            please contact our support team.
          </p>
        </section>

        <button
    onClick={() => router.push("/faq")}
    className="px-4 py-2 rounded-md border border-pink-300 bg-pink-50 text-pink-900 text-sm font-medium hover:bg-pink-100 cursor-pointer transition-colors"
  >
    Contact &amp; Support
  </button>

      </div>
    </div>
  );
}
