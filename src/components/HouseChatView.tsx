import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { canAccessUnitChat } from '../utils/estateDeskLogic.ts';
import {
  Send,
  Building2,
  Megaphone,
  Flag,
  Lock,
  ShieldCheck,
} from 'lucide-react';

export const HouseChatView: React.FC = () => {
  const {
    chatMessages,
    sendMessage,
    reportChatMessage,
    currentUser,
    visibleProperties,
    units,
    tenancies,
    accessGrants,
    selectedPropertyId,
    setSelectedPropertyId,
  } = useApp();

  const selectedProperty =
    visibleProperties.find((p) => p.id === selectedPropertyId) || visibleProperties[0];

  const propertyUnits = selectedProperty
    ? units.filter((u) => u.propertyId === selectedProperty.id)
    : [];

  // Default to tenant's assigned unit if tenant, otherwise first unit
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    currentUser.role === 'tenant' && currentUser.assignedUnitId
      ? currentUser.assignedUnitId
      : propertyUnits[0]?.id || 'unit_101'
  );
  const [channelScope, setChannelScope] = useState<'unit_private' | 'building_announcement'>('unit_private');
  const [inputText, setInputText] = useState('');
  const [isAdminNotice, setIsAdminNotice] = useState(false);

  if (currentUser.role === 'artisan') {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
        <Lock className="w-7 h-7 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Private Resident Chats Restricted</h2>
        <p className="text-xs text-slate-500">
          Artisans do not have access to private apartment chats or building notices. Coordinate strictly through your assigned work orders.
        </p>
      </div>
    );
  }

  if (!selectedProperty) {
    return null;
  }

  const accessibleUnits = propertyUnits.filter((u) =>
    canAccessUnitChat(currentUser, selectedProperty, u.id, tenancies, accessGrants)
  );

  const activeUnitId = accessibleUnits.some((u) => u.id === selectedUnitId)
    ? selectedUnitId
    : accessibleUnits[0]?.id;

  const hasUnitAccess = activeUnitId
    ? canAccessUnitChat(currentUser, selectedProperty, activeUnitId, tenancies, accessGrants)
    : false;

  const filteredMessages = chatMessages.filter((msg) => {
    if (msg.propertyId !== selectedProperty.id) return false;
    if (channelScope === 'building_announcement') {
      return msg.channelScope === 'building_announcement';
    }
    return msg.channelScope === 'unit_private' && msg.unitId === activeUnitId;
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (channelScope === 'unit_private' && !hasUnitAccess) return;

    sendMessage(
      selectedProperty.id,
      inputText.trim(),
      channelScope === 'unit_private' ? activeUnitId : undefined,
      (currentUser.role === 'landlord' || currentUser.role === 'agent') && isAdminNotice
    );
    setInputText('');
    setIsAdminNotice(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Apartment-Specific Private Channels & Tenancy Isolation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Private Unit Group Chats & Estate Notices
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Each individual apartment has a private channel accessible strictly to active tenants of that unit, landlord, and authorized managers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedProperty.id}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            {visibleProperties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {channelScope === 'unit_private' && accessibleUnits.length > 0 && (
            <select
              value={activeUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              {accessibleUnits.map((u) => (
                <option key={u.id} value={u.id}>Unit: {u.unitNumber}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Scope Switcher */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start w-fit text-xs font-semibold">
        <button
          onClick={() => setChannelScope('unit_private')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            channelScope === 'unit_private'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Apartment Private Thread
        </button>
        <button
          onClick={() => setChannelScope('building_announcement')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            channelScope === 'building_announcement'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Property Announcements
        </button>
      </div>

      {/* Chat Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col h-[520px] overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {channelScope === 'unit_private'
                  ? `${selectedProperty.name} · ${accessibleUnits.find((u) => u.id === activeUnitId)?.unitNumber || 'Restricted Unit'}`
                  : `${selectedProperty.name} Announcements`}
              </h2>
              <p className="text-[11px] text-slate-400">
                {channelScope === 'unit_private'
                  ? 'Active Unit Tenancy & Authorized Stakeholders Only (Former tenants removed)'
                  : 'Verified Property-Wide Notices'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {filteredMessages.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-12">
              No messages in this channel yet. Start a conversation below.
            </p>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700 mt-0.5"
                  />
                  <div className={`space-y-1 max-w-[80%] sm:max-w-md`}>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{msg.senderName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{msg.timestamp}</span>
                      {!isMe && !msg.reported && (
                        <button
                          type="button"
                          onClick={() => reportChatMessage(msg.id, 'Reported via unit chat moderation')}
                          title="Report message"
                          className="hover:text-red-600 ml-1"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.isAdminNotice
                          ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100 font-medium'
                          : isMe
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {msg.isAdminNotice && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase mb-1">
                          <Megaphone className="w-3 h-3" />
                          <span>Official Property Notice</span>
                        </div>
                      )}
                      <p>{msg.text}</p>
                      {msg.reported && (
                        <p className="text-[10px] text-red-500 mt-1 font-semibold">Flagged for moderation review</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
          {(currentUser.role === 'landlord' || currentUser.role === 'agent') && channelScope === 'building_announcement' && (
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdminNotice}
                onChange={(e) => setIsAdminNotice(e.target.checked)}
              />
              <span className="font-semibold text-[11px]">Pin as Official Property Notice</span>
            </label>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={channelScope === 'unit_private' && !hasUnitAccess}
              placeholder={
                channelScope === 'unit_private' && !hasUnitAccess
                  ? 'Access restricted to active unit tenancy...'
                  : `Send message as ${currentUser.name.split(' ')[0]}...`
              }
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || (channelScope === 'unit_private' && !hasUnitAccess)}
              className={`p-2.5 rounded-xl font-semibold transition-colors shrink-0 ${
                inputText.trim()
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
