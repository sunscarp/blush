import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

async function generatePdfBuffer(order: any): Promise<Buffer> {
  const doc = new jsPDF();

  // Match the existing client-side invoice layout (generateInvoice.ts)
  const generatedAt = new Date();

  // ===== HEADER / BRAND =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("BLUSH BOUTIQUE", 14, 18);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Luxury Women's Wear", 14, 25);
  doc.text("Pune, Maharashtra, India", 14, 31);
  doc.text("Email: support@blushboutique.in", 14, 37);
  doc.text("Phone: +91 XXXXXXXXXX", 14, 43);

  doc.setLineWidth(0.5);
  doc.line(14, 48, 196, 48);

  // ===== INVOICE DETAILS =====
  const orderId = order.id || order.orderId || "";
  const invoiceNo = order.invoiceNo || orderId;

  const createdAtDate =
    order.createdAt?.toDate?.() ??
    (order.createdAt ? new Date(order.createdAt) : generatedAt);

  doc.setFontSize(11);
  doc.text(`Invoice No: BLUSH-INV-${invoiceNo}`, 14, 56);
  doc.text(`Order ID: BLUSH-ORD-${orderId}`, 14, 62);
  doc.text(
    `Order Date: ${createdAtDate.toLocaleDateString()}`,
    14,
    68,
  );
  doc.text(`Payment Method: ${order.paymentMethod ?? "Razorpay"}`, 14, 74);
  doc.text(`Payment Status: ${order.paymentStatus ?? "Paid"}`, 14, 80);

  // ===== BILLING DETAILS =====
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Billed To", 14, 92);

  const customer = order.customer || {};
  const city = customer.city ?? customer.stateCity ?? "";
  const state = customer.state ?? "";
  const pincode = customer.pincode ?? customer.pinCode ?? "";

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${customer.name ?? ""}`, 14, 98);
  doc.text(`Email: ${customer.email ?? ""}`, 14, 104);
  doc.text(`Phone: ${customer.phone ?? ""}`, 14, 110);

  doc.text("Shipping Address:", 14, 118);
  doc.text(
    `${customer.address ?? ""}, ${city}, ${state} - ${pincode}, India`,
    14,
    124,
  );

  // ===== CALCULATIONS =====
  const items = order.items || [];
  const subtotal = items.reduce((sum: number, item: any) => {
    const basePrice = item.product?.Price || 0;
    const customPrice =
      item.isCustomized && item.customPrice ? item.customPrice : 0;
    return sum + (basePrice + customPrice) * (item.Quantity || 0);
  }, 0);

  const shipping = order.shippingCharge ?? 0;
  const tax = order.tax ?? 0;
  const discount = order.discount ?? 0;
  const grandTotal = order.total ?? subtotal - discount + shipping + tax;

  // ===== ORDER TABLE =====
  autoTable(doc, {
    startY: 136,
    head: [["Item Name", "Qty", "Price", "Total"]],
    body: items.map((item: any) => {
      const basePrice = item.product?.Price || 0;
      const customPrice =
        item.isCustomized && item.customPrice ? item.customPrice : 0;
      const itemPrice = basePrice + customPrice;
      const qty = item.Quantity || 0;
      const itemTotal = itemPrice * qty;

      return [
        item.product?.ProductName ?? "Product",
        qty,
        `Rs. ${itemPrice}`,
        `Rs. ${itemTotal}`,
      ];
    }),
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [0, 0, 0],
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 150;

  // ===== PRICE BREAKDOWN =====
  doc.setFontSize(11);
  doc.text(`Subtotal: Rs. ${subtotal}`, 14, finalY + 10);
  doc.text(
    `Shipping: Rs. ${shipping} ${shipping === 0 ? "(Free)" : ""}`,
    14,
    finalY + 16,
  );
  doc.text(`Tax: Rs. ${tax}`, 14, finalY + 22);

  if (discount > 0) {
    doc.text(`Discount: -Rs. ${discount}`, 14, finalY + 28);
  }

  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total: Rs. ${grandTotal}`, 14, finalY + 36);

  // ===== DELIVERY INFO =====
  doc.setFont("helvetica", "normal");
  doc.text("Estimated Delivery: 2-4 working days", 14, finalY + 48);
  doc.text(
    `Courier Partner: ${order.courierPartner ?? "Delhivery"}`,
    14,
    finalY + 54,
  );

  // ===== RETURN POLICY =====
  doc.setFontSize(10);
  doc.text(
    "Easy returns within 7 days of delivery. Product must be unused and in original packaging.",
    14,
    finalY + 64,
  );

  // ===== FOOTER =====
  doc.text(
    "Thank you for shopping with Blush Boutique. For support, WhatsApp us at +91 XXXXXXXXXX.",
    14,
    finalY + 74,
  );

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order, orderId, sendTo } = body || {};

    const recipient = sendTo || order?.customer?.email;
    if (!recipient) return NextResponse.json({ error: "No recipient" }, { status: 400 });

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    if (!user || !pass) return NextResponse.json({ error: "Email not configured" }, { status: 500 });

    const allowInsecure = process.env.SMTP_ALLOW_INSECURE === "true";
    const transportOptions: any = {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    };
    if (allowInsecure) transportOptions.tls = { rejectUnauthorized: false };

    const transporter = nodemailer.createTransport(transportOptions);

    const data = { ...order, orderId };
    const pdfBuffer = await generatePdfBuffer(data);

    const senderName = process.env.SENDER_NAME || "Blush Boutique";

    const items = order?.items || [];
    const subtotal = items.reduce((sum: number, it: any) => {
      const basePrice = it.product?.Price || 0;
      const customPrice = it.isCustomized && it.customPrice ? it.customPrice : 0;
      return sum + (basePrice + customPrice) * (it.Quantity || 0);
    }, 0);
    const shipping = order.shippingCharge ?? 0;
    const tax = order.tax ?? 0;
    const discount = order.discount ?? 0;
    const grandTotal = order.total ?? subtotal - discount + shipping + tax;

    const plainItems = items
      .map((it: any) => {
        const name = it.product?.ProductName || it.product?.Description || it.product?.Product || "Product";
        const basePrice = it.product?.Price || 0;
        const customPrice = it.isCustomized && it.customPrice ? it.customPrice : 0;
        const itemPrice = basePrice + customPrice;
        const qty = it.Quantity || 0;
        const lineTotal = itemPrice * qty;
        return `${name} | Qty: ${qty} | Price: Rs. ${itemPrice} | Total: Rs. ${lineTotal}`;
      })
      .join("\n");

    await transporter.sendMail({
      from: `${senderName} <${user}>`,
      to: recipient,
      subject: `Your Blush Boutique Order ${orderId || order?.id}`,
      text:
        `Thank you for shopping with Blush Boutique.\n\n` +
        `Order: ${orderId || order?.id}\n\n` +
        `Items (Name | Qty | Price | Total):\n${plainItems}\n\n` +
        `Subtotal: Rs. ${subtotal}\n` +
        `Shipping: Rs. ${shipping}${shipping === 0 ? " (Free)" : ""}\n` +
        `Tax: Rs. ${tax}\n` +
        (discount > 0 ? `Discount: -Rs. ${discount}\n` : "") +
        `Grand Total: Rs. ${grandTotal}\n\n` +
        `Your invoice is attached as a PDF.`,
      html:
        `<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #333;">` +
        `<div style="background:#ffe6f0;padding:16px;border-radius:12px 12px 0 0;border:1px solid #f8c1da;border-bottom:0;">` +
        `<h2 style="margin:0;color:#d81b60;">Thank you for your order</h2>` +
        `<p style="margin:4px 0 0 0;color:#5a0830;">Blush Boutique</p>` +
        `</div>` +
        `<div style="border:1px solid #f8c1da;border-top:0;padding:16px;border-radius:0 0 12px 12px;background:#fffafa;">` +
        `<p style="margin-top:0;">Order <strong>#${orderId || order?.id}</strong> has been received.</p>` +
        `<p style="margin-bottom:8px;"><strong>Order summary</strong></p>` +
        `<table style="border-collapse:collapse;width:100%;font-size:13px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #f8c1da;">` +
        `<thead>` +
        `<tr style="background:#ffe6f0;color:#5a0830;">` +
        `<th style="padding:8px 6px;text-align:left;border-bottom:1px solid #f8c1da;">Item</th>` +
        `<th style="padding:8px 6px;text-align:center;border-bottom:1px solid #f8c1da;">Qty</th>` +
        `<th style="padding:8px 6px;text-align:right;border-bottom:1px solid #f8c1da;">Price</th>` +
        `<th style="padding:8px 6px;text-align:right;border-bottom:1px solid #f8c1da;">Total</th>` +
        `</tr>` +
        `</thead>` +
        `<tbody>` +
        `${
          items.length
            ? items
                .map((it: any, index: number) => {
                  const name = it.product?.ProductName || it.product?.Description || it.product?.Product || "Product";
                  const basePrice = it.product?.Price || 0;
                  const customPrice = it.isCustomized && it.customPrice ? it.customPrice : 0;
                  const itemPrice = basePrice + customPrice;
                  const qty = it.Quantity || 0;
                  const lineTotal = itemPrice * qty;
                  const rowBg = index % 2 === 0 ? "#fffafa" : "#ffffff";
                  return (
                    `<tr style="background:${rowBg};">` +
                    `<td style="padding:8px 6px;border-bottom:1px solid #f8c1da;">${name}</td>` +
                    `<td style="padding:8px 6px;text-align:center;border-bottom:1px solid #f8c1da;">${qty}</td>` +
                    `<td style="padding:8px 6px;text-align:right;border-bottom:1px solid #f8c1da;">Rs. ${itemPrice}</td>` +
                    `<td style="padding:8px 6px;text-align:right;border-bottom:1px solid #f8c1da;">Rs. ${lineTotal}</td>` +
                    `</tr>`
                  );
                })
                .join("")
            : `<tr><td colspan="4" style="padding:8px 6px;text-align:center;color:#777;">(No items found)</td></tr>`
        }` +
        `</tbody>` +
        `</table>` +
        `<p style="margin-top:12px;">` +
        `Subtotal: <strong>Rs. ${subtotal}</strong><br/>` +
        `Shipping: <strong>Rs. ${shipping}${shipping === 0 ? " (Free)" : ""}</strong><br/>` +
        `Tax: <strong>Rs. ${tax}</strong><br/>` +
        (discount > 0
          ? `Discount: <strong>-Rs. ${discount}</strong><br/>`
          : "") +
        `Grand Total: <strong>Rs. ${grandTotal}</strong>` +
        `</p>` +
        `<p style="margin-top:12px;">Your invoice PDF is attached to this email.</p>` +
        `<p style="margin-top:12px;font-size:12px;color:#777;">If you have any questions, just reply to this email.</p>` +
        `</div>` +
        `</div>`,
      attachments: [
        { filename: `BLUSH_INVOICE_${orderId || order?.id}.pdf`, content: pdfBuffer },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("send-invoice error:", err);
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}
