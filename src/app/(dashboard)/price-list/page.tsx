'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Edit2, Trash2, X, Calculator, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/formatters';
import { calculateAmount } from '@/lib/pricing';
import { PricingType } from '@/types';
import { useServices, useCategories } from '@/lib/api-hooks';
import { CustomSelect } from '@/components/ui/custom-select';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { Modal } from '@/components/ui/modal';

interface Service {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  active: boolean;
  pricing_type: PricingType;
  unit_label: string | null;
  rate: number;
  min_charge: number | null;
  sort_order: number;
}

export default function PriceListPage() {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: services = [], isLoading } = useServices();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    pricing_type: 'FIXED' as PricingType,
    unit_label: '',
    rate: '',
    min_charge: '',
    sort_order: '0',
    active: true,
  });
  const [testQty, setTestQty] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openAddModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      category_id: (categories[0] as any)?.id || '',
      pricing_type: 'FIXED',
      unit_label: '',
      rate: '',
      min_charge: '',
      sort_order: '0',
      active: true,
    });
    setTestQty(1);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category_id: service.category_id,
      pricing_type: service.pricing_type,
      unit_label: service.unit_label || '',
      rate: service.rate.toString(),
      min_charge: service.min_charge ? service.min_charge.toString() : '',
      sort_order: service.sort_order.toString(),
      active: service.active,
    });
    setTestQty(1);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedRate = parseInt(formData.rate);
    if (isNaN(parsedRate) || parsedRate < 0) {
      setFormError('Rate must be a valid non-negative integer');
      return;
    }

    let parsedMin: number | null = null;
    if (formData.pricing_type === 'PER_UNIT_MIN') {
      parsedMin = parseInt(formData.min_charge);
      if (isNaN(parsedMin) || parsedMin < 0) {
        setFormError('Minimum charge is required for this pricing type');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        category_id: formData.category_id,
        pricing_type: formData.pricing_type,
        unit_label: formData.unit_label || null,
        rate: parsedRate,
        min_charge: parsedMin,
        sort_order: parseInt(formData.sort_order) || 0,
        active: formData.active,
      };

      let res;
      if (editingService) {
        res = await fetch('/api/services', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingService.id }),
        });
      } else {
        res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || 'Failed to save service');
        setSaving(false);
        return;
      }

      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['services'] });
    } catch {
      setFormError('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete or deactivate "${service.name}"?`)) return;

    try {
      const res = await fetch(`/api/services?id=${service.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.deactivated) {
        alert(data.message);
      }
      queryClient.invalidateQueries({ queryKey: ['services'] });
    } catch {
      alert('Failed to remove service');
    }
  };

  const previewAmount = (() => {
    const r = parseInt(formData.rate) || 0;
    const m = parseInt(formData.min_charge) || 0;
    try {
      return calculateAmount({
        pricing_type: formData.pricing_type,
        rate: r,
        min_charge: formData.pricing_type === 'PER_UNIT_MIN' ? m : null,
        quantity: Math.max(1, testQty || 1),
      });
    } catch {
      return 0;
    }
  })();

  const filteredServices = (services as Service[]).filter((s) => {
    const matchesCategory = selectedCategory === 'all' || s.category_id === selectedCategory;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Price List & Services</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage counter rates for Internet Centre, Ice Cream, and Tailoring
          </p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2 shadow-sm">
          <Plus className="w-5 h-5" />
          <span>Add New Service</span>
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors touch-target ${
              selectedCategory === 'all'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Categories ({services.length})
          </button>
          {(categories as any[]).map((c) => {
            const count = (services as Service[]).filter((s) => s.category_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors touch-target ${
                  selectedCategory === c.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-4 text-slate-400" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 bg-white"
          />
        </div>
      </div>

      {/* Services Grid */}
      {isLoading && services.length === 0 ? (
        <div className="text-center py-12 text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading prices...</span>
        </div>
      ) : filteredServices.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          <Tag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No services found</p>
          <p className="text-sm">Click "Add New Service" above to add your first item.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className={`relative transition-all hover:shadow-md ${
                !service.active ? 'opacity-60 bg-slate-50' : 'bg-white'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                      {service.category_name}
                    </span>
                    <CardTitle className="text-lg mt-1 text-slate-900">{service.name}</CardTitle>
                  </div>
                  <Badge variant={service.active ? 'success' : 'secondary'}>
                    {service.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <span className="text-2xl font-black text-slate-900">
                      {formatINR(service.rate)}
                    </span>
                    {service.unit_label && (
                      <span className="text-xs font-semibold text-slate-500 ml-1">
                        / {service.unit_label}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 block">
                      {service.pricing_type === 'FIXED' && 'Fixed Price'}
                      {service.pricing_type === 'PER_UNIT' && 'Per Unit'}
                      {service.pricing_type === 'PER_UNIT_MIN' && 'Per Unit w/ Min'}
                    </span>
                    {service.min_charge && (
                      <span className="text-xs font-bold text-sky-700">
                        Min: {formatINR(service.min_charge)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(service)}
                    className="h-10 text-xs font-bold gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(service)}
                    className="h-10 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? 'Edit Service' : 'Add New Service'}
        maxWidth="lg"
      >
        {formError && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <CustomSelect
              value={formData.category_id}
              onChange={(val) => setFormData({ ...formData, category_id: val })}
              options={(categories as any[]).map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              placeholder="Select category..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Service Name</label>
            <Input
              required
              placeholder="e.g. B/W Single Side, Vanilla Cup, Blouse"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Pricing Formula</label>
            <CustomSelect
              value={formData.pricing_type}
              onChange={(val) =>
                setFormData({ ...formData, pricing_type: val as PricingType })
              }
              options={[
                {
                  value: 'FIXED',
                  label: 'Fixed price (single price per item/application)',
                  description: 'One flat rate (e.g. Aadhaar, ice cream)',
                },
                {
                  value: 'PER_UNIT',
                  label: 'Per unit (rate × quantity)',
                  description: 'Rate multiplied strictly by quantity (e.g. typing)',
                },
                {
                  value: 'PER_UNIT_MIN',
                  label: 'Per unit with minimum charge (max of rate × qty or min)',
                  description: 'Standard for printouts (e.g. ₹2/page, min ₹10)',
                },
              ]}
            />
          </div>

          {formData.pricing_type !== 'FIXED' && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Unit Label</label>
              <Input
                placeholder="e.g. page, copy, meter"
                value={formData.unit_label}
                onChange={(e) => setFormData({ ...formData, unit_label: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Rate (₹)</label>
              <Input
                type="number"
                min="0"
                step="1"
                required
                placeholder="2"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              />
            </div>

            {formData.pricing_type === 'PER_UNIT_MIN' && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Minimum Charge (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="10"
                  value={formData.min_charge}
                  onChange={(e) => setFormData({ ...formData, min_charge: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-sky-900">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-sky-600" />
                Live Pricing Preview
              </span>
              <span>Try It:</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <span>Qty:</span>
                <Input
                  type="number"
                  min="1"
                  value={testQty}
                  onChange={(e) => setTestQty(parseInt(e.target.value) || 1)}
                  className="w-20 h-10 text-center font-bold bg-white"
                />
              </div>
              <span className="text-slate-400 font-bold">→</span>
              <div className="text-base font-extrabold text-sky-700">
                {formatINR(previewAmount)}
              </div>
            </div>
            {formData.pricing_type === 'PER_UNIT_MIN' && (
              <p className="text-[11px] text-sky-800">
                Formula: max({parseInt(formData.rate) || 0} × {testQty}, {parseInt(formData.min_charge) || 0})
              </p>
            )}
          </div>

          <div className="pt-2">
            <CustomCheckbox
              id="active-toggle"
              checked={formData.active}
              onChange={(checked) => setFormData({ ...formData, active: checked })}
              label="Show on New Entry counter screen (Active)"
              description="When enabled, service appears as a quick-tap card at the counter"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="font-bold">
              {saving ? 'Saving...' : editingService ? 'Update Service' : 'Save Service'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
