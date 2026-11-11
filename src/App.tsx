import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { DashboardOverview } from './components/DashboardOverview.tsx';
import { PropertiesUnitsView } from './components/PropertiesUnitsView.tsx';
import { RentAlertsEngineView } from './components/RentAlertsEngineView.tsx';
import { InvoiceReceiptGenerator } from './components/InvoiceReceiptGenerator.tsx';
import { TenancyFormSignView } from './components/TenancyFormSignView.tsx';
import { MaintenanceWorkflowView } from './components/MaintenanceWorkflowView.tsx';
import { HouseChatView } from './components/HouseChatView.tsx';
import { KYCVerificationView } from './components/KYCVerificationView.tsx';
import { SecurityLockoutView } from './components/SecurityLockoutView.tsx';
import { SubscriptionView } from './components/SubscriptionView.tsx';
import { MarketplaceView } from './components/MarketplaceView.tsx';
import { SuperAdminPortalView } from './components/SuperAdminPortalView.tsx';
import { ProfilePrivacyView } from './components/ProfilePrivacyView.tsx';
import { NotFoundView } from './components/NotFoundView.tsx';
import { Footer } from './components/Footer.tsx';
import { LegalComplianceModals } from './components/LegalComplianceModals.tsx';
import { AgeGateModal } from './components/AgeGateModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Wrench,
  MessageSquare,
  Store,
  ShieldAlert,
  UserCircle2,
  ShieldCheck,
  Wifi,
  Battery,
  Signal,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    isMobileFrameMode,
    rentExpirationAlerts,
    renovationTickets,
  } = useApp();

  const urgentAlertsCount = rentExpirationAlerts.filter((a) => a.isUrgent).length;
  const activeTicketsCount = renovationTickets.filter((t) =>
    currentUser.role === 'artisan'
      ? t.assignedArtisanId === currentUser.id && t.status !== 'completed'
      : t.status !== 'completed'
  ).length;

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'marketplace':
        return <MarketplaceView />;
      case 'super_admin':
        return <SuperAdminPortalView />;
      case 'profile':
        return <ProfilePrivacyView />;
      case 'properties':
        return <PropertiesUnitsView />;
      case 'rent_engine':
        return <RentAlertsEngineView />;
      case 'financials':
        return <InvoiceReceiptGenerator />;
      case 'tenancy':
        return <TenancyFormSignView />;
      case 'maintenance':
        return <MaintenanceWorkflowView />;
      case 'chat':
        return <HouseChatView />;
      case 'kyc':
        return <KYCVerificationView />;
      case 'security':
        return <SecurityLockoutView />;
      case 'subscription':
        return <SubscriptionView />;
      case '404':
        return <NotFoundView />;
      default:
        return <NotFoundView />;
    }
  };

  const getMobileTabs = () => {
    if (currentUser.role === 'artisan') {
      return [
        { id: 'maintenance', label: 'Jobs', icon: Wrench, badge: activeTicketsCount },
        { id: 'marketplace', label: 'Market', icon: Store },
        { id: 'kyc', label: 'KYC', icon: ShieldCheck },
        { id: 'profile', label: 'Profile', icon: UserCircle2 },
      ];
    }
    if (currentUser.role === 'super_admin') {
      return [
        { id: 'super_admin', label: 'Admin', icon: ShieldAlert },
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'marketplace', label: 'Market', icon: Store },
        { id: 'subscription', label: 'Plans', icon: CreditCard },
        { id: 'security', label: 'Audit', icon: ShieldCheck },
      ];
    }
    return [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'marketplace', label: 'Market', icon: Store },
      { id: 'properties', label: 'Units', icon: Building2, badge: urgentAlertsCount },
      { id: 'financials', label: 'Payments', icon: CreditCard },
      { id: 'maintenance', label: 'Repairs', icon: Wrench, badge: activeTicketsCount },
      { id: 'chat', label: 'Chats', icon: MessageSquare },
    ];
  };

  const mobileTabs = getMobileTabs();

  if (isMobileFrameMode) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 py-8">
        <div className="mb-4 text-center space-y-1">
          <p className="text-xs font-semibold text-white">
            Simulated Mobile Viewport (390 × 844)
          </p>
          <p className="text-[11px] text-slate-400">
            EstateDesk touch navigation & role-aware bottom bar
          </p>
        </div>

        <div className="relative w-[390px] h-[844px] bg-slate-950 rounded-[50px] p-3 shadow-2xl border-4 border-slate-700 overflow-hidden flex flex-col">
          <div className="pt-2 px-6 pb-1 flex items-center justify-between text-[11px] text-slate-400 font-semibold z-40 bg-white dark:bg-slate-900 rounded-t-[40px]">
            <span>09:41</span>
            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 rounded-b-[40px] flex flex-col scrollbar-none">
            <Header />
            <main className="flex-1 p-4 pb-24">
              {renderActiveView()}
            </main>
          </div>

          <nav className="absolute bottom-3 inset-x-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 rounded-b-[42px] px-2 py-2 flex items-center justify-around z-40">
            {mobileTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] transition-colors relative ${
                    isActive
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
                  {!!tab.badge && tab.badge > 0 && (
                    <span className="absolute top-1 right-1.5 px-1 text-[9px] font-mono font-bold bg-red-600 text-white rounded">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors pb-16 md:pb-0">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {renderActiveView()}
      </main>

      <Footer />

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-30 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] transition-colors relative ${
                isActive
                  ? 'text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
              {!!tab.badge && tab.badge > 0 && (
                <span className="absolute top-1 right-1.5 px-1 text-[9px] font-mono font-bold bg-red-600 text-white rounded">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <LegalComplianceModals />
      <AgeGateModal />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
