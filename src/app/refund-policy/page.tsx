"use client";

import { useRouter } from "next/navigation";

export default function RefundPolicyPage() {
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
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Return &amp; Refund Policy</h1>
            <p className="mt-2 text-sm md:text-base text-gray-700 max-w-2xl">
              We want you to love your Blush purchase. If something isn&apos;t quite right,
              our simple return and refund guidelines below will help you.
            </p>
          </div>
        </header>

        {/* Return Eligibility */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Return Eligibility</h2>
          <ul className="list-disc pl-5 text-sm md:text-base text-gray-800 space-y-1">
            <li>Returns are accepted within <span className="font-semibold">7 days of delivery</span>.</li>
            <li>
              Items must be <span className="font-semibold">unused, unwashed, and in their original condition</span>
              &nbsp;with all tags, labels, and packaging intact.
            </li>
          </ul>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Returns that do not meet these conditions may be rejected or may be
            eligible only for partial refund or store credit, at our discretion.
          </p>
        </section>

        {/* Non-Returnable Items */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Non-Returnable Items</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            For hygiene and safety reasons, certain product categories cannot be
            returned. This includes, but may not be limited to:
          </p>
          <ul className="list-disc pl-5 text-sm md:text-base text-gray-800 space-y-1">
            <li><span className="font-semibold">Accessories</span></li>
          </ul>
        </section>

        {/* Return Process */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Return Process</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            To initiate a return, please follow these steps:
          </p>
          <ul className="list-decimal pl-5 text-sm md:text-base text-gray-800 space-y-1">
            <li>
              Email our support team at
              &nbsp;<a href="mailto:prachikamble.blush@gmail.com" className="font-semibold underline">prachikamble.blush@gmail.com</a>.
            </li>
            <li>
              Mention your <span className="font-semibold">Order ID</span> and provide a brief
              <span className="font-semibold"> reason for return</span>.
            </li>
          </ul>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Our team will review your request and share the return instructions,
            including pickup or self-ship details, based on your location.
          </p>
        </section>

        {/* Refund Method */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Refund Method</h2>
          <ul className="list-disc pl-5 text-sm md:text-base text-gray-800 space-y-1">
            <li>
              Approved refunds are processed to the <span className="font-semibold">original payment method</span>
              &nbsp;used at the time of purchase.
            </li>
            <li>
              Refund processing time is typically
              &nbsp;<span className="font-semibold">5–10 business days</span> from the date we receive and
              inspect the returned item.
            </li>
          </ul>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            The exact time taken for the refund to reflect in your account may
            vary depending on your bank or payment provider.
          </p>
        </section>

        {/* Damaged / Wrong Product */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Damaged or Wrong Product</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            If you receive a damaged item or an incorrect product, please notify us
            as soon as possible so we can assist you.
          </p>
          <ul className="list-disc pl-5 text-sm md:text-base text-gray-800 space-y-1">
            <li>
              Issues must be reported within
              &nbsp;<span className="font-semibold">24–48 hours of delivery</span>.
            </li>
            <li>
              You may be asked to share clear photos or videos of the product and
              packaging to help us investigate with the courier partner.
            </li>
          </ul>
        </section>

        {/* Help */}
        <section className="pt-2 border-t border-pink-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm md:text-base text-gray-800">
          <p>If you have any questions about returns or refunds, we&apos;re here to help.</p>
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
