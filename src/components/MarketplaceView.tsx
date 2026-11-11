import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { formatCurrencyAmount } from '../utils/estateDeskLogic.ts';
import { MarketplaceListing, PropertyCategory } from '../types/index.ts';
import {
  Search,
  MapPin,
  ShieldCheck,
  Calendar,
  Flag,
  Plus,
  X,
  CheckCircle2,
  Building2,
  Sparkles,
  Eye,
} from 'lucide-react';

export const MarketplaceView: React.FC = () => {
  const {
    marketplaceListings,
    createMarketplaceListing,
    bookListingInspection,
    reportMarketplaceListing,
    inspectionBookings,
    currencies,
    currentUser,
  } = useApp();

  const [intentFilter, setIntentFilter] = useState<'all' | 'rent' | 'sale'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | PropertyCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [bookingListing, setBookingListing] = useState<MarketplaceListing | null>(null);
  const [prospectName, setProspectName] = useState('');
  const [prospectEmail, setProspectEmail] = useState('');
  const [prospectPhone, setProspectPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('2026-11-15');
  const [preferredTime, setPreferredTime] = useState('11:00');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const [reportingListing, setReportingListing] = useState<MarketplaceListing | null>(null);
  const [reportReason, setReportReason] = useState('Suspicious pricing or duplicate listing');

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newCategory, setNewCategory] = useState<PropertyCategory>('residential');
  const [newIntent, setNewIntent] = useState<'rent' | 'sale'>('rent');
  const [newCity, setNewCity] = useState('Abuja');
  const [newCurrency, setNewCurrency] = useState('NGN');
  const [newPrice, setNewPrice] = useState(12500000);
  const [newArea, setNewArea] = useState('2,000 sqft');

  const publishedListings = marketplaceListings
    .filter((l) => l.moderationStatus === 'published')
    .filter((l) => (intentFilter === 'all' ? true : l.intent === intentFilter))
    .filter((l) => (categoryFilter === 'all' ? true : l.category === categoryFilter))
    .filter(
      (l) =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.summary.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => Number(b.promoted) - Number(a.promoted));

  const canPublish = currentUser.role === 'landlord' || currentUser.role === 'agent';

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingListing || !prospectName) return;
    bookListingInspection({
      listingId: bookingListing.id,
      listingTitle: bookingListing.title,
      prospectName,
      prospectEmail,
      prospectPhone,
      preferredDate,
      preferredTime,
      notes: bookingNotes,
    });
    setBookingSuccess(`Viewing request submitted for "${bookingListing.title}".`);
    setBookingListing(null);
    setProspectName('');
    setProspectEmail('');
    setProspectPhone('');
    setBookingNotes('');
    setTimeout(() => setBookingSuccess(null), 4000);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingListing) return;
    reportMarketplaceListing(reportingListing.id, reportReason);
    setBookingSuccess(`Listing "${reportingListing.title}" flagged for Super Admin moderation review.`);
    setReportingListing(null);
    setTimeout(() => setBookingSuccess(null), 4000);
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    createMarketplaceListing({
      ownerUserId: currentUser.id,
      listerName: currentUser.name,
      listerRole: currentUser.role === 'agent' ? 'agent' : 'landlord',
      listerVerifiedIdentity: currentUser.kycTracks.identity.status === 'verified',
      listerVerifiedProfessional: currentUser.kycTracks.professionalQualification.status === 'verified',
      listerVerifiedOwnership: currentUser.kycTracks.propertyOwnership.status === 'verified',
      title: newTitle,
      summary: newSummary || 'Public marketplace listing submitted from EstateDesk.',
      category: newCategory,
      intent: newIntent,
      city: newCity,
      state: newCity === 'Abuja' ? 'FCT' : 'Lagos State',
      country: 'Nigeria',
      currency: newCurrency,
      price: Number(newPrice),
      pricePeriod: newIntent === 'sale' ? 'outright sale' : 'per year',
      areaLabel: newArea,
      amenities: ['Gated Security', 'Water Supply', 'Power Backup'],
      image:
        newCategory === 'land_plot'
          ? '/src/assets/images/marketplace_land_lekki_1794388814350.jpg'
          : newCategory === 'commercial'
          ? '/src/assets/images/marketplace_commercial_vi_1794388814696.jpg'
          : '/src/assets/images/property_ikoyi_crest_1793969242346.jpg',
      promoted: false,
    });
    setShowPublishModal(false);
    setNewTitle('');
    setNewSummary('');
    setBookingSuccess('Listing submitted to Super Admin moderation queue (public view excludes private tenant & deed documents).');
    setTimeout(() => setBookingSuccess(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            EstateDesk Public Property Marketplace
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            Verified Rentals, Commercial Spaces & Serviced Land
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Public discovery strictly separated from private tenant ledgers, leases, and ownership deeds.
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => setShowPublishModal(true)}
            className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Submit Public Listing
          </button>
        )}
      </div>

      {bookingSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bookingSuccess}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city, property title, or estate..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            {(['all', 'rent', 'sale'] as const).map((i) => (
              <button
                key={i}
                onClick={() => setIntentFilter(i)}
                className={`px-3 py-1.5 rounded-md capitalize transition-colors ${
                  intentFilter === i
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {i === 'all' ? 'Rent & Sale' : `For ${i}`}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'all' | PropertyCategory)}
            aria-label="Filter property category"
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Asset Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="mixed">Mixed-Use</option>
            <option value="land_plot">Land & Plots</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {publishedListings.map((listing) => (
          <div
            key={listing.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-900/85 text-white">
                    {listing.intent === 'rent' ? 'For Rent' : 'For Sale'} · {listing.category.replace('_', ' ')}
                  </span>
                  {listing.promoted && (
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500 text-slate-950 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Promoted
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {formatCurrencyAmount(listing.price, listing.currency, currencies)}
                  </p>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {listing.pricePeriod}
                  </span>
                </div>

                <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {listing.title}
                </h2>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{listing.city}, {listing.state}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{listing.areaLabel}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {listing.summary}
                </p>

                {/* Explicit Separated Verification Disclosure (10.14 / 10.13) */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                    <span>Listed by {listing.listerName}</span>
                    <span className="text-slate-400 capitalize font-normal">{listing.listerRole}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                    {listing.listerVerifiedIdentity && (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Identity Verified
                      </span>
                    )}
                    {listing.listerVerifiedProfessional && (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> ESV Licensed
                      </span>
                    )}
                    {listing.listerVerifiedOwnership && (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Title Checked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => setBookingListing(listing)}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                Book Inspection / Enquire
              </button>
              <button
                onClick={() => setReportingListing(listing)}
                title="Report suspicious listing"
                aria-label={`Report ${listing.title}`}
                className="p-2 text-slate-500 hover:text-red-600 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Inspection Requests (visible to Landlords, Agents, Admins) */}
      {(canPublish || currentUser.role === 'super_admin') && inspectionBookings.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Marketplace Viewing Requests & Leads ({inspectionBookings.length})
            </h3>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              Private lead pipeline
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {inspectionBookings.map((b) => (
              <div key={b.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{b.listingTitle}</p>
                  <p className="text-slate-500">
                    Prospect: {b.prospectName} · {b.prospectPhone} · {b.prospectEmail}
                  </p>
                </div>
                <div className="text-left sm:text-right font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  <p>Preferred: {b.preferredDate} at {b.preferredTime}</p>
                  <p className="text-emerald-600 dark:text-emerald-400 uppercase font-sans font-bold">{b.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Book Inspection Modal */}
      {bookingListing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleBookSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Request Inspection / Lead Enquiry
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{bookingListing.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setBookingListing(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={prospectName}
                  onChange={(e) => setProspectName(e.target.value)}
                  placeholder="e.g. Chidi Nwosu"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={prospectEmail}
                    onChange={(e) => setProspectEmail(e.target.value)}
                    placeholder="name@company.ng"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={prospectPhone}
                    onChange={(e) => setProspectPhone(e.target.value)}
                    placeholder="+234 803..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Preferred Time</label>
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Enquiry Notes</label>
                <textarea
                  rows={2}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Move-in timeline, inspection questions..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBookingListing(null)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              >
                Submit Viewing Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Suspicious Listing Modal */}
      {reportingListing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleReportSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Flag Listing for Moderation</h2>
              <button type="button" onClick={() => setReportingListing(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Flagging &ldquo;{reportingListing.title}&rdquo; escalates this listing to the Super Admin Trust & Safety queue.
            </p>
            <textarea
              rows={3}
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setReportingListing(null)} className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white">
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Publish Public Listing Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handlePublishSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Submit Marketplace Listing</h2>
                <p className="text-xs text-slate-500">Enters Super Admin moderation before public visibility.</p>
              </div>
              <button type="button" onClick={() => setShowPublishModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Listing Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 4-Bed Terrace Duplex — Maitama, Abuja"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Asset Type</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as PropertyCategory)}
                    className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixed">Mixed-Use</option>
                    <option value="land_plot">Land / Plot</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Intent</label>
                  <select
                    value={newIntent}
                    onChange={(e) => setNewIntent(e.target.value as 'rent' | 'sale')}
                    className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <option value="rent">For Rent</option>
                    <option value="sale">For Sale</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Currency</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Price</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Area / Plot Size</label>
                  <input
                    type="text"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Public Summary</label>
                <textarea
                  rows={2}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Describe verified property features without private tenant data..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowPublishModal(false)} className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                Submit for Review
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
