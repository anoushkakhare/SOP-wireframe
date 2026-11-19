import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  X,
  CheckSquare,
  Square,
  TrendingUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { metaService } from '../../services/metaService';
import {
  useDataReviewInnovations,
  useDataReviewMutations,
  useDataReviewReadiness,
} from '../../hooks/useDataReview';
import { useUiStore } from '../../store/uiStore';
import { HierarchyTreePicker } from '../filters/HierarchyTreePicker';
import { HierarchyNode, InnovationProduct } from '../../types';

interface InnovationCardProps {
  orderNumber?: number;
}

export const InnovationCard: React.FC<InnovationCardProps> = ({
  orderNumber = 5,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTreePopoverOpen, setIsTreePopoverOpen] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSopGroup, setSelectedSopGroup] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [sourceUnits, setSourceUnits] = useState<string[]>([]);
  const [launchMonth, setLaunchMonth] = useState('2027-01');
  const [upliftPct, setUpliftPct] = useState('15.0');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: readiness } = useDataReviewReadiness();
  const { data: innovations = [], isLoading } = useDataReviewInnovations();
  const {
    addInnovation,
    isAddInnovationPending,
    deleteInnovation,
    updateReadiness,
    isUpdateReadinessPending,
  } = useDataReviewMutations();
  const { addToast } = useUiStore();

  const isInnovationChecked =
    readiness?.checklist.find(c => c.id === 'innovation_reviewed')?.checked ?? false;

  // Load product hierarchy nodes
  const hierarchyQuery = useQuery({
    queryKey: ['hierarchy', 'product'],
    queryFn: () => metaService.getHierarchy(),
  });
  const productNodes: HierarchyNode[] = hierarchyQuery.data || [];

  // Cascading lists
  const categories = useMemo(
    () => productNodes.filter(n => n.level === 1),
    [productNodes]
  );

  const catNode = useMemo(
    () => categories.find(c => c.name === selectedCategory),
    [categories, selectedCategory]
  );

  const sopGroups = useMemo(() => {
    if (!catNode) return productNodes.filter(n => n.level === 2);
    return productNodes.filter(n => n.level === 2 && n.parentId === catNode.id);
  }, [productNodes, catNode]);

  const sopNode = useMemo(
    () => sopGroups.find(s => s.name === selectedSopGroup),
    [sopGroups, selectedSopGroup]
  );

  const brands = useMemo(() => {
    if (!sopNode) {
      if (!catNode) return productNodes.filter(n => n.level === 3);
      // children of any sop in this cat
      const sopIds = new Set(sopGroups.map(s => s.id));
      return productNodes.filter(n => n.level === 3 && n.parentId && sopIds.has(n.parentId));
    }
    return productNodes.filter(n => n.level === 3 && n.parentId === sopNode.id);
  }, [productNodes, sopNode, catNode, sopGroups]);

  // When opening modal, initialize category/sop/brand if empty
  const handleOpenAddModal = () => {
    setCode(`NPD-${new Date().getFullYear()}-${String(innovations.length + 1).padStart(3, '0')}`);
    setName('');
    const defaultCat = categories[0]?.name || 'Personal Care';
    setSelectedCategory(defaultCat);

    const firstCatNode = categories[0];
    const firstSops = productNodes.filter(n => n.level === 2 && n.parentId === firstCatNode?.id);
    const defaultSop = firstSops[0]?.name || '';
    setSelectedSopGroup(defaultSop);

    const firstSopNode = firstSops[0];
    const firstBrands = productNodes.filter(n => n.level === 3 && n.parentId === firstSopNode?.id);
    setSelectedBrand(firstBrands[0]?.name || '');

    setSourceUnits([]);
    setLaunchMonth('2027-01');
    setUpliftPct('15.0');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleCategoryChange = (catName: string) => {
    setSelectedCategory(catName);
    const cNode = categories.find(c => c.name === catName);
    const availableSops = productNodes.filter(n => n.level === 2 && n.parentId === cNode?.id);
    const newSop = availableSops[0]?.name || '';
    setSelectedSopGroup(newSop);

    const sNode = availableSops[0];
    const availableBrands = productNodes.filter(n => n.level === 3 && n.parentId === sNode?.id);
    setSelectedBrand(availableBrands[0]?.name || '');
  };

  const handleSopChange = (sopName: string) => {
    setSelectedSopGroup(sopName);
    const sNode = sopGroups.find(s => s.name === sopName);
    const availableBrands = productNodes.filter(n => n.level === 3 && n.parentId === sNode?.id);
    setSelectedBrand(availableBrands[0]?.name || '');
  };

  // Convert selected unit IDs to human readable names
  const nodeMap = useMemo(() => new Map(productNodes.map(n => [n.id, n])), [productNodes]);

  const selectedSourceNames = useMemo(() => {
    return sourceUnits.map(id => nodeMap.get(id)?.name || id);
  }, [sourceUnits, nodeMap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedCode = code.trim();
    const trimmedName = name.trim();

    if (!trimmedCode) {
      setFormError('Product code is required.');
      return;
    }

    if (!trimmedName) {
      setFormError('Product name is required.');
      return;
    }

    // Validation: unique code
    const isDuplicate = innovations.some(
      i => i.code.toLowerCase() === trimmedCode.toLowerCase()
    );
    if (isDuplicate) {
      setFormError(`Product code "${trimmedCode}" is already in use. Please choose a unique code.`);
      return;
    }

    // Validation: at least one source unit
    if (sourceUnits.length === 0) {
      setFormError('Please select at least one source forecast unit to copy trend from.');
      return;
    }

    try {
      await addInnovation({
        code: trimmedCode,
        name: trimmedName,
        category: selectedCategory,
        sopGroup: selectedSopGroup,
        brand: selectedBrand,
        sourceForecastUnits: selectedSourceNames,
        launchMonth,
        upliftPct: parseFloat(upliftPct) || 0,
      });

      addToast(`Innovation product "${trimmedName}" added successfully`, 'success');
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add innovation product');
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    try {
      await deleteInnovation(id);
      addToast(`Innovation product "${prodName}" removed`, 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to remove innovation product', 'error');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50/60 transition-colors cursor-pointer border-b border-gray-100"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-sm">
            {orderNumber}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Innovation</h2>
            <p className="text-xs text-gray-500">
              New product introductions (NPDs), launch timing, cannibalisation & phase-ins
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isInnovationChecked ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Reviewed
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1">
              Review Required
            </span>
          )}
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-5 space-y-4">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
            <div>
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide block">
                Active NPD Launches ({innovations.length})
              </span>
              <span className="text-xs text-gray-500">
                Forecast curves copied from mature benchmark units with promotional uplift
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary-700 text-white hover:bg-primary-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Add innovation product
            </button>
          </div>

          {/* Table of new product rows */}
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Hierarchy Path</th>
                  <th className="py-2.5 px-3">Copy Forecast Trend From</th>
                  <th className="py-2.5 px-3 text-center">Launch Month</th>
                  <th className="py-2.5 px-3 text-right">Uplift %</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {innovations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-500">
                      No innovation products added yet. Click &quot;Add innovation product&quot; above.
                    </td>
                  </tr>
                ) : (
                  innovations.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-gray-900 whitespace-nowrap">
                        {row.code}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        {row.name}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-900 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                          <span>{row.category}</span>
                          <span className="text-gray-400">&gt;</span>
                          <span>{row.sopGroup}</span>
                          <span className="text-gray-400">&gt;</span>
                          <span className="font-semibold text-primary-800">{row.brand}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-[260px]">
                        <div className="flex flex-wrap gap-1">
                          {row.sourceForecastUnits.map((unit, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 text-[10px] truncate max-w-[200px]"
                              title={unit}
                            >
                              {unit}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap font-medium text-gray-700">
                        {row.launchMonth}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-semibold text-emerald-700">
                        +{row.upliftPct}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id, row.name)}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete innovation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Reviewed tick bar - feeds sign-off checklist */}
          <div className="flex items-center justify-between p-3.5 bg-purple-50/50 border border-purple-200 rounded-lg">
            <div className="text-xs text-purple-900">
              <span className="font-bold">Manual Review Status:</span>{' '}
              {isInnovationChecked
                ? 'Innovation assumptions marked as reviewed for this cycle.'
                : 'Requires planner verification before readiness sign-off.'}
            </div>
            <button
              type="button"
              onClick={() =>
                updateReadiness({ innovationReviewed: !isInnovationChecked })
              }
              disabled={isUpdateReadinessPending}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer flex items-center gap-1.5 ${
                isInnovationChecked
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                  : 'bg-primary-700 text-white border-primary-800 hover:bg-primary-800'
              }`}
            >
              {isInnovationChecked ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>✓ Marked Reviewed</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Mark Innovation as Reviewed</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Add Innovation Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-gray-200 overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-700" />
                <h3 className="text-sm font-bold text-gray-900">Add Innovation Product</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
                  {formError}
                </div>
              )}

              {/* Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Product Code *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="e.g. NPD-2026-003"
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Dove Serum Body Wash"
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              {/* Cascading Selects: Category > S&OP Group > Brand */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block">
                  Hierarchy Cascading Assignment
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={e => handleCategoryChange(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-300 bg-white"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      S&OP Group
                    </label>
                    <select
                      value={selectedSopGroup}
                      onChange={e => handleSopChange(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-300 bg-white"
                    >
                      {sopGroups.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Brand
                    </label>
                    <select
                      value={selectedBrand}
                      onChange={e => setSelectedBrand(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-300 bg-white"
                    >
                      {brands.map(b => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Copy forecast trend from (Popover with HierarchyTreePicker) */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Copy forecast trend from (Hierarchy Tree Multi-Select) *
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTreePopoverOpen(!isTreePopoverOpen)}
                    className="flex-1 px-3 py-1.5 text-xs text-left rounded-md border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-gray-700 truncate">
                      {sourceUnits.length === 0
                        ? 'Select source forecast units...'
                        : `${sourceUnits.length} source forecast unit(s) selected`}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
                  </button>
                </div>

                {/* Popover */}
                {isTreePopoverOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                      <span className="text-[11px] font-semibold text-gray-700">
                        Select forecast unit(s)
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsTreePopoverOpen(false)}
                        className="text-[11px] text-primary-700 font-semibold hover:underline"
                      >
                        Done
                      </button>
                    </div>
                    <HierarchyTreePicker
                      nodes={productNodes}
                      value={sourceUnits}
                      onChange={setSourceUnits}
                    />
                  </div>
                )}

                {/* Display selected tags */}
                {selectedSourceNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedSourceNames.map((name, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-50 text-primary-800 border border-primary-200"
                      >
                        <span className="truncate max-w-[150px]">{name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newUnits = [...sourceUnits];
                            newUnits.splice(i, 1);
                            setSourceUnits(newUnits);
                          }}
                          className="hover:text-red-600"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Launch Month & Uplift % */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Launch Month
                  </label>
                  <input
                    type="month"
                    value={launchMonth}
                    onChange={e => setLaunchMonth(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Uplift %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="200"
                      value={upliftPct}
                      onChange={e => setUpliftPct(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500 pr-7"
                      required
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddInnovationPending}
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-primary-700 text-white hover:bg-primary-800 cursor-pointer disabled:opacity-50"
                >
                  {isAddInnovationPending ? 'Adding...' : 'Add Innovation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

