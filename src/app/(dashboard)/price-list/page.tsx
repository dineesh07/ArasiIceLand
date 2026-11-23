'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Calculator,
  Search,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/formatters';
import { calculateAmount } from '@/lib/pricing';
import { PricingType, formatServiceName } from '@/types';
import { useServices, useCategories, useSubcategories } from '@/lib/api-hooks';
import { CustomSelect } from '@/components/ui/custom-select';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { Modal } from '@/components/ui/modal';

interface Service {
  id: string;
  category_id: string;
  category_name: string;
  subcategory_id?: string | null;
  subcategory_name?: string | null;
  subcategory_sort_order?: number | null;
  size_label?: string | null;
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
  const [showInactive, setShowInactive] = useState(false);

  // Ice Cream category detection
  const iceCreamCategory = (categories as any[]).find((c) =>
    c.name.toLowerCase().includes('ice')
  );
  const isIceCreamCategoryActive = selectedCategory === iceCreamCategory?.id;
  const { data: subcategories = [] } = useSubcategories(iceCreamCategory?.id);

  // Collapsible groups state (key: subcategory_id or '__none__', value: isCollapsed boolean)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Inline Price Editing State
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineRate, setInlineRate] = useState<string>('');
  const [inlineSaving, setInlineSaving] = useState(false);

  // Manage Groups Modal State
  const [manageGroupsOpen, setManageGroupsOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // Add/Edit Service Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    subcategory_id: '',
    size_label: '',
    pricing_type: 'FIXED' as PricingType,
    unit_label: '',
    rate: '',
    min_charge: '',
    sort_order: '0',
    active: true,
  });
  const [showQuickAddGroup, setShowQuickAddGroup] = useState(false);
  const [quickGroupName, setQuickGroupName] = useState('');
  const [testQty, setTestQty] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const openAddModal = () => {
    setEditingService(null);
    const catId = (selectedCategory !== 'all' ? selectedCategory : (categories[0] as any)?.id) || '';
    const isIce = catId === iceCreamCategory?.id;
    setFormData({
      name: '',
      category_id: catId,
      subcategory_id: isIce && (subcategories[0] as any)?.id ? (subcategories[0] as any)?.id : '',
      size_label: '',
      pricing_type: 'FIXED',
      unit_label: isIce ? 'piece' : '',
      rate: '',
      min_charge: '',
      sort_order: '0',
      active: true,
    });
    setTestQty(1);
    setFormError(null);
    setShowQuickAddGroup(false);
    setModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category_id: service.category_id,
      subcategory_id: service.subcategory_id || '',
      size_label: service.size_label || '',
      pricing_type: service.pricing_type,
      unit_label: service.unit_label || '',
      rate: service.rate.toString(),
      min_charge: service.min_charge ? service.min_charge.toString() : '',
      sort_order: service.sort_order.toString(),
      active: service.active,
    });
    setTestQty(1);
    setFormError(null);
    setShowQuickAddGroup(false);
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
        subcategory_id: formData.subcategory_id || null,
        size_label: formData.size_label ? formData.size_label.trim() : null,
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

  // Quick inline price save
  const startInlineEdit = (service: Service) => {
    setInlineEditingId(service.id);
    setInlineRate(service.rate.toString());
  };

  const handleInlinePriceSave = async (serviceId: string) => {
    const parsed = parseInt(inlineRate);
    if (isNaN(parsed) || parsed < 0) {
      setInlineEditingId(null);
      return;
    }
    setInlineSaving(true);
    try {
      await fetch('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: serviceId, rate: parsed }),
      });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    } catch {
      alert('Failed to update rate');
    } finally {
      setInlineEditingId(null);
      setInlineSaving(false);
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (service: Service) => {
    try {
      await fetch('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: service.id, active: !service.active }),
      });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    } catch {
      alert('Failed to update service status');
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

  // Quick Add Subcategory in modal
  const handleQuickAddSubcategory = async () => {
    if (!quickGroupName.trim() || !iceCreamCategory) return;
    try {
      const res = await fetch('/api/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: iceCreamCategory.id,
          name: quickGroupName.trim(),
          sort_order: (subcategories.length || 0) + 1,
        }),
      });
      const data = await res.json();
      if (data.subcategory) {
        await queryClient.invalidateQueries({ queryKey: ['subcategories'] });
        setFormData({ ...formData, subcategory_id: data.subcategory.id });
        setQuickGroupName('');
        setShowQuickAddGroup(false);
      }
    } catch {
      alert('Failed to create group');
    }
  };

  // Manage Groups operations
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !iceCreamCategory) return;
    try {
      await fetch('/api/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: iceCreamCategory.id,
          name: newGroupName.trim(),
          sort_order: (subcategories.length || 0) + 1,
        }),
      });
      setNewGroupName('');
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
    } catch {
      alert('Failed to add group');
    }
  };

  const handleUpdateGroup = async (id: string) => {
    if (!editingGroupName.trim()) return;
    try {
      await fetch('/api/subcategories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editingGroupName.trim() }),
      });
      setEditingGroupId(null);
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    } catch {
      alert('Failed to rename group');
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`Delete group "${name}"? Services inside will be unassigned (not deleted).`)) return;
    try {
      await fetch(`/api/subcategories?id=${id}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    } catch {
      alert('Failed to delete group');
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

  // Filter services by category, search, and active/inactive toggle
  const filteredServices = (services as Service[]).filter((s) => {
    const matchesCategory = selectedCategory === 'all' || s.category_id === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.size_label && s.size_label.toLowerCase().includes(search.toLowerCase())) ||
      (s.subcategory_name && s.subcategory_name.toLowerCase().includes(search.toLowerCase()));
    const matchesActive = showInactive ? true : s.active;
    return matchesCategory && matchesSearch && matchesActive;
  });

  // Group services when Ice Cream category is active
  const groupedIceCream = (() => {
    if (!isIceCreamCategoryActive) return null;

    const groups: {
      id: string;
      name: string;
      sort_order: number;
      items: Service[];
    }[] = [];

    // Order defined by subcategories
    (subcategories as any[]).forEach((sub) => {
      const items = filteredServices.filter((s) => s.subcategory_id === sub.id);
      groups.push({
        id: sub.id,
        name: sub.name,
        sort_order: sub.sort_order || 0,
        items,
      });
    });

    // Unassigned items
    const unassigned = filteredServices.filter((s) => !s.subcategory_id);
    if (unassigned.length > 0) {
      groups.push({
        id: '__none__',
        name: 'Other / Unassigned',
        sort_order: 999,
        items: unassigned,
      });
    }

    return groups;
  })();

  const renderServiceCard = (service: Service) => (
    <Card
      key={service.id}
      className={`relative transition-all hover:shadow-md ${
        !service.active ? 'opacity-60 bg-slate-50 border-dashed border-slate-300' : 'bg-white'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                {service.subcategory_name || service.category_name}
              </span>
              {service.size_label && (
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
                  {service.size_label}
                </span>
              )}
            </div>
            <CardTitle className="text-base font-bold mt-1 text-slate-900 leading-tight">
              {service.name}
            </CardTitle>
          </div>

          <button
            type="button"
            onClick={() => handleToggleActive(service)}
            title={service.active ? 'Click to make unavailable' : 'Click to make available'}
            className="flex-shrink-0"
          >
            <Badge variant={service.active ? 'success' : 'secondary'} className="cursor-pointer select-none">
              {service.active ? 'Active' : 'Unavailable'}
            </Badge>
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
          <div>
            {inlineEditingId === service.id ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-500">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  autoFocus
                  disabled={inlineSaving}
                  value={inlineRate}
                  onChange={(e) => setInlineRate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInlinePriceSave(service.id);
                    if (e.key === 'Escape') setInlineEditingId(null);
                  }}
                  onBlur={() => handleInlinePriceSave(service.id)}
                  className="w-24 h-9 font-black text-lg bg-white p-1"
                />
                <button
                  type="button"
                  onClick={() => handleInlinePriceSave(service.id)}
                  className="p-1 text-emerald-600 hover:text-emerald-700"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setInlineEditingId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => startInlineEdit(service)}
                className="group/rate cursor-pointer flex items-baseline gap-1"
                title="Click to quickly edit price"
              >
                <span className="text-2xl font-black text-slate-900 group-hover/rate:text-sky-600">
                  {formatINR(service.rate)}
                </span>
                {service.unit_label && (
                  <span className="text-xs font-semibold text-slate-500">
                    / {service.unit_label}
                  </span>
                )}
                <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover/rate:opacity-100 transition-opacity ml-1" />
              </div>
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

        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleToggleActive(service)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            {service.active ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Disable</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Activate</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditModal(service)}
              className="h-9 text-xs font-bold gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(service)}
              className="h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
        <div className="flex items-center gap-2">
          {isIceCreamCategoryActive && (
            <Button
              variant="outline"
              onClick={() => setManageGroupsOpen(true)}
              className="flex items-center gap-2 font-bold text-xs h-11"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-600" />
              <span>Manage Groups</span>
            </Button>
          )}
          <Button onClick={openAddModal} className="flex items-center gap-2 shadow-sm font-bold text-xs h-11">
            <Plus className="w-5 h-5" />
            <span>Add New Service</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none bg-white px-3 py-2.5 rounded-xl border border-slate-200 shadow-xs">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span>Show unavailable items</span>
            </label>

            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <Input
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid or Ice Cream Grouped Sections */}
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
      ) : isIceCreamCategoryActive && groupedIceCream ? (
        /* Ice Cream Collapsible Groups */
        <div className="space-y-6">
          {groupedIceCream.map((group) => {
            const isCollapsed = !!collapsedGroups[group.id];
            return (
              <div key={group.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100 flex items-center justify-between transition-colors border-b border-slate-200 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-500" />
                    )}
                    <h2 className="font-extrabold text-base text-slate-900">{group.name}</h2>
                    <Badge variant="secondary" className="font-bold text-xs bg-sky-50 text-sky-700 border-sky-200">
                      {group.items.length} items
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">
                    {isCollapsed ? 'Click to expand' : 'Click to collapse'}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="p-4">
                    {group.items.length === 0 ? (
                      <div className="text-sm text-slate-400 py-4 text-center">
                        No items in this sub-category
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.items.map(renderServiceCard)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Standard Flat Grid for All / Internet Centre / Tailoring */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map(renderServiceCard)}
        </div>
      )}

      {/* Manage Groups Modal */}
      <Modal
        isOpen={manageGroupsOpen}
        onClose={() => setManageGroupsOpen(false)}
        title="Manage Ice Cream Groups"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Rename, add, or delete sub-categories. Deleting a group unlinks its items to "Other / Unassigned" without deleting any products.
          </p>

          <div className="flex items-center gap-2">
            <Input
              placeholder="New group name (e.g. Sticks)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="h-10 text-sm"
            />
            <Button onClick={handleCreateGroup} className="h-10 font-bold whitespace-nowrap">
              Add Group
            </Button>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {(subcategories as any[]).map((sub) => (
              <div key={sub.id} className="py-2.5 flex items-center justify-between gap-2">
                {editingGroupId === sub.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingGroupName}
                      onChange={(e) => setEditingGroupName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateGroup(sub.id)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 bg-emerald-50 rounded"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingGroupId(null)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-sm text-slate-800">{sub.name}</span>
                      <span className="text-xs text-slate-400">({sub.service_count || 0} items)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingGroupId(sub.id);
                          setEditingGroupName(sub.name);
                        }}
                        className="h-8 px-2 text-xs text-slate-600"
                      >
                        Rename
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGroup(sub.id, sub.name)}
                        className="h-8 px-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t flex justify-end">
            <Button variant="outline" onClick={() => setManageGroupsOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

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
              onChange={(val) => {
                const isIce = val === iceCreamCategory?.id;
                setFormData({
                  ...formData,
                  category_id: val,
                  subcategory_id: isIce && (subcategories[0] as any)?.id ? (subcategories[0] as any)?.id : '',
                  pricing_type: isIce ? 'FIXED' : formData.pricing_type,
                  unit_label: isIce ? 'piece' : formData.unit_label,
                });
              }}
              options={(categories as any[]).map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              placeholder="Select category..."
            />
          </div>

          {/* Subcategory dropdown if Ice Cream */}
          {formData.category_id === iceCreamCategory?.id && (
            <div className="space-y-1.5 bg-sky-50/50 p-3 rounded-xl border border-sky-100">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-sky-950">Sub-category / Group</label>
                <button
                  type="button"
                  onClick={() => setShowQuickAddGroup(!showQuickAddGroup)}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New group</span>
                </button>
              </div>

              {showQuickAddGroup ? (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="e.g. Cones"
                    value={quickGroupName}
                    onChange={(e) => setQuickGroupName(e.target.value)}
                    className="h-9 text-xs bg-white"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleQuickAddSubcategory}
                    className="h-9 font-bold text-xs"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickAddGroup(false)}
                    className="h-9 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <CustomSelect
                  value={formData.subcategory_id}
                  onChange={(val) => setFormData({ ...formData, subcategory_id: val })}
                  options={[
                    { value: '', label: 'None (Unassigned)' },
                    ...(subcategories as any[]).map((sub) => ({
                      value: sub.id,
                      label: sub.name,
                    })),
                  ]}
                  placeholder="Select sub-category..."
                />
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Product / Service Name</label>
              <Input
                required
                placeholder="e.g. Vanilla Cup, B/W Single Side"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Size Label <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </label>
              <Input
                placeholder="e.g. 100 ml, 500 ml"
                value={formData.size_label}
                onChange={(e) => setFormData({ ...formData, size_label: e.target.value })}
              />
            </div>
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
                  description: 'One flat rate (e.g. Arun Ice Creams, Aadhaar)',
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
                placeholder="e.g. page, copy, meter, piece"
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
                placeholder="60"
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
