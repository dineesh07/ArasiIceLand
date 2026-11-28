import { jsPDF } from 'jspdf';
import { formatISTDisplay, formatISTDateTime } from '@/lib/dates';
import { ARASI_LOGO_BASE64 } from './logo-base64';

export const DEFAULT_SHOP_ADDRESS =
  'M.P. Sengottaiyan Shopping Complex, 193/2, Anna Street, Modakurichi, Erode-638104';

export interface ReceiptItemData {
  service_name: string;
  quantity: number;
  unit_rate: number;
  amount: number;
}

export interface ReceiptExportData {
  id: string;
  bill_date: string;
  created_at: string;
  token_no: number | null;
  customer_name: string | null;
  phone: string | null;
  payment_method: string;
  total: number;
  items: ReceiptItemData[];
  shop_name?: string | null;
  shop_address?: string | null;
  shop_phone?: string | null;
}

function getFileSlug(data: ReceiptExportData): string {
  const tokenPart = data.token_no ? `token-${data.token_no}` : 'bill';
  return `arasi-receipt-${data.bill_date}-${tokenPart}`;
}

export function generateReceiptPdf(data: ReceiptExportData): void {
  const items = data.items || [];
  const shopName = data.shop_name || 'Arasi Iceland & Computers';
  const shopAddress = data.shop_address || DEFAULT_SHOP_ADDRESS;
  const shopPhone = data.shop_phone || '9942565298';
  const dateLabel = formatISTDisplay(data.bill_date);
  const timeLabel = formatISTDateTime(data.created_at).split(',')[1]?.trim() || '';

  // Dynamic height based on item count (A5-width 148mm portrait receipt)
  const width = 148;
  const estimatedHeight = Math.max(165, 118 + items.length * 9);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [width, estimatedHeight],
  });

  // Top Sky Accent Bar
  doc.setFillColor(2, 132, 199);
  doc.rect(0, 0, width, 3.5, 'F');

  // Logo centered
  try {
    if (ARASI_LOGO_BASE64) {
      doc.addImage(ARASI_LOGO_BASE64, 'PNG', width / 2 - 9, 8, 18, 18);
    }
  } catch (err) {
    console.warn('Could not embed logo in receipt PDF:', err);
  }

  let y = 31;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(shopName.toUpperCase(), width / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const addrLines = doc.splitTextToSize(shopAddress, width - 24);
  doc.text(addrLines, width / 2, y, { align: 'center' });
  y += addrLines.length * 4;

  if (shopPhone) {
    doc.text(`Ph: ${shopPhone}`, width / 2, y, { align: 'center' });
    y += 4.5;
  }

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${dateLabel}${timeLabel ? `  •  ${timeLabel}` : ''}`, width / 2, y, { align: 'center' });
  y += 4;

  // Dashed separator
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(12, y, width - 12, y);
  doc.setLineDashPattern([], 0);
  y += 6;

  // Customer & Token
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Customer:', 12, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.customer_name || 'Walk-in Customer', 30, y);

  if (data.token_no) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(2, 132, 199);
    doc.text(`#${data.token_no}`, width - 12, y, { align: 'right' });
  }

  if (data.phone) {
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Phone: ${data.phone}`, 12, y);
  }

  y += 5;
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(12, y, width - 12, y);
  doc.setLineDashPattern([], 0);
  y += 5;

  // Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ITEM', 12, y);
  doc.text('QTY', 86, y, { align: 'center' });
  doc.text('RATE', 108, y, { align: 'right' });
  doc.text('AMOUNT', width - 12, y, { align: 'right' });
  y += 2.5;
  doc.setDrawColor(226, 232, 240);
  doc.line(12, y, width - 12, y);
  y += 5;

  // Items
  items.forEach((it) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const nameStr = it.service_name.length > 34 ? `${it.service_name.slice(0, 32)}..` : it.service_name;
    doc.text(nameStr, 12, y);
    doc.text(String(it.quantity), 86, y, { align: 'center' });
    doc.text(`Rs. ${it.unit_rate}`, 108, y, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${it.amount}`, width - 12, y, { align: 'right' });
    y += 6.5;
  });

  y += 1;
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(12, y, width - 12, y);
  doc.setLineDashPattern([], 0);
  y += 7;

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text('Grand Total:', 12, y);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${data.total}`, width - 12, y, { align: 'right' });
  y += 6;

  // Payment Method
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Payment Method:', 12, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text((data.payment_method || '').toUpperCase(), width - 12, y, { align: 'right' });
  y += 7;

  // Footer
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(12, y, width - 12, y);
  doc.setLineDashPattern([], 0);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Thank you for visiting ${shopName}!`, width / 2, y, { align: 'center' });
  y += 4;
  doc.text('Have a wonderful day!', width / 2, y, { align: 'center' });

  doc.save(`${getFileSlug(data)}.pdf`);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function downloadReceiptImage(data: ReceiptExportData): Promise<void> {
  const items = data.items || [];
  const shopName = data.shop_name || 'Arasi Iceland & Computers';
  const shopAddress = data.shop_address || DEFAULT_SHOP_ADDRESS;
  const shopPhone = data.shop_phone || '9942565298';
  const dateLabel = formatISTDisplay(data.bill_date);
  const timeLabel = formatISTDateTime(data.created_at).split(',')[1]?.trim() || '';

  const scale = 2;
  const w = 420;
  const padX = 28;

  // Measure address lines first
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const addrLines = wrapLines(tempCtx, shopAddress, w - padX * 2);

  const h = Math.max(460, 325 + addrLines.length * 17 + items.length * 28);

  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Top Sky Bar
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, w, 6);

  // Load logo image
  const logoSrc = ARASI_LOGO_BASE64 || '/logo.png';
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, w / 2 - 26, 20, 52, 52);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = logoSrc;
  });

  let y = 92;
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(shopName.toUpperCase(), w / 2, y);

  y += 18;
  ctx.fillStyle = '#64748b';
  ctx.font = '500 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  for (const line of addrLines) {
    ctx.fillText(line, w / 2, y);
    y += 16;
  }

  if (shopPhone) {
    ctx.fillText(`Ph: ${shopPhone}`, w / 2, y);
    y += 16;
  }

  ctx.fillStyle = '#475569';
  ctx.font = '600 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${dateLabel}${timeLabel ? `  •  ${timeLabel}` : ''}`, w / 2, y);
  y += 14;

  // Dashed divider
  const drawDashedLine = (lineY: number) => {
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padX, lineY);
    ctx.lineTo(w - padX, lineY);
    ctx.stroke();
    ctx.restore();
  };

  drawDashedLine(y);
  y += 22;

  // Customer & Token
  ctx.textAlign = 'left';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Customer:', padX, y);
  ctx.fillStyle = '#1e293b';
  ctx.font = '700 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(data.customer_name || 'Walk-in Customer', padX + 64, y);

  if (data.token_no) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0284c7';
    ctx.font = '800 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`#${data.token_no}`, w - padX, y);
  }

  if (data.phone) {
    y += 16;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = '500 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(data.phone, padX, y);
  }

  y += 16;
  drawDashedLine(y);
  y += 20;

  // Table Headers
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ITEM', padX, y);
  ctx.textAlign = 'center';
  ctx.fillText('QTY', w - 145, y);
  ctx.textAlign = 'right';
  ctx.fillText('RATE', w - 85, y);
  ctx.fillText('AMOUNT', w - padX, y);
  y += 10;

  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(w - padX, y);
  ctx.stroke();
  y += 20;

  // Items
  for (const it of items) {
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    const label = it.service_name.length > 24 ? `${it.service_name.slice(0, 22)}..` : it.service_name;
    ctx.fillText(label, padX, y);

    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText(String(it.quantity), w - 145, y);

    ctx.textAlign = 'right';
    ctx.fillText(`₹${it.unit_rate}`, w - 85, y);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`₹${it.amount}`, w - padX, y);
    y += 26;
  }

  y += 2;
  drawDashedLine(y);
  y += 24;

  // Grand Total
  ctx.textAlign = 'left';
  ctx.fillStyle = '#334155';
  ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Grand Total:', padX, y);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`₹${data.total}`, w - padX, y);
  y += 20;

  // Payment Method
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Payment Method:', padX, y);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#1e293b';
  ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText((data.payment_method || '').toUpperCase(), w - padX, y);
  y += 20;

  drawDashedLine(y);
  y += 22;

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '600 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`Thank you for visiting ${shopName}!`, w / 2, y);
  y += 16;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Have a wonderful day!', w / 2, y);

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `${getFileSlug(data)}.png`;
  link.href = dataUrl;
  link.click();
}
