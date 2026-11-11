import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { canArtisanViewTicket } from '../utils/estateDeskLogic.ts';
import { RenovationTicket, WorkOrderStage } from '../types/index.ts';
import {
  Wrench,
  Plus,
  CheckCircle2,
  Upload,
  X,
  FileText,
  Camera,
  ShieldCheck,
} from 'lucide-react';

export const MaintenanceWorkflowView: React.FC = () => {
  const {
    renovationTickets,
    createRenovationTicket,
    updateRenovationStage,
    submitArtisanQuote,
    approveArtisanQuote,
    currentUser,
    allUsers,
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<RenovationTicket | null>(null);

  // Tenant New Issue fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RenovationTicket['category']>('plumbing');
  const [urgency, setUrgency] = useState<RenovationTicket['urgency']>('medium');
  const [unitNumber, setUnitNumber] = useState('Penthouse 4B');

  // Artisan Quote submission state
  const [quoteTicket, setQuoteTicket] = useState<RenovationTicket | null>(null);
  const [laborAmount, setLaborAmount] = useState(15000);
  const [materialsAmount, setMaterialsAmount] = useState(20000);
  const [estimatedDays, setEstimatedDays] = useState(1);
  const [quoteNotes, setQuoteNotes] = useState('');

  // Stage transition state for Managers
  const [nextStage, setNextStage] = useState<WorkOrderStage>('in_progress');
  const [assignedArtisanId, setAssignedArtisanId] = useState('usr_artisan_1');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const artisans = allUsers.filter((u) => u.role === 'artisan');
  const isManager =
    currentUser.role === 'facility_manager' ||
    currentUser.role === 'landlord' ||
    currentUser.role === 'agent';
  const isArtisan = currentUser.role === 'artisan';

  // Strict Artisan Isolation: artisans only see work orders assigned to them
  const visibleTickets = renovationTickets.filter((t) => canArtisanViewTicket(currentUser, t));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    createRenovationTicket({
      propertyId: 'prop_1',
      unitId: 'unit_101',
      unitNumber,
      tenantId: currentUser.id,
      tenantName: currentUser.name,
      title,
      description,
      category,
      urgency,
      currency: 'NGN',
      photoUrls: ['/src/assets/images/repair_plumbing_evidence_1794388815904.jpg'],
    });
    setTitle('');
    setDescription('');
    setShowCreateModal(false);
  };

  const handleManagerUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    updateRenovationStage(
      selectedTicket.id,
      nextStage,
      resolutionNotes,
      selectedTicket.estimatedCost,
      assignedArtisanId,
      selectedTicket.beforePhotoUrl,
      nextStage === 'completed' || nextStage === 'before_after_uploaded'
        ? '/src/assets/images/repair_plumbing_evidence_1794388815904.jpg'
        : undefined
    );
    setSelectedTicket(null);
  };

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteTicket) return;
    submitArtisanQuote(quoteTicket.id, {
      artisanId: currentUser.id,
      artisanName: currentUser.name,
      currency: quoteTicket.currency || 'NGN',
      laborAmount: Number(laborAmount),
      materialsAmount: Number(materialsAmount),
      totalAmount: Number(laborAmount) + Number(materialsAmount),
      estimatedDays: Number(estimatedDays),
      notes: quoteNotes || 'Standard trade repair materials + labor.',
    });
    setQuoteTicket(null);
    setQuoteNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Wrench className="w-4 h-4 text-emerald-600" />
            <span>
              {isArtisan
                ? 'Restricted Artisan Work-Order Portal (Zero Access to Unassigned Properties or Finances)'
                : '14-Step Maintenance, Renovation & Controlled Artisan Workflow'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {isArtisan ? 'My Assigned Work Orders' : 'Maintenance & Work Order Pipeline'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isArtisan
              ? 'View assigned work orders, submit itemized quotations, log progress, and upload before/after proof.'
              : 'Issue submission → manager review → work order → artisan assignment → quotation approval → before/after verification.'}
          </p>
        </div>

        {currentUser.role === 'tenant' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Report Repair Request
          </button>
        )}
      </div>

      {/* Isolation notice for Artisan */}
      {isArtisan && (
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Artisan Scope Enforced: Showing {visibleTickets.length} work order(s) explicitly assigned to {currentUser.name}. Tenant leases, rent ledgers, and private chats are hidden.
          </span>
        </div>
      )}

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs flex flex-col justify-between"
          >
            <div>
              {ticket.photoUrls[0] && (
                <div className="relative h-40 bg-slate-100 dark:bg-slate-800">
                  <img
                    src={ticket.photoUrls[0]}
                    alt={ticket.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        ticket.urgency === 'high' || ticket.urgency === 'emergency'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-900/80 text-white'
                      }`}
                    >
                      {ticket.urgency}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/65 text-white uppercase">
                      {ticket.category}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    Unit {ticket.unitNumber}
                  </span>
                  <span className="font-mono font-bold uppercase text-[11px] text-blue-600 dark:text-blue-400">
                    {ticket.stage.replace(/_/g, ' ')}
                  </span>
                </div>

                <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {ticket.title}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {ticket.description}
                </p>

                {/* Quote Card */}
                {ticket.quote && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                      <span>Artisan Quote ({ticket.quote.artisanName})</span>
                      <span className="font-mono tabular-nums">₦{ticket.quote.totalAmount.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Labor ₦{ticket.quote.laborAmount.toLocaleString()} + Materials ₦{ticket.quote.materialsAmount.toLocaleString()} · {ticket.quote.estimatedDays}d
                    </p>
                    {ticket.quote.approvedAt ? (
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Quote Approved by {ticket.quote.approvedBy}
                      </p>
                    ) : (
                      isManager && (
                        <button
                          onClick={() => approveArtisanQuote(ticket.id)}
                          className="mt-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Approve Quote & Authorize Work
                        </button>
                      )
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                  <p>Logged: {ticket.reportedAt}</p>
                  {ticket.assignedArtisanName && (
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                      Artisan: {ticket.assignedArtisanName}
                    </p>
                  )}
                  {ticket.afterPhotoUrl && (
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Before & After proof uploaded
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Role-Scoped Footer Actions */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
              {isArtisan && (
                <>
                  <button
                    onClick={() => setQuoteTicket(ticket)}
                    className="flex-1 py-2 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {ticket.quote ? 'Revise Quote' : 'Submit Quote'}
                  </button>
                  <button
                    onClick={() =>
                      updateRenovationStage(
                        ticket.id,
                        'before_after_uploaded',
                        'Before & after repair photos uploaded by assigned artisan.',
                        ticket.estimatedCost,
                        currentUser.id,
                        '/src/assets/images/repair_plumbing_evidence_1794388815904.jpg',
                        '/src/assets/images/repair_plumbing_evidence_1794388815904.jpg'
                      )
                    }
                    className="flex-1 py-2 px-2.5 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  >
                    Upload After Proof
                  </button>
                </>
              )}

              {isManager && (
                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setNextStage(ticket.stage);
                    setAssignedArtisanId(ticket.assignedArtisanId || 'usr_artisan_1');
                    setResolutionNotes(ticket.resolutionNotes || '');
                  }}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Triage / Assign Artisan / Close Job
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tenant Repair Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Submit Maintenance Request</h2>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kitchen sink angle valve leak"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="hvac">HVAC</option>
                  <option value="carpentry">Carpentry</option>
                  <option value="structural">Structural</option>
                </select>
                <select value={urgency} onChange={(e) => setUrgency(e.target.value as any)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe defect location and symptoms..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">Submit Issue</button>
            </div>
          </form>
        </div>
      )}

      {/* Manager Stage & Artisan Dispatch Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleManagerUpdate} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Manage Work Order</h2>
              <button type="button" onClick={() => setSelectedTicket(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Workflow Stage (14-Step Pipeline)</label>
                <select value={nextStage} onChange={(e) => setNextStage(e.target.value as WorkOrderStage)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <option value="reported">1. Issue Reported</option>
                  <option value="manager_reviewed">2. Manager Reviewed</option>
                  <option value="approved">3. Approved for Work Order</option>
                  <option value="artisan_assigned">4. Artisan Assigned</option>
                  <option value="quote_approved">5. Quote Approved</option>
                  <option value="in_progress">6. Repair In Progress</option>
                  <option value="before_after_uploaded">7. Before/After Uploaded</option>
                  <option value="work_reviewed">8. Work Reviewed</option>
                  <option value="completed">9. Job Closed & Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Assign Certified Artisan</label>
                <select value={assignedArtisanId} onChange={(e) => setAssignedArtisanId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  {artisans.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.kycData?.artisanTrade || 'Craft'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Inspection & Closure Notes</label>
                <textarea rows={3} value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSelectedTicket(null)} className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white">Save Stage</button>
            </div>
          </form>
        </div>
      )}

      {/* Artisan Quote Submission Modal */}
      {quoteTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSubmitQuote} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Submit Work Order Quotation</h2>
              <button type="button" onClick={() => setQuoteTicket(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block font-semibold mb-1">Labor (₦)</label>
                <input type="number" value={laborAmount} onChange={(e) => setLaborAmount(Number(e.target.value))} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Materials (₦)</label>
                <input type="number" value={materialsAmount} onChange={(e) => setMaterialsAmount(Number(e.target.value))} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Days</label>
                <input type="number" min={1} value={estimatedDays} onChange={(e) => setEstimatedDays(Number(e.target.value))} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono" />
              </div>
            </div>
            <textarea
              rows={2}
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              placeholder="List replacement parts and scope..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setQuoteTicket(null)} className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">Submit Quote</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
