import React, { useState } from "react";
import {
  ShoppingBag,
  CheckSquare,
  Square,
  Search,
  Filter,
  Plus,
  Trash2,
  ExternalLink,
  Store,
  Tag,
  DollarSign,
  AlertCircle,
  Sparkles,
  Edit2,
  Check,
  ChevronDown,
  ShoppingBag as CartIcon,
  Home,
  CheckCircle2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { ShoppingItem, PartyPlan } from "../types";

interface ShoppingListViewProps {
  plan: PartyPlan;
  onUpdatePlan: (updated: PartyPlan) => void;
  onOpenAgentChatWithPrompt?: (prompt: string) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  plan,
  onUpdatePlan,
  onOpenAgentChatWithPrompt,
}) => {
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [groupBy, setGroupBy] = useState<"store" | "category">("store");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // New item draft state
  const [newItem, setNewItem] = useState<{
    name: string;
    category: string;
    quantity: string;
    estimatedCost: number;
    storeType: ShoppingItem["storeType"];
    priority: ShoppingItem["priority"];
    notes: string;
  }>({
    name: "",
    category: "Fresh Produce & Herbs",
    quantity: "1 pack",
    estimatedCost: 5.0,
    storeType: "Supermarket / Grocery",
    priority: "Recommended",
    notes: "",
  });

  const items = plan.shoppingItems || [];

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.dietaryTag && item.dietaryTag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStore = selectedStore === "all" || item.storeType === selectedStore;
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;

    return matchesSearch && matchesStore && matchesCategory;
  });

  // Calculate metrics
  const totalItemsCount = items.length;
  const purchasedItems = items.filter((i) => i.isChecked || i.status === "already_have");
  const purchasedCount = purchasedItems.length;
  const progressPercent = totalItemsCount > 0 ? Math.round((purchasedCount / totalItemsCount) * 100) : 0;

  const totalEstimatedCost = items
    .filter((i) => i.status !== "already_have")
    .reduce((sum, item) => sum + item.estimatedCost, 0);

  const totalActualSpent = items
    .filter((i) => i.isChecked && i.status !== "already_have")
    .reduce((sum, item) => sum + (item.actualCost ?? item.estimatedCost), 0);

  // Get unique stores & categories
  const stores = Array.from(new Set(items.map((i) => i.storeType)));
  const categories = Array.from(new Set(items.map((i) => i.category)));

  // Handlers
  const handleToggleCheck = (itemId: string) => {
    const updated = items.map((item) => {
      if (item.id === itemId) {
        const nextState = !item.isChecked;
        if (nextState) {
          // Trigger subtle party confetti
          confetti({
            particleCount: 20,
            spread: 40,
            origin: { y: 0.8 },
            colors: ["#F59E0B", "#10B981", "#6366F1"],
          });
        }
        return { ...item, isChecked: nextState };
      }
      return item;
    });

    onUpdatePlan({
      ...plan,
      shoppingItems: updated,
    });
  };

  const handleStatusChange = (itemId: string, status: ShoppingItem["status"]) => {
    const updated = items.map((item) => (item.id === itemId ? { ...item, status } : item));
    onUpdatePlan({ ...plan, shoppingItems: updated });
  };

  const handleDeleteItem = (itemId: string) => {
    const updated = items.filter((item) => item.id !== itemId);
    onUpdatePlan({ ...plan, shoppingItems: updated });
  };

  const handleUpdateItem = (itemId: string, patch: Partial<ShoppingItem>) => {
    const updated = items.map((item) => (item.id === itemId ? { ...item, ...patch } : item));
    onUpdatePlan({ ...plan, shoppingItems: updated });
    setEditingItemId(null);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    const created: ShoppingItem = {
      id: `custom-item-${Date.now()}`,
      name: newItem.name.trim(),
      category: newItem.category,
      quantity: newItem.quantity,
      estimatedCost: Number(newItem.estimatedCost) || 0,
      storeType: newItem.storeType,
      priority: newItem.priority,
      notes: newItem.notes,
      isChecked: false,
      isCustom: true,
      status: "to_buy",
    };

    onUpdatePlan({
      ...plan,
      shoppingItems: [created, ...items],
    });

    setNewItem({
      name: "",
      category: "Fresh Produce & Herbs",
      quantity: "1 pack",
      estimatedCost: 5.0,
      storeType: "Supermarket / Grocery",
      priority: "Recommended",
      notes: "",
    });
    setShowAddModal(false);
  };

  // Group items
  const groupedData: Record<string, ShoppingItem[]> = {};
  filteredItems.forEach((item) => {
    const key = groupBy === "store" ? item.storeType : item.category;
    if (!groupedData[key]) groupedData[key] = [];
    groupedData[key].push(item);
  });

  return (
    <div className="space-y-6">
      {/* Header & Budget Progress Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                Master Shopping List
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
                {purchasedCount} of {totalItemsCount} Acquired
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Store-sorted groceries, supplies, tableware & beverages for {plan.guestConfig.adultCount + plan.guestConfig.childCount} guests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-add-shopping-item"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Item</span>
            </button>

            {onOpenAgentChatWithPrompt && (
              <button
                onClick={() => onOpenAgentChatWithPrompt("How can I save $40 on this shopping list without compromising quality?")}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Budget Saver</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bars & Real-Time Financial Tracker */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80">
          {/* Items Checklist Progress */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Shopping Completion</span>
              <span className="font-bold text-amber-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {totalItemsCount - purchasedCount} items remaining to purchase
            </p>
          </div>

          {/* Budget vs Est. Cost */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-400 font-medium">Target Budget vs Estimated</span>
              <span className="font-bold text-emerald-400">${totalEstimatedCost.toFixed(2)} / ${plan.budgetTotal}</span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  totalEstimatedCost <= plan.budgetTotal ? "bg-emerald-500" : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, (totalEstimatedCost / Math.max(1, plan.budgetTotal)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] mt-1">
              <span className="text-slate-400">
                {totalEstimatedCost <= plan.budgetTotal ? "✨ On budget" : "⚠️ Exceeds by $" + (totalEstimatedCost - plan.budgetTotal).toFixed(0)}
              </span>
              <span className="text-slate-300 font-medium">
                ${(totalEstimatedCost / Math.max(1, plan.guestConfig.adultCount + plan.guestConfig.childCount)).toFixed(2)}/guest
              </span>
            </div>
          </div>

          {/* Cart Actual Spent */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-400 font-medium">Actual Spent so far</span>
              <span className="font-bold text-indigo-400">${totalActualSpent.toFixed(2)}</span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (totalActualSpent / Math.max(1, totalEstimatedCost)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              From {items.filter((i) => i.isChecked).length} purchased items
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items, ingredients, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Store & Category Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Store Dropdown */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs">
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Filter by Store"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none pr-2"
            >
              <option value="all">All Stores ({items.length})</option>
              {stores.map((s) => (
                <option key={s} value={s}>
                  {s} ({items.filter((i) => i.storeType === s).length})
                </option>
              ))}
            </select>
          </div>

          {/* Group By Toggle */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setGroupBy("store")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                groupBy === "store" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              By Store
            </button>
            <button
              onClick={() => setGroupBy("category")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                groupBy === "category" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              By Department
            </button>
          </div>
        </div>
      </div>

      {/* Shopping List Grouped View */}
      {Object.keys(groupedData).length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-3">
          <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-medium">No shopping items match your filter.</p>
          <button
            onClick={() => {
              setSelectedStore("all");
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="text-xs text-amber-400 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedData).map(([groupTitle, groupItems]) => {
            const groupTotalEst = groupItems.reduce((acc, i) => acc + (i.status !== "already_have" ? i.estimatedCost : 0), 0);
            const groupChecked = groupItems.filter((i) => i.isChecked || i.status === "already_have").length;

            return (
              <div
                key={groupTitle}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Group Header */}
                <div className="p-3.5 sm:p-4 bg-slate-800/70 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {groupBy === "store" ? (
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Store className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Tag className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm text-white">{groupTitle}</h3>
                      <p className="text-[11px] text-slate-400">
                        {groupChecked} of {groupItems.length} items ready
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400">${groupTotalEst.toFixed(2)}</span>
                    <p className="text-[10px] text-slate-400">Estimated Total</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-slate-800/80">
                  {groupItems.map((item) => {
                    const isEditing = editingItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 sm:p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          item.isChecked
                            ? "bg-slate-900/40 opacity-70"
                            : item.status === "already_have"
                            ? "bg-emerald-950/20"
                            : "hover:bg-slate-800/40"
                        }`}
                      >
                        {/* Checkbox & Details */}
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => handleToggleCheck(item.id)}
                            className="mt-0.5 text-amber-400 hover:text-amber-300 transition-transform active:scale-90"
                          >
                            {item.isChecked ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>

                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-sm font-semibold ${
                                  item.isChecked ? "line-through text-slate-400" : "text-white"
                                }`}
                              >
                                {item.name}
                              </span>

                              {/* Dietary Tag */}
                              {item.dietaryTag && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                                  {item.dietaryTag}
                                </span>
                              )}

                              {/* Priority Badge */}
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                                  item.priority === "Must Have"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : item.priority === "Recommended"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                {item.priority}
                              </span>

                              {/* Status Tag */}
                              {item.status === "already_have" && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-medium">
                                  <Home className="w-3 h-3" /> Already Have
                                </span>
                              )}
                            </div>

                            {/* Quantity & Notes */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                              <span className="font-medium text-amber-300/90">
                                📦 Qty: <strong className="text-white">{item.quantity}</strong>
                              </span>
                              {groupBy !== "store" && <span>• 🏪 {item.storeType}</span>}
                              {groupBy !== "category" && <span>• 🏷️ {item.category}</span>}
                              {item.notes && <span className="italic text-slate-300">• 💡 {item.notes}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Price, Status Switcher & Online Search Link */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                          {/* Price Display / Edit */}
                          <div className="text-right">
                            <span className="text-sm font-bold text-emerald-400">
                              ${item.estimatedCost.toFixed(2)}
                            </span>
                            {item.status === "already_have" && (
                              <p className="text-[10px] text-emerald-400/80 font-medium">($0 from budget)</p>
                            )}
                          </div>

                          {/* Quick Store Search Jump */}
                          <div className="flex items-center gap-1">
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(item.name + " buy online")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Search stores online"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs border border-slate-700 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            {/* Status menu button */}
                            <select
                              aria-label="Item Status"
                              value={item.status}
                              onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                              className="bg-slate-800 border border-slate-700 text-slate-300 text-[11px] rounded-lg px-2 py-1.5 focus:outline-none"
                            >
                              <option value="to_buy">🛒 To Buy</option>
                              <option value="already_have">🏠 Have at Home</option>
                              <option value="diy_substitute">✨ DIY Substitute</option>
                            </select>

                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              title="Delete Item"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" /> Add Custom Shopping Item
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Artisanal Salted Pretzel Bites"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quantity & Unit</label>
                  <input
                    type="text"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    placeholder="e.g. 2 bags (24 oz)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estimated Cost ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={newItem.estimatedCost}
                    onChange={(e) => setNewItem({ ...newItem, estimatedCost: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Store Type</label>
                  <select
                    value={newItem.storeType}
                    onChange={(e) => setNewItem({ ...newItem, storeType: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Costco/Wholesale">Costco / Wholesale</option>
                    <option value="Supermarket / Grocery">Supermarket / Grocery</option>
                    <option value="Liquor / Beverage Store">Liquor / Beverage Store</option>
                    <option value="Party City / Dollar Store">Party City / Dollar Store</option>
                    <option value="Target / Amazon / Online">Target / Amazon / Online</option>
                    <option value="Specialty / Bakery">Specialty / Bakery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Beverages & Bar">Beverages & Bar</option>
                    <option value="Fresh Produce & Herbs">Fresh Produce & Herbs</option>
                    <option value="Proteins & Mains">Proteins & Mains</option>
                    <option value="Bakery & Sweets">Bakery & Sweets</option>
                    <option value="Snacks & Pantry">Snacks & Pantry</option>
                    <option value="Decorations & Lighting">Decorations & Lighting</option>
                    <option value="Tableware & Disposables">Tableware & Disposables</option>
                    <option value="Ice & Essentials">Ice & Essentials</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Tip</label>
                <input
                  type="text"
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="e.g. Check for organic, buy chilled morning of party"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  Add to Shopping List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
