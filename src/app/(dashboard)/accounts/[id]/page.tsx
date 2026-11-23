'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CreditCard,
  Phone,
  Wallet,
  Smartphone,
  MessageSquare,
  Plus,
  Receipt,
  Calendar,
  AlertTriangle,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/formatters';
import { formatISTDisplay, todayIST } from '@/lib/dates';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { Modal } from '@/components/ui/modal';

interface BillItem {
  service_name: string;
  quantity: number;
  unit_rate: number;
  amount: number;
}

interface AccountBill {
  id: string;
  bill_date: string;
  total: number;
  payment_method: string;
  created_at: string;
  items: BillItem[];
}

interface PaymentRecord {
  id: string;
  amount: number;
  method: 'cash' | 'upi';
  paid_on: string;
  note: string | null;
  created_at: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  phone: string | null;
  is_account: boolean;
  active: boolean;
  balance: number;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const today = todayIST();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [bills, setBills] = useState<AccountBill[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'upi'>('cash');
  const [payDate, setPayDate] = useState(today);
  const [payNote, setPayNote] = useState('');
  const [recordingPay, setRecordingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [confirmAdvance, setConfirmAdvance] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      const data = await res.json();
      if (data.customer) {
        setCustomer(data.customer);
        setBills(data.bills || []);
        setPayments(data.payments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [customerId]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);

    const amt = parseInt(payAmount);
    if (!amt || amt <= 0) {
      setPayError('Payment amount must be greater than zero');
      return;
    }

    if (customer && amt > customer.balance && !confirmAdvance) {
      setConfirmAdvance(true);
      return;
    }

    setRecordingPay(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          amount: amt,
          method: payMethod,
          paid_on: payDate,
          note: payNote,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setPayError(err.error || 'Failed to record payment');
        setRecordingPay(false);
        return;
      }

      setPayModalOpen(false);
      setPayAmount('');
      setPayNote('');
      setConfirmAdvance(false);
      await fetchDetail();
    } catch {
      setPayError('Error recording payment');
    } finally {
      setRecordingPay(false);
    }
  };

  // WhatsApp Reminder URL
  const generateWhatsAppUrl = () => {
    if (!customer?.phone) return '#';
    const clean = customer.phone.replace(/\D/g, '');
    const phoneIntl = clean.length === 10 ? `91${clean}` : clean;
    const msg = `Dear ${customer.name}, your outstanding balance at our shop is ${formatINR(customer.balance)}. Kindly pay via Cash or GPay/UPI at your earliest convenience. Thank you!`;
    return `https://wa.me/${phoneIntl}?text=${encodeURIComponent(msg)}`;
  };

  // Combine bills and payments into a chronological timeline
  type TimelineItem =
    | { type: 'bill'; date: string; data: AccountBill }
    | { type: 'payment'; date: string; data: PaymentRecord };

  const timeline: TimelineItem[] = [
    ...bills.map((b) => ({ type: 'bill' as const, date: b.bill_date, data: b })),
    ...payments.map((p) => ({ type: 'payment' as const, date: p.paid_on, data: p })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span>Loading ledger...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Link href="/accounts" className="text-sky-600 font-bold flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Accounts
        </Link>
        <Card className="p-8 text-center text-slate-500">Customer not found.</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/accounts"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Accounts List</span>
      </Link>

      {/* Customer Profile & Balance Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900">{customer.name}</h1>
            <Badge variant="default" className="text-xs">
              Credit Account
            </Badge>
          </div>
          {customer.phone ? (
            <a
              href={`tel:${customer.phone}`}
              className="text-sm font-semibold text-sky-600 hover:underline flex items-center gap-1.5 mt-1"
            >
              <Phone className="w-4 h-4" />
              <span>{customer.phone}</span>
            </a>
          ) : (
            <p className="text-xs text-slate-400 mt-1">No phone number</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left sm:text-right">
            <span className="text-xs font-bold text-slate-500 uppercase block">
              Current Outstanding Balance
            </span>
            <span
              className={`text-3xl font-black ${
                customer.balance > 0 ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {formatINR(customer.balance)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => {
                setPayAmount(customer.balance > 0 ? customer.balance.toString() : '');
                setPayModalOpen(true);
              }}
              className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-12 shadow-sm"
            >
              <Wallet className="w-4 h-4" />
              <span>Record Payment</span>
            </Button>

            {customer.phone && customer.balance > 0 && (
              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-sm transition-colors touch-target"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Reminder</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Ledger History Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">Account Ledger Timeline</h2>
          <span className="text-xs text-slate-500 font-semibold">
            {timeline.length} transactions
          </span>
        </div>

        {timeline.length === 0 ? (
          <Card className="p-8 text-center text-slate-400">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No transactions recorded yet</p>
            <p className="text-xs text-slate-400">
              Bills added to this customer's account and payments will show here.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {timeline.map((item, idx) => {
              if (item.type === 'bill') {
                const bill = item.data;
                return (
                  <Card key={`bill-${bill.id}`} className="p-4 bg-white border-l-4 border-l-red-500">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                            Bill (Debit)
                          </Badge>
                          <span className="text-xs text-slate-400 font-medium">
                            {formatISTDisplay(bill.bill_date)}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-700 space-y-0.5">
                          {bill.items?.map((it, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="font-semibold">{it.service_name} × {it.quantity}</span>
                              <span className="text-slate-400">({formatINR(it.amount)})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-red-600">
                          +{formatINR(bill.total)}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-semibold">
                          Added to Balance
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              } else {
                const pay = item.data;
                return (
                  <Card key={`pay-${pay.id}`} className="p-4 bg-emerald-50/50 border-l-4 border-l-emerald-500">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="success" className="text-[10px] uppercase font-bold">
                            Payment (Credit)
                          </Badge>
                          <span className="text-xs text-slate-400 font-medium">
                            {formatISTDisplay(pay.paid_on)}
                          </span>
                          <span className="text-xs font-bold text-slate-600 uppercase">
                            via {pay.method}
                          </span>
                        </div>
                        {pay.note && (
                          <p className="text-xs text-slate-500 italic mt-1">"{pay.note}"</p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-700">
                          -{formatINR(pay.amount)}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-semibold">
                          Paid
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* Record Payment Dialog */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Record Payment"
        maxWidth="md"
      >
        {payError && (
          <div className="p-3 mb-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {payError}
          </div>
        )}

        {/* Advance payment confirmation warning */}
        {confirmAdvance && (
          <div className="p-3.5 mb-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Payment exceeds current pending balance ({formatINR(customer.balance)})</span>
            </div>
            <p className="text-xs text-amber-800">
              This payment will create an advance credit for {customer.name}. Do you want to proceed?
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmAdvance(false)}
                className="h-8 text-xs"
              >
                Change Amount
              </Button>
              <Button
                size="sm"
                onClick={handleRecordPayment}
                className="h-8 text-xs bg-amber-600 text-white font-bold"
              >
                Confirm Advance
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Amount Paid (₹) *</label>
            <Input
              type="number"
              min="1"
              required
              placeholder="e.g. 200"
              value={payAmount}
              onChange={(e) => {
                setPayAmount(e.target.value);
                setConfirmAdvance(false);
              }}
              className="text-lg font-bold"
            />
          </div>

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

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Optional Note</label>
            <Input
              placeholder="e.g. Cleared Diwali printout balance"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setPayModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={recordingPay}
              className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {recordingPay ? 'Saving...' : 'Save Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

