import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  BookOpen, 
  Bot, 
  Award, 
  FileEdit, 
  Wand2, 
  Shield,
  LogOut,
  Settings,
  MessageSquare
} from 'lucide-react';
import logoImg from '../../logo.png';

const SidebarLink = ({ icon: Icon, label, isActive, onClick, badge }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
      isActive 
        ? 'bg-navy text-white shadow-md shadow-navy/20' 
        : 'text-slate-600 hover:bg-navy-50 hover:text-navy-900'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-navy'}`} />
      <span className="font-medium text-sm">{label}</span>
    </div>
    {badge && (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-navy-100 text-navy'}`}>
        {badge}
      </span>
    )}
  </button>
);

const SidebarSection = ({ title, children }) => (
  <div className="mb-8">
    <div className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
      {title}
    </div>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

const Sidebar = ({ user, onLogout, activeView, onViewChange }) => {
  const [communityCount, setCommunityCount] = useState(0);

  useEffect(() => {
    const fetchCommunityCount = async () => {
      try {
        const url = new URL(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/community/proposals`);
        const token = localStorage.getItem('sf_token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(url.toString(), { headers });
        if (res.ok) {
          const data = await res.json();
          setCommunityCount(data.length || 0);
        }
      } catch (err) {
        console.error("Failed to fetch community proposals count", err);
      }
    };
    fetchCommunityCount();
  }, []);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col flex-shrink-0 sticky top-0 overflow-y-auto no-scrollbar font-sans">
      <div className="h-20 flex items-center px-6 border-b border-slate-100 shrink-0">
        <img src={logoImg} alt="SkillForge Logo" className="w-8 h-8 rounded-lg object-cover mr-3 shadow-sm" />
        <span className="text-xl font-bold tracking-tight text-navy-900">SkillForge</span>
      </div>

      <div className="flex-1 px-4 py-6">
        {user?.role !== 'reviewer' && user?.role !== 'admin' && user?.role !== 'expert' && (
          <SidebarSection title="Learn">
            <SidebarLink icon={LayoutDashboard} label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => onViewChange('dashboard')} />
            <SidebarLink icon={ShoppingBag} label="Marketplace" isActive={activeView === 'marketplace'} onClick={() => onViewChange('marketplace')} />
            <SidebarLink icon={BookOpen} label="My Learning" isActive={activeView === 'mylearning'} onClick={() => onViewChange('mylearning')} />
            <SidebarLink icon={Bot} label="Expert Guide" isActive={activeView === 'ai-assistant'} onClick={() => onViewChange('ai-assistant')} />
            <SidebarLink icon={Award} label="Certifications" isActive={activeView === 'certifications'} onClick={() => onViewChange('certifications')} />
          </SidebarSection>
        )}

        {user?.role !== 'reviewer' && user?.role !== 'admin' && user?.role !== 'expert' && (
          <SidebarSection title="Create">
            <SidebarLink icon={FileEdit} label="Community feed" isActive={activeView === 'community-voting'} onClick={() => onViewChange('community-voting')} badge={communityCount > 0 ? communityCount : null} />
          </SidebarSection>
        )}

        {(user?.role === 'reviewer' || user?.role === 'admin') && (
          <SidebarSection title="Review Admin">
            <SidebarLink icon={FileEdit} label="Review Center" isActive={activeView === 'review-center'} onClick={() => onViewChange('review-center')} />
            {user?.role === 'admin' && (
              <SidebarLink icon={Shield} label="Admin Panel" isActive={activeView === 'admin-panel'} onClick={() => onViewChange('admin-panel')} />
            )}
          </SidebarSection>
        )}

        {(user?.role === 'expert' || user?.role === 'admin') && (
          <SidebarSection title="Expert Console">
            <SidebarLink icon={BookOpen} label="Expert Panel" isActive={activeView === 'expert-panel'} onClick={() => onViewChange('expert-panel')} />
          </SidebarSection>
        )}

        <SidebarSection title="Account">
          <SidebarLink icon={MessageSquare} label="Feedback" isActive={activeView === 'feedback'} onClick={() => onViewChange('feedback')} />
          <SidebarLink icon={Settings} label="Settings" isActive={activeView === 'settings'} onClick={() => onViewChange('settings')} />
        </SidebarSection>
      </div>

      <div className="p-4 border-t border-slate-100 shrink-0">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <div className="text-sm font-bold text-navy-900 truncate">{user?.name || 'Alex Johnson'}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email || 'alex@company.com'}</div>
          </div>
          <LogOut size={18} className="text-slate-400 group-hover:text-coral transition-colors" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
