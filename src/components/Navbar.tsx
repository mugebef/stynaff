import React from 'react';
import { Globe, MessageSquare, Heart, Play, User, LogOut, Menu, X, LayoutDashboard, Video, Wallet as WalletIcon, Bell, Radio } from 'lucide-react';
import { APP_NAME } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  onMenuClick: (menu: string) => void;
  activeMenu: string;
  notificationCount: number;
  notifications: any[];
  onMarkRead: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  onLogout, 
  onMenuClick, 
  activeMenu, 
  notificationCount,
  notifications,
  onMarkRead
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  const menus = [
    { id: 'reels', label: 'Reels', icon: <Video size={20} /> },
    { id: 'blockbuster', label: 'Blockbuster', icon: <Play size={20} /> },
    { id: 'dating', label: 'Dating', icon: <Heart size={20} /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={20} /> },
    { id: 'live', label: 'Live', icon: <Radio size={20} /> },
  ];

  if (user?.role === 'admin') {
    menus.splice(1, 0, { id: 'admin', label: 'Admin', icon: <LayoutDashboard size={20} /> });
  }

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <div className="flex flex-col items-start cursor-pointer" onClick={() => onMenuClick('feed')}>
          <div className="flex items-center gap-2">
            <span className="font-serif text-3xl font-black italic tracking-tighter text-orange-600 drop-shadow-sm">
              Styn
            </span>
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-900 leading-none mt-0.5">
            A UNIQUE EXPERIENCE.
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
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative rounded-full p-2 text-neutral-500 hover:bg-neutral-100 transition-all"
                >
                  <Bell size={20} />
                  {notificationCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white ring-2 ring-white">
                      {notificationCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsNotificationsOpen(false)}
                        className="fixed inset-0 z-40"
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xl ring-1 ring-neutral-200 z-50"
                      >
                        <div className="p-3 border-b border-neutral-100 flex items-center justify-between">
                          <h3 className="text-sm font-bold text-neutral-900">Notifications</h3>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{notificationCount} New</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto py-2">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-neutral-400">
                              <p className="text-xs font-bold">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div 
                                key={notif.id}
                                onClick={() => {
                                  if (!notif.read) onMarkRead(notif.id);
                                  setIsNotificationsOpen(false);
                                  if (notif.type === 'friend_request' || notif.type === 'friend_accepted') {
                                    onMenuClick('profile');
                                  } else if (notif.type === 'like' || notif.type === 'comment') {
                                    onMenuClick('feed');
                                  }
                                }}
                                className={`flex items-start gap-3 rounded-xl p-3 transition-all hover:bg-neutral-50 cursor-pointer ${!notif.read ? 'bg-orange-50/50' : ''}`}
                              >
                                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!notif.read ? 'bg-orange-600' : 'bg-transparent'}`} />
                                <div className="flex-1">
                                  <p className="text-xs leading-relaxed text-neutral-700">
                                    <span className="font-bold text-neutral-900">{notif.fromName}</span> {
                                      notif.type === 'like' ? 'liked your post' :
                                      notif.type === 'comment' ? 'commented on your post' :
                                      notif.type === 'friend_request' ? 'sent you a friend request' :
                                      notif.type === 'friend_accepted' ? 'accepted your friend request' :
                                      'interacted with you'
                                    }
                                  </p>
                                  <p className="mt-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                    {notif.createdAt ? new Date(notif.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <div 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
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

                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="fixed inset-0 z-40"
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xl ring-1 ring-neutral-200 z-50"
                      >
                        <button 
                          onClick={() => { onMenuClick('profile'); setIsProfileDropdownOpen(false); }}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-all"
                        >
                          <User size={18} />
                          My Profile
                        </button>
                        <button 
                          onClick={() => { onMenuClick('wallet'); setIsProfileDropdownOpen(false); }}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-all"
                        >
                          <WalletIcon size={18} />
                          Wallet & Points
                        </button>
                        <div className="my-2 border-t border-neutral-100"></div>
                        <button
                          onClick={() => { onLogout(); setIsProfileDropdownOpen(false); }}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                        >
                          <LogOut size={18} />
                          Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
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

      {/* Horizontal Mobile Category Menu */}
      <div className="flex overflow-x-auto border-t border-neutral-100 bg-white px-4 py-2 md:hidden no-scrollbar">
        <div className="flex gap-4">
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => onMenuClick(menu.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-all ${
                activeMenu === menu.id
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-100'
                  : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {menu.label}
            </button>
          ))}
          <button
            onClick={() => onMenuClick('marketplace')}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-all ${
              activeMenu === 'marketplace' ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-neutral-50 text-neutral-500'
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => onMenuClick('jobs')}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-all ${
              activeMenu === 'jobs' ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-neutral-50 text-neutral-500'
            }`}
          >
            Jobs
          </button>
          <button
            onClick={() => onMenuClick('events')}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-all ${
              activeMenu === 'events' ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-neutral-50 text-neutral-500'
            }`}
          >
            Events
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
