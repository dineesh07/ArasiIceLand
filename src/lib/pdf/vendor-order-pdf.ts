import { jsPDF } from 'jspdf';
import { formatISTDisplay } from '@/lib/dates';
import { ARASI_LOGO_BASE64 } from './logo-base64';

export interface VendorOrderItemData {
  product_name: string;
  quantity: number;
  unit?: string | null;
}

export interface VendorOrderPdfData {
  shop_name: string;
  shop_phone?: string | null;
  shop_address?: string | null;
  vendor_name?: string | null;
  vendor_phone?: string | null;
  order_no: number;
  order_date: string;
  items: VendorOrderItemData[];
  note?: string | null;
}

export function generateVendorOrderPdf(data: VendorOrderPdfData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const formattedDate = formatISTDisplay(data.order_date);
  const totalUnits = data.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalItems = data.items.length;

  // 1. TOP ACCENT BAR (Apple Sky 600 banner)
  doc.setFillColor(2, 132, 199);
  doc.rect(0, 0, 210, 4, 'F');

  // 2. HEADER BRANDING & LOGO
  try {
    if (ARASI_LOGO_BASE64) {
      doc.addImage(ARASI_LOGO_BASE64, 'PNG', 16, 12, 18, 18);
    }
  } catch (err) {
    console.warn('Could not embed logo in PDF:', err);
  }

  // Store Brand Name (Clean, without the subtitle)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(data.shop_name || 'Arasi Iceland & Computers', 38, 20.5);

  if (data.shop_phone) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Phone: ${data.shop_phone}`, 38, 26.5);
  }

  // Right Side: Purchase Order Badge & Number (Positioned with plenty of breathing room)
  doc.setFillColor(240, 249, 255); // Sky 50
  doc.setDrawColor(186, 230, 253); // Sky 200
  doc.setLineWidth(0.3);
  doc.roundedRect(144, 10, 50, 7.5, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(2, 132, 199); // Sky 600
  doc.text('OFFICIAL PURCHASE ORDER', 169, 15, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(`#PO-${String(data.order_no).padStart(4, '0')}`, 194, 25, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${formattedDate}`, 194, 30, { align: 'right' });

  // 3. TWO INFORMATION CARDS (Buyer is HIGHLIGHTED with sky blue; Vendor is clean neutral)
  const cardY = 36;
  const cardHeight = data.shop_address ? 28 : 24;

  // 3A. Left Card: HIGHLIGHTED BUYER (Arasi Iceland & Computers)
  doc.setFillColor(240, 249, 255); // Soft Sky 50
  doc.setDrawColor(186, 230, 253); // Sky 200
  doc.setLineWidth(0.4);
  doc.roundedRect(16, cardY, 86, cardHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(2, 132, 199); // Sky 600
  doc.text('ORDERED BY (BUYER)', 21, cardY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(12, 74, 110); // Sky 900
  doc.text(data.shop_name || 'Arasi Iceland & Computers', 21, cardY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  if (data.shop_phone) {
    doc.text(`Phone: ${data.shop_phone}`, 21, cardY + 17);
  }

  if (data.shop_address && data.shop_address.trim()) {
    doc.text(`Address: ${data.shop_address.trim()}`, 21, cardY + (data.shop_phone ? 22 : 17), {
      maxWidth: 78,
    });
  }

  // 3B. Right Card: NEUTRAL VENDOR / DISTRIBUTOR
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.35);
  doc.roundedRect(108, cardY, 86, cardHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('DISTRIBUTOR / VENDOR', 113, cardY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(data.vendor_name || 'Arun Ice Creams Distributor', 113, cardY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  if (data.vendor_phone) {
    doc.text(`Contact: ${data.vendor_phone}`, 113, cardY + 17);
  }

  // 4. ITEMS TABLE (ONLY TWO COLUMNS: Product Description & Quantity)
  const tableStartY = cardY + cardHeight + 6;
  const tableWidth = 178;

  // Header Bar (Dark Slate)
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(16, tableStartY, tableWidth, 9, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PRODUCT / ITEM DESCRIPTION', 22, tableStartY + 6);
  doc.text('QUANTITY', 188, tableStartY + 6, { align: 'right' });

  // Rows
  let currentY = tableStartY + 9;
  const rowHeight = 9.5;

  data.items.forEach((item, index) => {
    // Alternating background
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(16, currentY, tableWidth, rowHeight, 'F');
    }

    // Bottom subtle divider
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(16, currentY + rowHeight, 194, currentY + rowHeight);

    // Column 1: Product Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(item.product_name, 22, currentY + 6.2);

    // Column 2: Quantity with unit (Bold Sky 600, right aligned)
    const unitLabel = item.unit || 'box';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(2, 132, 199);
    doc.text(`${item.quantity} ${unitLabel}`, 188, currentY + 6.2, { align: 'right' });

    currentY += rowHeight;
  });

  // Outer table boundary border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.roundedRect(16, tableStartY, tableWidth, currentY - tableStartY, 2, 2, 'D');

  // 5. SUMMARY BANNER (Total items & units)
  currentY += 4;
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.setLineWidth(0.35);
  doc.roundedRect(16, currentY, tableWidth, 12, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Order Breakdown: ${totalItems} product line${totalItems === 1 ? '' : 's'}`, 22, currentY + 7.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(3, 105, 161);
  doc.text(`TOTAL UNITS TO DISPATCH:  ${totalUnits} BOXES / UNITS`, 188, currentY + 7.5, { align: 'right' });

  currentY += 16;

  // 6. SPECIAL INSTRUCTIONS / NOTES CALLOUT
  if (data.note && data.note.trim()) {
    doc.setFillColor(254, 252, 232); // Amber 50
    doc.setDrawColor(254, 240, 138); // Amber 200
    doc.setLineWidth(0.35);
    doc.roundedRect(16, currentY, tableWidth, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9); // Amber 700
    doc.text('SPECIAL INSTRUCTIONS / DELIVERY NOTE:', 22, currentY + 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(69, 26, 3);
    doc.text(`"${data.note.trim()}"`, 22, currentY + 10);

    currentY += 18;
  }

  // 7. FOOTER
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(16, 280, 194, 280);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Arasi Iceland & Computers · Counter Point-of-Sale · Official Distributor Purchase Order', 16, 285);
  doc.text('Page 1 of 1', 194, 285, { align: 'right' });

  // Bottom color bar
  doc.setFillColor(2, 132, 199);
  doc.rect(0, 294, 210, 3, 'F');

  // Save PDF
  const cleanShopName = (data.shop_name || 'Arasi-Iceland-Computers').replace(/\s+/g, '-');
  const filename = `Purchase-Order-${data.order_no}-${cleanShopName}.pdf`;
  doc.save(filename);
}

export function buildVendorWhatsAppUrl(data: VendorOrderPdfData): string {
  const formattedDate = formatISTDisplay(data.order_date);
  let text = `*${data.shop_name || 'Arasi Iceland & Computers'}* - Purchase Order #${data.order_no}\n`;
  text += `Date: ${formattedDate}\n\n`;
  text += `*Order Items:*\n`;
  data.items.forEach((item, idx) => {
    const unit = item.unit ? ` (${item.unit})` : ' (box)';
    text += `${idx + 1}. *${item.product_name}* - ${item.quantity}${unit}\n`;
  });

  const totalUnits = data.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  text += `\n*Total Packaging:* ${totalUnits} units/boxes\n`;

  if (data.note && data.note.trim()) {
    text += `Note: ${data.note.trim()}\n`;
  }
  text += `\nThank you!\n${data.shop_name || 'Arasi Iceland & Computers'}`;

  const cleanPhone = (data.vendor_phone || '').replace(/\D/g, '');
  const internationalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(text)}`;
}
