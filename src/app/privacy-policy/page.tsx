"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
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
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Privacy Policy</h1>
            <p className="mt-2 text-sm md:text-base text-gray-700 max-w-2xl">
              Your privacy matters to us. This policy explains what information we
              collect, how we use it, and the choices you have.
            </p>
          </div>
        </header>

        {/* Information Collected */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Information We Collect</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            When you place an order or create an account with Blush, we may
            collect the following information:
          </p>
          <ul className="list-disc pl-5 text-sm md:text-base text-gray-800 space-y-1">
            <li>Name</li>
            <li>Phone number</li>
            <li>Email address</li>
            <li>Shipping and delivery address</li>
            <li>
              Payment information (processed securely via our payment partners and
              <span className="font-semibold"> not stored in full by Blush</span>)
            </li>
          </ul>
        </section>

        {/* How Information Is Used */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">How We Use Your Information</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            We use the information you provide for the following purposes:
          </p>
          <ul className="list-disc pl-5 text-sm md:text-base text-gray-800 space-y-1">
            <li>
              <span className="font-semibold">Order processing:</span> to confirm your order, arrange
              shipping, and keep you updated on delivery.
            </li>
            <li>
              <span className="font-semibold">Customer support:</span> to respond to your queries,
              requests, or concerns.
            </li>
            <li>
              <span className="font-semibold">Marketing emails (optional):</span> to send you updates,
              offers, and new arrivals, only if you choose to receive them. You can
              opt out at any time.
            </li>
          </ul>
        </section>

        {/* Data Security */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Data Security</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            We take reasonable measures to protect your personal information.
          </p>
          <ul className="list-disc pl-5 text-sm md:text-base text-gray-800 space-y-1">
            <li>
              Payments are processed through <span className="font-semibold">secure payment gateways</span>
              &nbsp;that follow industry-standard encryption and security practices.
            </li>
            <li>
              We <span className="font-semibold">do not sell, rent, or trade</span> your personal data to
              third parties for their marketing purposes.
            </li>
          </ul>
        </section>

        {/* Third-Party Services */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Third-Party Services</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            To complete your orders and payments, we work with trusted third-party
            service providers, including:
          </p>
          <ul className="list-disc pl-5 text-sm md:text-base text-gray-800 space-y-1">
            <li>Payment gateways for processing online payments</li>
            <li>Shipping and courier partners for order delivery</li>
          </ul>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            These partners have their own privacy and security practices, which
            may apply in addition to this policy.
          </p>
        </section>

        {/* Cookies */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Cookies</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            Our website may use cookies and similar technologies to enhance your
            browsing experience. Cookies help us:
          </p>
          <ul className="list-disc pl-5 text-sm md:text-base text-gray-800 space-y-1">
            <li>Remember your preferences and cart items</li>
            <li>Understand how our website is used and improve it over time</li>
          </ul>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            You can manage or disable cookies through your browser settings, but
            some features of the site may not work properly without them.
          </p>
        </section>

        {/* User Rights */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Your Rights</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            You have control over your personal information. You may:
          </p>
          <ul className="list-disc pl-5 text-sm md:text-base text-gray-800 space-y-1">
            <li>
              Request <span className="font-semibold">access, updates, or corrections</span> to your
              personal details.
            </li>
            <li>
              Request <span className="font-semibold">deletion of your data</span>, subject to legal or
              operational requirements (such as tax and accounting records).
            </li>
          </ul>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            To exercise these rights, you can contact our support team using the
            details on the Contact page.
          </p>
        </section>

        {/* Help */}
        <section className="pt-2 border-t border-pink-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm md:text-base text-gray-800">
          <p>If you have any questions about this Privacy Policy, we&apos;re here to help.</p>
          <button
            onClick={() => router.push("/faq")}
            className="px-4 py-2 rounded-md border border-pink-300 bg-pink-50 text-pink-900 text-sm font-medium hover:bg-pink-100 cursor-pointer transition-colors"
          >
            Contact &amp; Support
          </button>
        </section>
      </div>
    </div>
  );
}
