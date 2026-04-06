import React from 'react';
import { Globe, MessageSquare, Heart, Play, User, LogOut, Menu, X } from 'lucide-react';
import { APP_NAME } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  onMenuClick: (menu: string) => void;
  activeMenu: string;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onMenuClick, activeMenu }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menus = [
    { id: 'feed', label: 'Home', icon: <Globe size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={20} /> },
    { id: 'dating', label: 'Dating', icon: <Heart size={20} /> },
    { id: 'blockbuster', label: 'Blockbuster', icon: <Play size={20} /> },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onMenuClick('feed')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-200">
            <Globe size={24} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-neutral-900 hidden sm:block">
            {APP_NAME}
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-1 md:flex">
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => onMenuClick(menu.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                activeMenu === menu.id
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-orange-600'
              }`}
            >
              {menu.icon}
              {menu.label}
            </button>
          ))}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            <>
              <div 
                onClick={() => onMenuClick('profile')}
                className="flex cursor-pointer items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 hover:bg-neutral-200 transition-all"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <User size={16} className="text-neutral-500" />
                )}
                <span className="text-sm font-bold text-neutral-700 hidden sm:block">
                  {user.displayName.split(' ')[0]}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="rounded-full bg-red-50 p-2 text-red-500 hover:bg-red-100 transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <button className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-all active:scale-95">
              Sign In
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-neutral-600 md:hidden hover:bg-neutral-100"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm md:hidden"
            />
            {/* Menu Content */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute left-0 right-0 top-full z-50 border-t border-neutral-200 bg-white p-4 shadow-2xl md:hidden"
            >
              <div className="flex flex-col gap-2">
                {menus.map((menu) => (
                  <button
                    key={menu.id}
                    onClick={() => {
                      onMenuClick(menu.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-bold transition-all ${
                      activeMenu === menu.id
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    <span className={activeMenu === menu.id ? 'text-orange-600' : 'text-neutral-400'}>
                      {menu.icon}
                    </span>
                    {menu.label}
                  </button>
                ))}
                
                {user && (
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3 text-base font-bold text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
