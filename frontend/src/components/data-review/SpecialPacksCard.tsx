import React, { useState } from 'react';
import {
  PackageCheck,
  ChevronDown,
  ChevronUp,
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Info,
  X,
  Layers,
  Square,
  AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { metaService } from '../../services/metaService';
import {
  useDataReviewCombos,
  useDataReviewMutations,
  useDataReviewReadiness,
} from '../../hooks/useDataReview';
import { useUiStore } from '../../store/uiStore';
import { Drawer } from '../layout/Drawer';
import { ComboPack, ComboPackComponent, HierarchyNode } from '../../types';

interface SpecialPacksCardProps {
  orderNumber?: number;
}

export const SpecialPacksCard: React.FC<SpecialPacksCardProps> = ({
  orderNumber = 6,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form state inside drawer
  const [editingCombo, setEditingCombo] = useState<ComboPack | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [comboName, setComboName] = useState('');
  const [comboCode, setComboCode] = useState('');
  const [components, setComponents] = useState<ComboPackComponent[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: readiness } = useDataReviewReadiness();
  const { data: combos = [], isLoading } = useDataReviewCombos();
  const {
    createCombo,
    updateCombo,
    deleteCombo,
    updateReadiness,
    isUpdateReadinessPending,
  } = useDataReviewMutations();
  const { addToast } = useUiStore();

  const isComboPacksChecked =
    readiness?.checklist.find(c => c.id === 'combo_packs_reviewed')?.checked ?? false;

  // Load product hierarchy nodes for component selection
  const hierarchyQuery = useQuery({
    queryKey: ['hierarchy', 'product'],
    queryFn: () => metaService.getHierarchy(),
  });
  const productNodes: HierarchyNode[] = hierarchyQuery.data || [];

  // Available forecast units (level 5 or level 4/5)
  const availableUnits = React.useMemo(() => {
    const l5 = productNodes.filter(n => n.level === 5);
    if (l5.length > 0) return l5;
    return productNodes.filter(n => n.level >= 3);
  }, [productNodes]);

  // Open Create Form
  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingCombo(null);
    setComboName('');
    setComboCode(`COMBO-UNL-${String(combos.length + 1).padStart(2, '0')}`);
    setComponents([
      {
        id: `comp-${Date.now()}-1`,
        name: availableUnits[0]?.name || 'Dove Daily Moisture Shampoo 250ml',
        code: 'SKU-001',
        quantity: 1,
      },
    ]);
    setFormError(null);
  };

  // Open Edit Form
  const handleStartEdit = (combo: ComboPack) => {
    setEditingCombo(combo);
    setIsCreating(false);
    setComboName(combo.name);
    setComboCode(combo.code);
    setComponents([...combo.components]);
    setFormError(null);
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingCombo(null);
    setFormError(null);
  };

  const handleAddComponent = () => {
    const nextIdx = components.length + 1;
    const defaultUnit = availableUnits[nextIdx % availableUnits.length];
    setComponents([
      ...components,
      {
        id: `comp-${Date.now()}-${nextIdx}`,
        name: defaultUnit?.name || `Component SKU #${nextIdx}`,
        code: `SKU-${nextIdx}`,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveComponent = (idx: number) => {
    const next = [...components];
    next.splice(idx, 1);
    setComponents(next);
  };

  const handleComponentChange = (idx: number, field: 'name' | 'quantity', val: any) => {
    const next = [...components];
    if (field === 'quantity') {
      next[idx] = { ...next[idx], quantity: Math.max(1, parseInt(val, 10) || 1) };
    } else {
      next[idx] = { ...next[idx], name: val };
    }
    setComponents(next);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = comboName.trim();
    const trimmedCode = comboCode.trim();

    if (!trimmedName || !trimmedCode) {
      setFormError('Combo pack name and code are required.');
      return;
    }

    if (components.length === 0) {
      setFormError('At least one component must be defined.');
      return;
    }

    try {
      if (isCreating) {
        await createCombo({
          name: trimmedName,
          code: trimmedCode,
          components,
        });
        addToast(`Combo pack "${trimmedName}" created`, 'success');
      } else if (editingCombo) {
        await updateCombo({
          id: editingCombo.id,
          combo: {
            name: trimmedName,
            code: trimmedCode,
            components,
          },
        });
        addToast(`Combo pack "${trimmedName}" updated`, 'success');
      }
      setIsCreating(false);
      setEditingCombo(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save combo pack');
    }
  };

  const handleDeleteCombo = async (id: string, name: string) => {
    try {
      await deleteCombo(id);
      addToast(`Combo pack "${name}" removed`, 'info');
      if (editingCombo?.id === id) {
        setEditingCombo(null);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to delete combo pack', 'error');
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
            <h2 className="text-base font-bold text-gray-900">Special packs</h2>
            <p className="text-xs text-gray-500">
              Promotional bundles, value combo packs, seasonal multipacks &amp; BOM explosion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isComboPacksChecked ? (
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
          {/* Banner: "Combo pack build logic ships in the final delivery" */}
          <div className="flex items-center gap-3 p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg text-blue-900 text-xs shadow-xs">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">System Notice:</span> Combo pack build logic ships in the final delivery.
            </div>
          </div>

          {/* Combos Overview and Manage button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
            <div>
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide block">
                Combo Packs ({combos.length} Configured)
              </span>
              <span className="text-xs text-gray-500">
                Multi-SKU promotional bundles exploded into component forecast requirements
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary-700 text-white hover:bg-primary-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
            >
              <Package className="w-3.5 h-3.5" />
              Manage combo packs
            </button>
          </div>

          {/* Quick preview list of seed combos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {combos.map(combo => (
              <div
                key={combo.id}
                className="p-3.5 border border-gray-200 rounded-lg bg-white shadow-2xs hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{combo.name}</h4>
                    <span className="text-[10px] font-mono text-gray-500">{combo.code}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                    {combo.components.length} components
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                  {combo.components.map((comp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] text-gray-600"
                    >
                      <span className="truncate max-w-[200px]">{comp.name}</span>
                      <span className="font-semibold text-gray-800 whitespace-nowrap">
                        Qty: {comp.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Reviewed tick bar - feeds sign-off checklist */}
          <div className="flex items-center justify-between p-3.5 bg-amber-50/50 border border-amber-200 rounded-lg">
            <div className="text-xs text-amber-900">
              <span className="font-bold">Manual Review Status:</span>{' '}
              {isComboPacksChecked
                ? 'Special packs and combo bundles marked as reviewed for this cycle.'
                : 'Requires planner verification before readiness sign-off.'}
            </div>
            <button
              type="button"
              onClick={() =>
                updateReadiness({ comboPacksReviewed: !isComboPacksChecked })
              }
              disabled={isUpdateReadinessPending}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer flex items-center gap-1.5 ${
                isComboPacksChecked
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                  : 'bg-primary-700 text-white border-primary-800 hover:bg-primary-800'
              }`}
            >
              {isComboPacksChecked ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>✓ Marked Reviewed</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Mark Combo Packs as Reviewed</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Drawer: Manage Combo Packs */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setIsCreating(false);
          setEditingCombo(null);
        }}
        title="Manage Combo Packs"
        widthClass="w-full md:w-[480px] lg:w-[520px]"
      >
        <div className="space-y-5">
          {/* Banner in Drawer */}
          <div className="flex items-center gap-2.5 p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-blue-900 text-xs">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <p>
              <span className="font-semibold">Notice:</span> Combo pack build logic ships in the final delivery.
            </p>
          </div>

          {/* Action button to create new */}
          {!isCreating && !editingCombo && (
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Configured Combo Bundles ({combos.length})
              </span>
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-700 text-white hover:bg-primary-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Combo Pack
              </button>
            </div>
          )}

          {/* Create or Edit Form */}
          {(isCreating || editingCombo) && (
            <form onSubmit={handleSaveForm} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <h3 className="text-xs font-bold text-gray-900 uppercase">
                  {isCreating ? 'Create New Combo Pack' : `Edit "${editingCombo?.name}"`}
                </h3>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Combo Pack Name *
                </label>
                <input
                  type="text"
                  value={comboName}
                  onChange={e => setComboName(e.target.value)}
                  placeholder="e.g. Dove Shampoo + Conditioner Duo"
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Combo SKU Code *
                </label>
                <input
                  type="text"
                  value={comboCode}
                  onChange={e => setComboCode(e.target.value)}
                  placeholder="e.g. COMBO-DOVE-01"
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                  required
                />
              </div>

              {/* Components List & Quantities */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-700">
                    Component Forecast Units &amp; Quantities *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddComponent}
                    className="text-[11px] font-semibold text-primary-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Add SKU
                  </button>
                </div>

                <div className="space-y-2">
                  {components.map((comp, idx) => (
                    <div
                      key={comp.id || idx}
                      className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg shadow-2xs"
                    >
                      <div className="flex-1">
                        <select
                          value={comp.name}
                          onChange={e => handleComponentChange(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-gray-50/50"
                        >
                          {availableUnits.map(unit => (
                            <option key={unit.id} value={unit.name}>
                              {unit.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20 flex items-center gap-1">
                        <span className="text-[10px] text-gray-500">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={comp.quantity}
                          onChange={e => handleComponentChange(idx, 'quantity', e.target.value)}
                          className="w-12 px-1.5 py-0.5 text-xs text-center border border-gray-300 rounded font-semibold"
                        />
                      </div>

                      {components.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(idx)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-primary-700 text-white hover:bg-primary-800 cursor-pointer shadow-xs"
                >
                  {isCreating ? 'Save Combo Pack' : 'Update Combo'}
                </button>
              </div>
            </form>
          )}

          {/* List of Combos */}
          {!isCreating && !editingCombo && (
            <div className="space-y-3">
              {combos.map(combo => (
                <div
                  key={combo.id}
                  className="p-4 border border-gray-200 rounded-xl bg-white shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{combo.name}</h4>
                      <span className="text-xs font-mono text-gray-500">{combo.code}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(combo)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-primary-700 hover:bg-primary-50 transition-colors cursor-pointer"
                        title="Edit combo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCombo(combo.id, combo.name)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete combo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Components */}
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
                      Component SKUs ({combo.components.length})
                    </span>
                    {combo.components.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs text-gray-700"
                      >
                        <span className="truncate max-w-[260px]">{c.name}</span>
                        <span className="font-semibold px-2 py-0.5 rounded bg-white border border-gray-200 text-[11px]">
                          Qty: {c.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
};

