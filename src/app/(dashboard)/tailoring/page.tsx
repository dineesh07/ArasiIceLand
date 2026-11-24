'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Scissors,
  Plus,
  Phone,
  Calendar,
  CheckCircle2,
  Search,
  Check,
  X,
  CreditCard,
  Wallet,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/formatters';
import { formatISTDisplay, todayIST } from '@/lib/dates';
import { useTailoringOrders, useServices } from '@/lib/api-hooks';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { Modal } from '@/components/ui/modal';

interface TailoringItem {
  service_id: string;
  service_name: string;
  quantity: number;
  unit_rate: number;
}

interface TailoringOrder {
  id: string;
  customer_name: string;
  phone: string;
  received_on: string;
  delivery_date: string;
  status: 'received' | 'ready' | 'delivered';
  total: number;
  note: string | null;
  delivered_at: string | null;
  customer_id: string | null;
  urgency: 'overdue' | 'due_today' | 'upcoming' | 'delivered';
  items: TailoringItem[];
}

export default function TailoringPage() {
  const today = todayIST();
  const queryClient = useQueryClient();

  const { data: orderData, isLoading: ordersLoading, refetch } = useTailoringOrders();
  const { data: allServices = [] } = useServices();

  const orders = ((orderData?.orders || []) as TailoringOrder[]);
  const overdueCount = orderData?.overdueCount ?? 0;
  const pendingTotal = orderData?.pendingTotal ?? 0;

  const tailoringServices = (allServices as any[]).filter((s) =>
    s.category_name?.toLowerCase().includes('tailor') && s.active
  );

  const [activeTab, setActiveTab] = useState<'pending' | 'ready' | 'delivered' | 'all'>('pending');
  const [search, setSearch] = useState('');

  // New Order Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [note, setNote] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ service_id: string; service_name: string; quantity: number; unit_rate: number }[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Deliver Dialog
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [orderToDeliver, setOrderToDeliver] = useState<TailoringOrder | null>(null);
  const [delivering, setDelivering] = useState(false);

  const openNewOrderModal = () => {
    setCustomerName('');
    setPhone('');
    setDeliveryDate('');
    setNote('');
    setSelectedItems([]);
    setFormError(null);
    setModalOpen(true);
  };

  const addItemToOrder = (srv: any) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.service_id === srv.id);
      if (existing) {
        return prev.map((i) =>
          i.service_id === srv.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          service_id: srv.id,
          service_name: srv.name,
          quantity: 1,
          unit_rate: srv.rate,
        },
      ];
    });
  };

  const updateItemQuantity = (index: number, qty: number) => {
    if (qty <= 0) {
      setSelectedItems((prev) => prev.filter((_, i) => i !== index));
    } else {
      setSelectedItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item))
      );
    }
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('Customer name is required');
      return;
    }
    if (!phone.trim()) {
      setFormError('Phone number is required');
      return;
    }
    if (!deliveryDate) {
      setFormError('Delivery date is required');
      return;
    }
    if (selectedItems.length === 0) {
      setFormError('Please select at least one garment item');
      return;
    }

    setSavingOrder(true);
    try {
      const res = await fetch('/api/tailoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          phone: phone,
          delivery_date: deliveryDate,
          note: note,
          items: selectedItems,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || 'Failed to save order');
        setSavingOrder(false);
        return;
      }

      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tailoring-orders'] });
    } catch {
      setFormError('Error saving order');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleStatusChange = async (orderId: string, nextStatus: 'ready') => {
    try {
      const res = await fetch('/api/tailoring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: nextStatus }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['tailoring-orders'] });
      }
    } catch {
      alert('Failed to update status');
    }
  };

  const handleDeliver = (order: TailoringOrder) => {
    setOrderToDeliver(order);
    setDeliverModalOpen(true);
  };

  const executeDelivery = async (method: 'cash' | 'upi' | 'account') => {
    if (!orderToDeliver) return;
    setDelivering(true);
    try {
      const res = await fetch('/api/tailoring/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderToDeliver.id,
          payment_method: method,
          date: today,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to complete delivery');
        setDelivering(false);
        return;
      }

      setDeliverModalOpen(false);
      setOrderToDeliver(null);
      queryClient.invalidateQueries({ queryKey: ['tailoring-orders'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['token-preview'] });
    } catch {
      alert('Error recording delivery');
    } finally {
      setDelivering(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    let matchTab = true;
    if (activeTab === 'pending') matchTab = o.status === 'received';
    else if (activeTab === 'ready') matchTab = o.status === 'ready';
    else if (activeTab === 'delivered') matchTab = o.status === 'delivered';

    const matchSearch =
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search);

    return matchTab && matchSearch;
  });

  const orderFormTotal = selectedItems.reduce((sum, item) => sum + item.unit_rate * item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tailoring Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Blouse, Churidar, and custom garment orders & deliveries
          </p>
        </div>

        <Button onClick={openNewOrderModal} className="flex items-center gap-2 shadow-sm font-bold">
          <Plus className="w-5 h-5" />
          <span>New Tailoring Order</span>
        </Button>
      </div>

      {/* Summary Chips Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-sky-50 border-sky-100">
          <p className="text-xs font-bold text-sky-800 uppercase">Expected Work in Hand</p>
          <p className="text-2xl font-black text-sky-900 mt-1">{formatINR(pendingTotal)}</p>
          <p className="text-[11px] text-sky-700 mt-0.5">Will generate income upon delivery</p>
        </Card>

        <Card className={`p-4 ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50'}`}>
          <p className={`text-xs font-bold uppercase ${overdueCount > 0 ? 'text-red-700' : 'text-slate-500'}`}>
            Overdue Orders
          </p>
          <p className={`text-2xl font-black mt-1 ${overdueCount > 0 ? 'text-red-700' : 'text-slate-800'}`}>
            {overdueCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Past target delivery date</p>
        </Card>

        <Card className="p-4 bg-purple-50 border-purple-100 col-span-2 sm:col-span-1">
          <p className="text-xs font-bold text-purple-800 uppercase">Ready for Pickup</p>
          <p className="text-2xl font-black text-purple-900 mt-1">
            {orders.filter((o) => o.status === 'ready').length}
          </p>
          <p className="text-[11px] text-purple-700 mt-0.5">Stitched & ready to deliver</p>
        </Card>
      </div>

      {/* Tab Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors touch-target ${
              activeTab === 'pending'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Pending ({orders.filter((o) => o.status === 'received').length})
          </button>
          <button
            onClick={() => setActiveTab('ready')}
            className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors touch-target ${
              activeTab === 'ready'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Ready ({orders.filter((o) => o.status === 'ready').length})
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors touch-target ${
              activeTab === 'delivered'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Delivered ({orders.filter((o) => o.status === 'delivered').length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors touch-target ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Orders ({orders.length})
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-4 text-slate-400" />
          <Input
            placeholder="Search customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 bg-white"
          />
        </div>
      </div>

      {/* Orders List */}
      {ordersLoading && orders.length === 0 ? (
        <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading tailoring orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          <Scissors className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No tailoring orders found</p>
          <p className="text-xs text-slate-400">Tap "New Tailoring Order" to take a customer order.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isOverdue = order.status !== 'delivered' && order.urgency === 'overdue';
            const isDueToday = order.status !== 'delivered' && order.urgency === 'due_today';

            return (
              <Card
                key={order.id}
                className={`transition-all hover:shadow-md bg-white border-2 ${
                  isOverdue
                    ? 'border-red-300 bg-red-50/20'
                    : isDueToday
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-slate-900 font-bold">
                        {order.customer_name}
                      </CardTitle>
                      <a
                        href={`tel:${order.phone}`}
                        className="text-xs font-semibold text-sky-600 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{order.phone}</span>
                      </a>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">{formatINR(order.total)}</p>
                      <Badge
                        variant={
                          order.status === 'delivered'
                            ? 'success'
                            : order.status === 'ready'
                            ? 'default'
                            : isOverdue
                            ? 'destructive'
                            : isDueToday
                            ? 'warning'
                            : 'secondary'
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {order.status === 'delivered'
                          ? 'Delivered'
                          : order.status === 'ready'
                          ? 'Ready'
                          : isOverdue
                          ? 'Overdue'
                          : isDueToday
                          ? 'Due Today'
                          : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Delivery Date:</span>
                      <span
                        className={`font-bold ${
                          isOverdue ? 'text-red-600' : isDueToday ? 'text-amber-700' : 'text-slate-900'
                        }`}
                      >
                        {formatISTDisplay(order.delivery_date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Received:</span>
                      <span>{formatISTDisplay(order.received_on)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1">
                    {order.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between py-0.5">
                        <span className="font-medium">
                          {it.service_name} × {it.quantity}
                        </span>
                        <span className="font-bold">{formatINR(it.unit_rate * it.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {order.note && (
                    <p className="text-xs text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                      "{order.note}"
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    {order.status === 'received' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(order.id, 'ready')}
                        className="h-9 font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Ready</span>
                      </Button>
                    )}

                    {order.status === 'ready' && (
                      <Button
                        size="sm"
                        onClick={() => handleDeliver(order)}
                        className="h-9 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Deliver & Bill</span>
                      </Button>
                    )}

                    {order.status === 'delivered' && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Delivered & Invoiced
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Order Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Tailoring Order"
        maxWidth="lg"
      >
        {formError && (
          <div className="p-3 mb-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {formError}
          </div>
        )}

        <form onSubmit={handleSaveOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Customer Name *</label>
                  <Input
                    required
                    placeholder="e.g. Meenakshi"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Phone Number *</label>
                  <Input
                    required
                    placeholder="e.g. 9840012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Target Delivery Date *</label>
                <CustomDatePicker
                  required
                  placeholder="Pick delivery date..."
                  value={deliveryDate}
                  onChange={(val) => setDeliveryDate(val)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Pick Garment Services</label>
                <div className="flex flex-wrap gap-2">
                  {tailoringServices.map((srv: any) => (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => addItemToOrder(srv)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-sky-50 hover:border-sky-400 text-xs font-bold text-slate-800 transition-colors"
                    >
                      + {srv.name} ({formatINR(srv.rate)})
                    </button>
                  ))}
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Selected Garments</span>
                  {selectedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{item.service_name}</span>
                        <span className="text-slate-500 ml-1">({formatINR(item.unit_rate)})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(idx, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-white border flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(idx, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-white border flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                        <span className="font-black text-slate-900 ml-2">
                          {formatINR(item.unit_rate * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 border-t flex justify-between font-bold text-sm text-slate-900">
                    <span>Total Expected:</span>
                    <span className="text-base text-sky-700">{formatINR(orderFormTotal)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Notes / Measurements (Optional)</label>
                <Input
                  placeholder="e.g. Neck piping gold, 2 inches loose"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingOrder} className="font-bold">
                  {savingOrder ? 'Saving...' : 'Create Order'}
                </Button>
              </div>
            </form>
      </Modal>

      {/* Deliver Payment Dialog */}
      <Modal
        isOpen={deliverModalOpen && !!orderToDeliver}
        onClose={() => setDeliverModalOpen(false)}
        maxWidth="md"
        showCloseButton={false}
      >
        {orderToDeliver && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Deliver & Collect Payment</h2>
              <p className="text-xs text-slate-500">
                Customer: <strong>{orderToDeliver.customer_name}</strong>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <p className="text-xs font-bold text-slate-400 uppercase">Amount Due</p>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {formatINR(orderToDeliver.total)}
              </p>
            </div>

            <div className="space-y-2">
              <Button
                disabled={delivering}
                onClick={() => executeDelivery('cash')}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-base"
              >
                <Wallet className="w-5 h-5" />
                <span>Cash Payment</span>
              </Button>

              <Button
                disabled={delivering}
                onClick={() => executeDelivery('upi')}
                className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white font-bold gap-2 text-base"
              >
                <Smartphone className="w-5 h-5" />
                <span>UPI Payment</span>
              </Button>

              <Button
                disabled={delivering}
                variant="outline"
                onClick={() => executeDelivery('account')}
                className="w-full h-12 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold gap-2 text-sm"
              >
                <CreditCard className="w-4 h-4" />
                <span>Add to Customer Credit Account</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              disabled={delivering}
              onClick={() => setDeliverModalOpen(false)}
              className="w-full text-slate-500"
            >
              Cancel
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
