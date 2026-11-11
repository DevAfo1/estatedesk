import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { formatCurrencyAmount, isAccessGrantActive } from '../utils/estateDeskLogic.ts';
import { Unit, InitialInventoryChecklist, InventoryItem, AccessPermissionScope } from '../types/index.ts';
import {
  Building2,
  Plus,
  Search,
  ClipboardList,
  CheckCircle2,
  Key,
  Gauge,
  X,
  FileCheck,
  ShieldAlert,
  History,
  UserPlus,
  Lock,
} from 'lucide-react';

export const PropertiesUnitsView: React.FC = () => {
  const {
    visibleProperties,
    units,
    addUnit,
    updateUnitStatus,
    tenancies,
    createTenancyOnboarding,
    terminateTenancy,
    accessGrants,
    createAccessGrant,
    revokeAccessGrantImmediately,
    inventoryChecklists,
    inventoryHistory,
    updateInventoryItem,
    signOffInventory,
    currentUser,
    allUsers,
    currencies,
    selectedPropertyId,
    setSelectedPropertyId,
  } = useApp();

  const [subView, setSubView] = useState<'units' | 'tenancies' | 'access' | 'inspections'>('units');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'occupied' | 'vacant' | 'maintenance'>('all');
  const [selectedUnitForInventory, setSelectedUnitForInventory] = useState<Unit | null>(null);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [unitError, setUnitError] = useState<string | null>(null);

  // Add unit state
  const [newUnitNumber, setNewUnitNumber] = useState('');
  const [newBedrooms, setNewBedrooms] = useState(2);
  const [newBathrooms, setNewBathrooms] = useState(2);
  const [newSqft, setNewSqft] = useState(1400);
  const [newRent, setNewRent] = useState(12000000);
  const [newServiceCharge, setNewServiceCharge] = useState(2000000);

  // Tenancy onboarding modal
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardUnitId, setOnboardUnitId] = useState('unit_103');
  const [onboardName, setOnboardName] = useState('');
  const [onboardEmail, setOnboardEmail] = useState('');
  const [onboardPhone, setOnboardPhone] = useState('+234 803 ');
  const [onboardMethod, setOnboardMethod] = useState<'invite_code' | 'invite_link' | 'manual'>('invite_code');

  // Delegated Access Grant state
  const [grantUserId, setGrantUserId] = useState('usr_agent_1');
  const [grantRevokeAt, setGrantRevokeAt] = useState('2026-12-31T18:00');
  const [grantPerms, setGrantPerms] = useState<AccessPermissionScope[]>(['view_units', 'manage_tenancies']);

  const selectedProperty =
    visibleProperties.find((p) => p.id === selectedPropertyId) || visibleProperties[0];

  if (!selectedProperty) {
    return (
      <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
        <Lock className="w-7 h-7 text-slate-400 mx-auto" />
        <p className="text-sm font-bold text-slate-900 dark:text-white">No Property Portfolio Access</p>
        <p className="text-xs text-slate-500">
          Your active role ({currentUser.role}) has no active property grants.
        </p>
      </div>
    );
  }

  const propertyUnits = units.filter((u) => u.propertyId === selectedProperty.id);
  const filteredUnits = propertyUnits.filter((u) => {
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesSearch =
      u.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.meterNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const propertyTenancies = tenancies.filter((t) => t.propertyId === selectedProperty.id);
  const propertyGrants = accessGrants.filter((g) => g.propertyId === selectedProperty.id);
  const propertyInspections = inventoryHistory.filter((i) => i.propertyId === selectedProperty.id);
  const activeChecklist: InitialInventoryChecklist | undefined = selectedUnitForInventory
    ? inventoryChecklists[selectedUnitForInventory.id] || inventoryChecklists['unit_101']
    : undefined;

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitNumber) return;
    const res = addUnit({
      propertyId: selectedProperty.id,
      unitNumber: newUnitNumber,
      floor: 1,
      bedrooms: Number(newBedrooms),
      bathrooms: Number(newBathrooms),
      sqft: Number(newSqft),
      currency: selectedProperty.currency,
      rentAmount: Number(newRent),
      serviceCharge: Number(newServiceCharge),
      billingCycle: 'yearly',
      status: 'vacant',
      depositAmount: Number(newRent) * 0.1,
      meterNumber: `EKEDC-${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    if (!res.success) {
      setUnitError(res.error || 'Limit reached');
      return;
    }
    setUnitError(null);
    setNewUnitNumber('');
    setShowAddUnitModal(false);
  };

  const handleOnboardTenant = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUnit = units.find((u) => u.id === onboardUnitId) || propertyUnits[0];
    if (!targetUnit || !onboardName) return;
    createTenancyOnboarding({
      unitId: targetUnit.id,
      propertyId: selectedProperty.id,
      landlordId: selectedProperty.landlordId,
      tenantId: `usr_tenant_${Date.now()}`,
      tenantName: onboardName,
      tenantEmail: onboardEmail,
      tenantPhone: onboardPhone,
      onboardingMethod: onboardMethod,
      inviteCode: `ED-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      startDate: '2026-11-11',
      endDate: '2027-11-11',
      currency: targetUnit.currency,
      rentAmount: targetUnit.rentAmount,
      serviceCharge: targetUnit.serviceCharge,
      securityDeposit: targetUnit.depositAmount,
      outstandingBalance: 0,
      paymentSchedule: 'annual',
      status: 'active',
    });
    setOnboardName('');
    setOnboardEmail('');
    setShowOnboardModal(false);
  };

  const handleGrantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const grantee = allUsers.find((u) => u.id === grantUserId);
    if (!grantee) return;
    createAccessGrant({
      landlordId: selectedProperty.landlordId,
      granteeUserId: grantee.id,
      granteeName: grantee.name,
      granteeRole: grantee.role === 'facility_manager' ? 'facility_manager' : 'agent',
      propertyId: selectedProperty.id,
      unitIds: [],
      permissions: grantPerms,
      startDate: new Date().toISOString(),
      scheduledRevocationAt: grantRevokeAt ? new Date(grantRevokeAt).toISOString() : undefined,
    });
  };

  const togglePerm = (perm: AccessPermissionScope) => {
    setGrantPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Hierarchical Properties, Historical Tenancies & Delegated Access
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Strict landlord isolation enforced ({visibleProperties.length} accessible property record{visibleProperties.length === 1 ? '' : 's'}).
          </p>
        </div>

        {(currentUser.role === 'landlord' || currentUser.role === 'agent') && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowOnboardModal(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Onboard Tenant
            </button>
            <button
              onClick={() => setShowAddUnitModal(true)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Unit
            </button>
          </div>
        )}
      </div>

      {/* Accessible Property Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {visibleProperties.map((prop) => (
          <button
            key={prop.id}
            onClick={() => setSelectedPropertyId(prop.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              selectedProperty.id === prop.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{prop.name}</span>
            <span className="font-mono text-[10px] opacity-75">({prop.currency})</span>
          </button>
        ))}
      </div>

      {/* Property Overview Strip */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden grid grid-cols-1 md:grid-cols-3">
        <img
          src={selectedProperty.image}
          alt={selectedProperty.name}
          className="w-full h-44 md:h-full object-cover"
        />
        <div className="p-5 md:col-span-2 flex flex-col justify-between space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {selectedProperty.organizationName} · {selectedProperty.type.replace('_', ' ')} · {selectedProperty.timezone}
            </p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{selectedProperty.name}</h2>
            <p className="text-xs text-slate-500">{selectedProperty.address}, {selectedProperty.city}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedProperty.amenities.map((a, idx) => (
              <span key={idx} className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto scrollbar-none">
        {[
          { id: 'units', label: `Units (${propertyUnits.length})` },
          { id: 'tenancies', label: `Historical Tenancies (${propertyTenancies.length})` },
          { id: 'access', label: `Delegated Access & Revocation (${propertyGrants.length})` },
          { id: 'inspections', label: `Inventory & Handover Logs (${propertyInspections.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubView(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              subView === tab.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subView === 'units' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search unit or meter..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto">
              {(['all', 'occupied', 'vacant', 'maintenance'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md capitalize ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Specs</th>
                    <th className="py-3 px-4">Annual Rent</th>
                    <th className="py-3 px-4">Service Charge</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUnits.map((unit) => (
                    <tr key={unit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{unit.unitNumber}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {unit.bedrooms} Bed · {unit.bathrooms} Bath · {unit.sqft.toLocaleString()} sqft
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {formatCurrencyAmount(unit.rentAmount, unit.currency, currencies)}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                        {formatCurrencyAmount(unit.serviceCharge, unit.currency, currencies)}
                      </td>
                      <td className="py-3 px-4 capitalize font-semibold text-slate-700 dark:text-slate-300">
                        {unit.status}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedUnitForInventory(unit)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 inline-flex items-center gap-1"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          Checklist
                        </button>
                        {(currentUser.role === 'landlord' || currentUser.role === 'agent') && (
                          <select
                            value={unit.status}
                            onChange={(e) => updateUnitStatus(unit.id, e.target.value as Unit['status'])}
                            className="px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                          >
                            <option value="occupied">Occupied</option>
                            <option value="vacant">Vacant</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subView === 'tenancies' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                Successive Historical & Active Tenancy Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Past tenant records are permanently preserved when new tenants move in. Terminated tenants lose active unit chat access.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {propertyTenancies.map((t) => (
              <div key={t.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{t.tenantName}</span>
                    <span className="font-mono text-[11px] text-slate-500">Unit {t.unitId}</span>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        t.status === 'active' ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-slate-500 font-mono text-[11px]">
                    {t.startDate} → {t.endDate} · {formatCurrencyAmount(t.rentAmount, t.currency, currencies)} · Onboarded via {t.onboardingMethod.replace('_', ' ')}
                    {t.inviteCode ? ` (${t.inviteCode})` : ''}
                  </p>
                </div>

                {t.status === 'active' && (currentUser.role === 'landlord' || currentUser.role === 'agent') && (
                  <button
                    onClick={() => terminateTenancy(t.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 self-start sm:self-auto"
                  >
                    End Tenancy (Archive History)
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {subView === 'access' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Active & Revoked Delegated Access Grants
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {propertyGrants.map((g) => {
                const active = isAccessGrantActive(g);
                return (
                  <div key={g.id} className="py-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {g.granteeName} ({g.granteeRole.replace('_', ' ')})
                      </span>
                      <span className={`font-bold text-[11px] uppercase ${active ? 'text-emerald-600' : 'text-red-600'}`}>
                        {active ? 'Active Grant' : g.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Permissions: {g.permissions.join(', ')}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {g.scheduledRevocationAt ? `Scheduled Revocation: ${g.scheduledRevocationAt.slice(0, 16)}` : 'No scheduled expiry'}
                    </p>
                    {active && currentUser.role === 'landlord' && (
                      <button
                        onClick={() => revokeAccessGrantImmediately(g.id)}
                        className="mt-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1"
                      >
                        <ShieldAlert className="w-3 h-3" />
                        Emergency Revoke Immediately
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {currentUser.role === 'landlord' && (
            <form onSubmit={handleGrantSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Grant Scoped Access with Custom Scheduled Revocation
              </h2>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Select Agent / Facility Manager</label>
                  <select
                    value={grantUserId}
                    onChange={(e) => setGrantUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    {allUsers
                      .filter((u) => u.role === 'agent' || u.role === 'facility_manager')
                      .map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Custom Scheduled Revocation Date & Time</label>
                  <input
                    type="datetime-local"
                    value={grantRevokeAt}
                    onChange={(e) => setGrantRevokeAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Scoped Permissions</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['view_units', 'manage_tenancies', 'issue_invoices', 'verify_payments', 'manage_maintenance', 'publish_marketplace'] as AccessPermissionScope[]).map((p) => (
                      <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={grantPerms.includes(p)}
                          onChange={() => togglePerm(p)}
                        />
                        <span className="capitalize">{p.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              >
                Issue Scoped Access Grant
              </button>
            </form>
          )}
        </div>
      )}

      {subView === 'inspections' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Dated Inspection & Handover History (Initial · Move-In · Move-Out)
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {propertyInspections.map((rec) => (
              <div key={rec.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white uppercase">
                    {rec.inspectionType.replace('_', '-')} Inspection · Unit {rec.unitId}
                  </p>
                  <p className="text-slate-500">
                    Inspector: {rec.inspectorName} · {rec.damagedSummary || 'All items recorded.'}
                  </p>
                </div>
                <div className="font-mono text-[11px] text-slate-500 sm:text-right">
                  <p>{rec.inspectionDate}</p>
                  <p className="text-emerald-600">{rec.tenantSignOff ? `Signed ${rec.signedAt}` : 'Pending sign-off'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist Modal */}
      {selectedUnitForInventory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">Move-In / Handover Ledger · {selectedUnitForInventory.unitNumber}</p>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Digital Room-by-Room Inventory</h2>
              </div>
              <button onClick={() => setSelectedUnitForInventory(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              {(activeChecklist?.items || []).map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{item.category}: {item.item}</p>
                    <p className="text-slate-500">{item.notes}</p>
                  </div>
                  <select
                    value={item.condition}
                    onChange={(e) =>
                      updateInventoryItem(selectedUnitForInventory.id, item.id, e.target.value as InventoryItem['condition'], true, item.notes)
                    }
                    className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => signOffInventory(selectedUnitForInventory.id, currentUser.name)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white flex items-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" />
                Sign Off & Timestamp Handover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateUnit} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Register New Unit</h2>
              <button type="button" onClick={() => setShowAddUnitModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            {unitError && <p className="text-xs text-red-600 font-medium">{unitError}</p>}
            <div className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Unit Number (e.g. Penthouse 5A)"
                value={newUnitNumber}
                onChange={(e) => setNewUnitNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" value={newBedrooms} onChange={(e) => setNewBedrooms(Number(e.target.value))} placeholder="Beds" className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
                <input type="number" value={newBathrooms} onChange={(e) => setNewBathrooms(Number(e.target.value))} placeholder="Baths" className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
                <input type="number" value={newSqft} onChange={(e) => setNewSqft(Number(e.target.value))} placeholder="Sqft" className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={newRent} onChange={(e) => setNewRent(Number(e.target.value))} placeholder="Rent" className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono" />
                <input type="number" value={newServiceCharge} onChange={(e) => setNewServiceCharge(Number(e.target.value))} placeholder="Service" className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddUnitModal(false)} className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">Save Unit</button>
            </div>
          </form>
        </div>
      )}

      {/* Tenant Onboarding Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleOnboardTenant} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Onboard Tenant via Invite or Manual Entry</h2>
              <button type="button" onClick={() => setShowOnboardModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <select value={onboardUnitId} onChange={(e) => setOnboardUnitId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {propertyUnits.map((u) => <option key={u.id} value={u.id}>{u.unitNumber}</option>)}
              </select>
              <select value={onboardMethod} onChange={(e) => setOnboardMethod(e.target.value as any)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <option value="invite_code">Generate Invite Code</option>
                <option value="invite_link">Send Onboarding Invite Link</option>
                <option value="manual">Direct Manual Assignment</option>
              </select>
              <input type="text" required value={onboardName} onChange={(e) => setOnboardName(e.target.value)} placeholder="Tenant Full Name" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
              <input type="email" required value={onboardEmail} onChange={(e) => setOnboardEmail(e.target.value)} placeholder="Tenant Email" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
              <input type="tel" required value={onboardPhone} onChange={(e) => setOnboardPhone(e.target.value)} placeholder="Tenant Phone" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowOnboardModal(false)} className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">Create Tenancy</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
