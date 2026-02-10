import React from 'react';
import { View, User } from '../types';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  user: User;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user, onLogout, isOpen, onClose }) => {

  const handleNavClick = (view: View) => {
    setView(view);
    onClose(); // Close sidebar on mobile when item clicked
  };

  const NavItem = ({ view, label, icon }: { view: View; label: string; icon: string }) => (
    <button
      onClick={() => handleNavClick(view)}
      className={`w-full text-left px-4 py-2.5 rounded-lg mb-1 flex items-center transition-colors ${currentView === view
        ? 'bg-gg-cyan/20 text-gg-cyan font-semibold border-r-2 border-gg-cyan'
        : 'text-gray-400 hover:bg-gg-navy-secondary hover:text-white'
        }`}
    >
      <span className="mr-3 text-lg">{icon}</span>
      {label}
    </button>
  );

  const SectionLabel = ({ label }: { label: string }) => (
    <div className="px-4 mt-6 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
      {label}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div className={`w-64 bg-gg-navy border-r border-gg-navy-secondary h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
        <div className="p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gg-cyan to-gg-purple">
              GreenGalaxy
            </h1>
            <p className="text-xs text-gray-500 mt-1">VR Workspace Platform</p>
          </div>
          {/* Close Button (Mobile Only) */}
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          <SectionLabel label="Workspace" />
          <div className="px-2">
            <NavItem view={View.DASHBOARD} label="Dashboard" icon="📊" />
            <NavItem view={View.SPACES} label="VR Spaces" icon="🕶️" />
            <NavItem view={View.ASSETS} label="Assets & Models" icon="📦" />
            <NavItem view={View.IDEAS} label="AI Generator" icon="✨" />
            <NavItem view={View.NEXUS_HUB} label="Nexus Intelligence" icon="🧠" />
          </div>

          <SectionLabel label="Run VR" />
          <div className="px-2">
            <NavItem view={View.DEVICES} label="Devices" icon="🥽" />

            <NavItem view={View.PUBLISH} label="Publish" icon="🚀" />
          </div>

          <SectionLabel label="Organization" />
          <div className="px-2">
            <NavItem view={View.PROFILE} label="My Profile" icon="👤" />
            <NavItem view={View.TEAM} label="Team & Access" icon="👥" />
            <NavItem view={View.BRAND} label="Brand & Identity" icon="🎨" />
            <NavItem view={View.ORG_SETTINGS} label="Settings" icon="⚙️" />
          </div>

          {user.role === 'OWNER' && user.email.includes('admin') && (
            <>
              <SectionLabel label="Platform" />
              <div className="px-2">
                <NavItem view={View.PLATFORM_ADMIN} label="Platform Admin" icon="🛡️" />
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gg-navy-secondary bg-gg-navy-secondary/30">
          <div className="flex items-center mb-3">
            <img src={user.picture} alt="User" className="w-8 h-8 rounded-full mr-3 border border-gg-cyan" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-1.5 text-xs text-center border border-gray-600 rounded text-gray-300 hover:bg-white/5 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;