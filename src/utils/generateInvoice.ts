import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateInvoice(order: any) {
  const doc = new jsPDF();
  const generatedAt = new Date();

  // ===== HEADER / BRAND =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("BLUSH BOUTIQUE", 14, 18);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Luxury Women’s Wear", 14, 25);
  doc.text("Pune, Maharashtra, India", 14, 31);
  doc.text("Email: support@blushboutique.in", 14, 37);
  doc.text("Phone: +91 XXXXXXXXXX", 14, 43);

  doc.setLineWidth(0.5);
  doc.line(14, 48, 196, 48);

  // ===== INVOICE DETAILS =====
  doc.setFontSize(11);
  doc.text(`Invoice No: BLUSH-INV-${order.invoiceNo ?? order.id}`, 14, 56);
  doc.text(`Order ID: BLUSH-ORD-${order.id}`, 14, 62);
  doc.text(
    `Order Date: ${order.createdAt?.toDate?.().toLocaleDateString()}`,
    14,
    68
  );
  doc.text(`Payment Method: ${order.paymentMethod ?? "Razorpay"}`, 14, 74);
  doc.text(`Payment Status: ${order.paymentStatus ?? "Paid"}`, 14, 80);

  // ===== BILLING DETAILS =====
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Billed To", 14, 92);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${order.customer?.name}`, 14, 98);
  doc.text(`Email: ${order.customer?.email}`, 14, 104);
  doc.text(`Phone: ${order.customer?.phone}`, 14, 110);

  doc.text("Shipping Address:", 14, 118);
  doc.text(
    `${order.customer?.address}, ${order.customer?.city}, ${order.customer?.state} - ${order.customer?.pincode}, India`,
    14,
    124
  );

  // ===== CALCULATIONS =====
  const subtotal = order.items.reduce((sum: number, item: any) => {
    const basePrice = item.product?.Price || 0;
    const customPrice =
      item.isCustomized && item.customPrice ? item.customPrice : 0;
    return sum + (basePrice + customPrice) * item.Quantity;
  }, 0);

  const shipping = order.shippingCharge ?? 0;
  const tax = order.tax ?? 0;
  const discount = order.discount ?? 0;
  const grandTotal = order.total;

  // ===== ORDER TABLE (CATEGORY REMOVED) =====
  autoTable(doc, {
    startY: 136,
    head: [["Item Name", "Qty", "Price", "Total"]],
    body: order.items.map((item: any) => {
      const basePrice = item.product?.Price || 0;
      const customPrice =
        item.isCustomized && item.customPrice ? item.customPrice : 0;
      const itemPrice = basePrice + customPrice;
      const itemTotal = itemPrice * item.Quantity;

      return [
        item.product?.ProductName ?? "Product",
        item.Quantity,
        `Rs. ${itemPrice}`,
        `Rs. ${itemTotal}`,
      ];
    }),
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: [220, 220, 220], // light gray
      textColor: [0, 0, 0],       // black text
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // ===== PRICE BREAKDOWN =====
  doc.setFontSize(11);
  doc.text(`Subtotal: Rs. ${subtotal}`, 14, finalY + 10);
  doc.text(
    `Shipping: Rs. ${shipping} ${shipping === 0 ? "(Free)" : ""}`,
    14,
    finalY + 16
  );
  doc.text(`Tax: Rs. ${tax}`, 14, finalY + 22);

  if (discount > 0) {
    doc.text(`Discount: -Rs. ${discount}`, 14, finalY + 28);
  }

  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total: Rs. ${grandTotal}`, 14, finalY + 36);

  // ===== DELIVERY INFO =====
  doc.setFont("helvetica", "normal");
  doc.text("Estimated Delivery: 2–4 working days", 14, finalY + 48);
  doc.text(
    `Courier Partner: ${order.courierPartner ?? "Delhivery"}`,
    14,
    finalY + 54
  );

  // ===== RETURN POLICY =====
  doc.setFontSize(10);
  doc.text(
    "Easy returns within 7 days of delivery. Product must be unused and in original packaging.",
    14,
    finalY + 64
  );

  // ===== FOOTER =====
  doc.text(
    "Thank you for shopping with Blush Boutique. For support, WhatsApp us at +91 XXXXXXXXXX.",
    14,
    finalY + 74
  );

  // ===== SAVE =====
  doc.save(`BLUSH_INVOICE_${order.id}.pdf`);
}
