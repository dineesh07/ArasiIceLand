'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  Plus,
  FileDown,
  MessageSquare,
  Calendar,
  CheckCircle2,
  Wallet,
  Smartphone,
  X,
  RefreshCw,
  Package,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/formatters';
import { formatISTDisplay, todayIST } from '@/lib/dates';
import { generateVendorOrderPdf, buildVendorWhatsAppUrl } from '@/lib/pdf/vendor-order-pdf';
import { useVendorOrders, useVendorProducts } from '@/lib/api-hooks';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { Modal } from '@/components/ui/modal';

interface VendorOrderItem {
  id?: string;
  product_name: string;
  quantity: number;
  unit: string | null;
}

interface VendorOrder {
  id: string;
  order_no: number;
  order_date: string;
  status: 'ordered' | 'delivered' | 'paid';
  quoted_amount: number | null;
  delivered_on: string | null;
  paid_on: string | null;
  payment_method: 'cash' | 'upi' | null;
  note: string | null;
  items: VendorOrderItem[];
}

export default function VendorOrdersPage() {
  const today = todayIST();
  const queryClient = useQueryClient();

  const { data: orderData, isLoading } = useVendorOrders();
  const { data: products = [] } = useVendorProducts();

  const orders = ((orderData?.orders || []) as VendorOrder[]);
  const payables = orderData?.payables ?? 0;
  const settings = orderData?.settings || {
    shop_name: 'Shop Manager',
    vendor_name: 'Arun Ice Creams Distributor',
    vendor_phone: '',
    shop_phone: '',
  };

  // New Order Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderDate, setOrderDate] = useState(today);
  const [orderNote, setOrderNote] = useState('');
  const [cartItems, setCartItems] = useState<{ product_name: string; quantity: number; unit: string | null }[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

  // Add Product Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('box');

  // Mark Delivered Modal
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<VendorOrder | null>(null);
  const [quotedAmount, setQuotedAmount] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(today);

  // Pay Order Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<'cash' | 'upi'>('cash');
  const [payDate, setPayDate] = useState(today);
  const [paying, setPaying] = useState(false);

  const openNewOrder = () => {
    setOrderDate(today);
    setOrderNote('');
    setCartItems([]);
    setOrderModalOpen(true);
  };

  const addProductToOrder = (prod: any) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product_name === prod.name);
      if (existing) {
        return prev.map((i) =>
          i.product_name === prod.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product_name: prod.name, quantity: 1, unit: prod.unit }];
    });
  };

  const updateCartQuantity = (index: number, qty: number) => {
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCartItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item))
      );
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Please add at least one product to the order');
      return;
    }

    setSavingOrder(true);
    try {
      const res = await fetch('/api/vendor-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_date: orderDate,
          note: orderNote,
          items: cartItems,
        }),
      });

      if (res.ok) {
        setOrderModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      }
    } catch {
      alert('Failed to create order');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    try {
      const res = await fetch('/api/vendor-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName.trim(),
          unit: newProductUnit ? newProductUnit.trim() : null,
        }),
      });

      if (res.ok) {
        setProductModalOpen(false);
        setNewProductName('');
        queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      }
    } catch {
      alert('Failed to add product');
    }
  };

  const openDeliverDialog = (order: VendorOrder) => {
    setActiveOrder(order);
    setQuotedAmount(order.quoted_amount ? order.quoted_amount.toString() : '');
    setDeliveryDate(today);
    setDeliverModalOpen(true);
  };

  const handleMarkDelivered = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    const amt = parseInt(quotedAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid quoted bill amount from the vendor');
      return;
    }

    try {
      const res = await fetch('/api/vendor-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeOrder.id,
          status: 'delivered',
          quoted_amount: amt,
          delivered_on: deliveryDate,
        }),
      });

      if (res.ok) {
        setDeliverModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
        queryClient.invalidateQueries({ queryKey: ['reports'] });
      }
    } catch {
      alert('Failed to mark delivered');
    }
  };

  const openPayDialog = (order: VendorOrder) => {
    setActiveOrder(order);
    setPayMethod('cash');
    setPayDate(today);
    setPayModalOpen(true);
  };

  const handlePayOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    setPaying(true);

    try {
      const res = await fetch('/api/vendor-orders/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: activeOrder.id,
          payment_method: payMethod,
          date: payDate,
        }),
      });

      if (res.ok) {
        setPayModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['reports'] });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to record payment');
      }
    } catch {
      alert('Failed to pay vendor order');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Vendor Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ice cream inventory orders, WhatsApp dispatch, PDF invoices & payments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setProductModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <Package className="w-4 h-4" />
            <span>Manage Products</span>
          </Button>

          <Button onClick={openNewOrder} className="flex items-center gap-2 font-bold shadow-sm">
            <Plus className="w-5 h-5" />
            <span>New Order</span>
          </Button>
        </div>
      </div>

      {/* Payables Summary Card */}
      <Card className="p-5 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">
              Total Payable to Vendor (Delivered & Unpaid)
            </p>
            <p className="text-3xl font-black text-blue-950 mt-1">{formatINR(payables)}</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Distributor: <strong>{settings.vendor_name || 'Vendor'}</strong>
              {settings.vendor_phone ? ` (${settings.vendor_phone})` : ''}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-800">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </Card>

      {/* Orders List */}
      {isLoading && orders.length === 0 ? (
        <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No vendor orders yet</p>
          <p className="text-xs text-slate-400">Click "New Order" above to place a stock order.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const pdfData = {
              shop_name: settings.shop_name,
              shop_phone: settings.shop_phone,
              vendor_name: settings.vendor_name,
              vendor_phone: settings.vendor_phone,
              order_no: order.order_no,
              order_date: order.order_date,
              items: order.items || [],
              note: order.note,
            };

            return (
              <Card key={order.id} className="p-5 bg-white border-slate-200 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                      #{order.order_no}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        Order #{order.order_no}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Ordered: {formatISTDisplay(order.order_date)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        order.status === 'paid'
                          ? 'success'
                          : order.status === 'delivered'
                          ? 'warning'
                          : 'default'
                      }
                      className="text-xs font-bold uppercase px-3 py-1"
                    >
                      {order.status}
                    </Badge>

                    {order.quoted_amount && (
                      <span className="text-lg font-black text-slate-900">
                        {formatINR(order.quoted_amount)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="py-3 text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {order.items?.map((it, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded-lg flex justify-between font-semibold">
                      <span>{it.product_name}</span>
                      <span className="font-bold text-sky-700">
                        {it.quantity} {it.unit || ''}
                      </span>
                    </div>
                  ))}
                </div>

                {order.note && (
                  <p className="text-xs text-slate-500 italic mb-3">"{order.note}"</p>
                )}

                <div className="text-xs text-slate-400 flex flex-wrap gap-4 py-1">
                  {order.delivered_on && (
                    <span>Delivered On: <strong>{formatISTDisplay(order.delivered_on)}</strong></span>
                  )}
                  {order.paid_on && (
                    <span className="text-emerald-700 font-semibold">
                      Paid On: {formatISTDisplay(order.paid_on)} via {order.payment_method?.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={buildVendorWhatsAppUrl(pdfData)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 text-xs font-bold border border-green-200 transition-colors touch-target"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send on WhatsApp</span>
                    </a>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateVendorOrderPdf(pdfData)}
                      className="text-xs font-bold gap-1.5 h-9"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'ordered' && (
                      <Button
                        size="sm"
                        onClick={() => openDeliverDialog(order)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Delivered</span>
                      </Button>
                    )}

                    {order.status === 'delivered' && (
                      <Button
                        size="sm"
                        onClick={() => openPayDialog(order)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 gap-1"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Pay Vendor Order</span>
                      </Button>
                    )}

                    {order.status === 'paid' && (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Recorded in Expenses
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Order Modal */}
      <Modal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        title="New Vendor Order"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Order Date</label>
            <CustomDatePicker
              required
              value={orderDate}
              onChange={(val) => setOrderDate(val)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Tap Product to Add</label>
            <div className="flex flex-wrap gap-2">
              {(products as any[]).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProductToOrder(p)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-sky-50 text-xs font-bold text-slate-800 touch-target"
                >
                  + {p.name} {p.unit ? `(${p.unit})` : ''}
                </button>
              ))}
            </div>
          </div>

          {cartItems.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Items in Order</span>
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{item.product_name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(idx, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-white border font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(idx, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-white border font-bold"
                    >
                      +
                    </button>
                    <span className="text-slate-500">{item.unit || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Special Notes / Request</label>
            <Input
              placeholder="e.g. Please deliver before 2 PM"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={savingOrder} className="font-bold">
              {savingOrder ? 'Creating...' : 'Save Order'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Product Modal */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title="Add Vendor Product"
        maxWidth="md"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Product Name *</label>
            <Input
              required
              placeholder="e.g. Vanilla Cup (Carton of 24)"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Unit (e.g. box, carton, kg)</label>
            <Input
              placeholder="e.g. box"
              value={newProductUnit}
              onChange={(e) => setNewProductUnit(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setProductModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="font-bold">
              Add Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Mark Delivered Modal */}
      <Modal
        isOpen={deliverModalOpen && !!activeOrder}
        onClose={() => setDeliverModalOpen(false)}
        title="Mark Order Delivered"
        maxWidth="md"
      >
        <form onSubmit={handleMarkDelivered} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Delivered On *</label>
            <CustomDatePicker
              required
              value={deliveryDate}
              onChange={(val) => setDeliveryDate(val)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Quoted Bill Amount (₹) *</label>
            <Input
              type="number"
              min="1"
              required
              placeholder="e.g. 1500"
              value={quotedAmount}
              onChange={(e) => setQuotedAmount(e.target.value)}
              className="text-lg font-bold"
            />
            <p className="text-[11px] text-slate-400">
              This amount will show as payable until payment is recorded.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setDeliverModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="font-bold bg-amber-600 hover:bg-amber-700 text-white">
              Save Delivered
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pay Order Modal */}
      <Modal
        isOpen={payModalOpen && !!activeOrder}
        onClose={() => setPayModalOpen(false)}
        title={activeOrder ? `Pay Vendor Order #${activeOrder.order_no}` : 'Pay Vendor Order'}
        maxWidth="md"
      >
        {activeOrder && (
          <>
            <div className="p-4 bg-slate-50 rounded-xl text-center mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase">Amount to Pay</p>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {formatINR(activeOrder.quoted_amount)}
              </p>
            </div>

            <form onSubmit={handlePayOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Payment Method *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 touch-target ${
                      payMethod === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('upi')}
                    className={`p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 touch-target ${
                      payMethod === 'upi'
                        ? 'border-sky-600 bg-sky-50 text-sky-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>UPI / GPay</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Payment Date *</label>
                <CustomDatePicker
                  required
                  value={payDate}
                  onChange={(val) => setPayDate(val)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setPayModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={paying}
                  className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {paying ? 'Recording...' : 'Confirm Payment'}
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}
