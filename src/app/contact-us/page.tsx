"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FAQPage() {
  const router = useRouter();
  const [askDirect, setAskDirect] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const COMMON_SUBJECT = "Website Inquiry (FAQ)";

  

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSent(null);

    try {
      const res = await fetch("/api/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject: COMMON_SUBJECT, email, message }),
      });

      if (res.ok) {
        setSent("Message sent — we'll get back to you soon.");
        setName("");
        setEmail("");
        setMessage("");
        setAskDirect(false);
        // clear success message after a short delay
        setTimeout(() => setSent(null), 4000);
      } else {
        const json = await res.json();
        setSent(json?.error || "Failed to send message.");
      }
    } catch (err: any) {
      setSent(err?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <main className="px-4 py-12 max-w-6xl mx-auto">
        {/* Contact Details Section */}
        <div className="mb-12">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl md:text-4xl font-semibold text-black">Contact Us</h1>
            <button 
              onClick={() => router.push("/")} 
              className="font-semibold text-black hover:text-pink-600 cursor-pointer transition"
            >
              Back
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Contact Details */}
            <div className="bg-[#ffd1dc] border-2 border-pink-200 rounded-lg p-6 md:col-span-1 shadow-sm">
              <h2 className="text-xl font-semibold text-black mb-4">Get in Touch</h2>
              <div className="space-y-3 text-black">
                
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5">📞</div>
                  <span className="font-medium">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5">✉️</div>
                  <span className="font-medium">support@blushfashion.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5">🕒</div>
                  <span className="font-medium">Mon-Fri: 9AM-6PM EST</span>
                </div>
              </div>
            </div>

            {/* Ask Directly Form */}
            <div className="bg-pink-50 border-2 border-pink-100 rounded-lg p-6 md:col-span-2 shadow-sm">
              <h2 className="text-xl font-semibold text-black mb-4">Ask Directly</h2>
              
              {sent && (
                <div className="mb-4 px-4 py-2 bg-pink-100 text-black border-2 border-pink-300 rounded font-semibold">
                  {sent}
                </div>
              )}

              {!askDirect ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Have a specific question? Send us a message directly!</p>
                  <button
                    onClick={() => setAskDirect(true)}
                    className="px-6 py-3 bg-[#ffd1dc] text-black font-semibold rounded-lg hover:bg-pink-300 transition shadow-md cursor-pointer border-2 border-pink-300"
                  >
                    Send Message
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Name</label>
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full border-2 border-pink-200 bg-white text-black px-3 py-2 rounded focus:border-pink-400 focus:outline-none transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
                      <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        type="email"
                        className="w-full border-2 border-pink-200 bg-white text-black px-3 py-2 rounded focus:border-pink-400 focus:outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Message</label>
                    <textarea 
                      value={message} 
                      onChange={e => setMessage(e.target.value)} 
                      className="w-full border-2 border-pink-200 bg-white text-black px-3 py-2 rounded focus:border-pink-400 focus:outline-none transition" 
                      rows={4} 
                      required 
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button 
                      type="button" 
                      onClick={() => setAskDirect(false)} 
                      className="px-4 py-2 border-2 border-pink-200 text-black rounded hover:bg-pink-50 cursor-pointer transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={sending} 
                      className="px-4 py-2 bg-[#ffd1dc] text-black font-semibold rounded-lg hover:bg-pink-300 shadow-md cursor-pointer border-2 border-pink-300 transition disabled:opacity-50"
                    >
                      {sending ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQ removed — contact + message form only */}
      </main>
    </div>
  );
}
