"use client";

import { useRouter } from "next/navigation";

export default function AboutUsPage() {
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
              About Blush Boutique
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-700 max-w-2xl">
              Learn more about our story, values, and the inspiration behind
              Blush Boutique.
            </p>
          </div>
        </header>

        {/* Content */}
        <section className="space-y-4 text-sm md:text-base text-gray-800 leading-relaxed">
          <p>
            Blush Boutique is a modern women’s clothing label born out of a love
            for minimal elegance, soft femininity, and confident self-expression.
          </p>

          <p>
            Our collections are thoughtfully designed for women who appreciate
            effortless style, comfort, and quality — without compromising on
            individuality or personal expression.
          </p>

          <p>
            At Blush, fashion should feel as good as it looks. Every piece is
            carefully curated to fit seamlessly into everyday life while
            maintaining a sense of understated luxury.
          </p>

          <p>
            Blush is more than just clothing — it’s a feeling of confidence,
            grace, and quiet luxury that empowers women to express themselves
            with ease.
          </p>
        </section>

        {/* Footer Note */}
        <section className="pt-2 border-t border-pink-100 text-sm md:text-base text-gray-800">
          <p>
            Thank you for being a part of the Blush community.
          </p>
        </section>

      </div>
    </div>
  );
}
