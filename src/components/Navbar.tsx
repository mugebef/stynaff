import React from 'react';
import { Globe, MessageSquare, Heart, Play, User, LogOut, Menu, X, LayoutDashboard, Video, Wallet as WalletIcon, Bell, Radio } from 'lucide-react';
import { APP_NAME } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  onMenuClick: (menu: string) => void;
  activeMenu: string;
  notificationCount: number;
  notifications: any[];
  onMarkRead: (id: string) => void;
  appConfig?: any;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  onLogout, 
  onMenuClick, 
  activeMenu, 
  notificationCount,
  notifications,
  onMarkRead,
  appConfig
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  const menus = [
    { id: 'reels', label: 'Reels', icon: <Video size={18} /> },
    { id: 'blockbuster', label: 'Blockbuster', icon: <Play size={18} /> },
    { id: 'dating', label: 'Dating', icon: <Heart size={18} /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={18} /> },
    { id: 'live', label: 'Live', icon: <Radio size={18} /> },
  ];

  if (user?.role === 'admin') {
    menus.splice(1, 0, { id: 'admin', label: 'Admin', icon: <LayoutDashboard size={18} /> });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] w-full border-b border-white/10 bg-[#0c0c0c] shadow-2xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-start cursor-pointer group" onClick={() => onMenuClick('feed')}>
            <div className="flex items-center gap-2">
              {appConfig?.logoUrl ? (
                <img 
                  src={appConfig.logoUrl} 
                  alt="Logo" 
                  className="h-10 md:h-12 w-auto object-contain group-hover:scale-110 transition-all drop-shadow-2xl" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-serif text-3xl font-black italic tracking-tighter text-white group-hover:text-orange-500 transition-colors drop-shadow-md">
                  Styn
                </span>
              )}
            </div>
          </div>

          {/* Desktop Menu - Modern Navigation */}
          <div className="hidden items-center gap-0.5 md:flex">
            {menus.map((menu) => (
              <button
                key={menu.id}
                onClick={() => onMenuClick(menu.id)}
                className={`relative flex items-center justify-center rounded-xl px-2 lg:px-4 py-2 text-[10px] lg:text-xs font-black uppercase tracking-tighter lg:tracking-widest transition-all ${
                  activeMenu === menu.id
                    ? 'text-orange-500 bg-orange-500/5'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{menu.label}</span>
                {activeMenu === menu.id && (
                  <motion.div 
                    layoutId="navbar-active"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            <>
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative rounded-full p-2 text-neutral-400 hover:bg-neutral-900 transition-all"
                >
                  <Bell size={20} />
                  {notificationCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white ring-2 ring-neutral-950">
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
                        className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-white/5 bg-neutral-900 p-2 shadow-2xl ring-1 ring-white/5 z-50"
                      >
                        <div className="p-3 border-b border-white/5 flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white">Notifications</h3>
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{notificationCount} New</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto py-2">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500">
                              <p className="text-xs font-bold">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.map((notif, index) => (
                              <div 
                                key={notif.id || `notif-${index}`}
                                onClick={() => {
                                  if (!notif.read) onMarkRead(notif.id);
                                  setIsNotificationsOpen(false);
                                  if (notif.type === 'friend_request' || notif.type === 'friend_accepted') {
                                    onMenuClick('profile');
                                  } else if (notif.type === 'like' || notif.type === 'comment') {
                                    onMenuClick('feed');
                                  } else if (notif.type === 'live') {
                                    onMenuClick('live');
                                  }
                                }}
                                className={`flex items-start gap-3 rounded-xl p-3 transition-all hover:bg-neutral-800 cursor-pointer ${!notif.read ? 'bg-orange-600/5' : ''}`}
                              >
                                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!notif.read ? 'bg-orange-600' : 'bg-transparent'}`} />
                                <div className="flex-1">
                                  <p className="text-xs leading-relaxed text-neutral-300">
                                    <span className="font-bold text-white">{notif.fromName}</span> {
                                      notif.type === 'like' ? 'liked your post' :
                                      notif.type === 'comment' ? 'commented on your post' :
                                      notif.type === 'share' ? 'shared your post' :
                                      notif.type === 'friend_request' ? 'sent you a friend request' :
                                      notif.type === 'friend_accepted' ? 'accepted your friend request' :
                                      notif.type === 'live' ? 'is live now! Join the stream.' :
                                      'interacted with you'
                                    }
                                  </p>
                                  <p className="mt-1 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
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
                  className="flex cursor-pointer items-center gap-2 rounded-full bg-neutral-900 px-3 py-1.5 hover:bg-neutral-800 transition-all border border-white/5"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <User size={16} className="text-neutral-400" />
                  )}
                  <span className="text-sm font-bold text-neutral-200 hidden sm:block">
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
                        className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-white/5 bg-neutral-900 p-2 shadow-2xl ring-1 ring-white/5 z-50"
                      >
                        <button 
                          onClick={() => { onMenuClick('profile'); setIsProfileDropdownOpen(false); }}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-bold text-neutral-300 hover:bg-neutral-800 transition-all"
                        >
                          <User size={18} />
                          My Profile
                        </button>
                        <button 
                          onClick={() => { onMenuClick('wallet'); setIsProfileDropdownOpen(false); }}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-bold text-neutral-300 hover:bg-neutral-800 transition-all"
                        >
                          <WalletIcon size={18} />
                          Wallet & Balance
                        </button>
                        <div className="my-2 border-t border-white/5"></div>
                        <button
                          onClick={() => { onLogout(); setIsProfileDropdownOpen(false); }}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all"
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
            className="rounded-lg p-2 text-neutral-400 md:hidden hover:bg-neutral-900"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Horizontal Mobile Category Menu */}
      <div className="flex overflow-x-auto border-t border-white/5 bg-neutral-950 px-2 py-2 md:hidden no-scrollbar">
        <div className="flex gap-1.5">
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => onMenuClick(menu.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-tight transition-all flex items-center justify-center ${
                activeMenu === menu.id
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20'
                  : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 border border-white/5'
              }`}
            >
              {menu.label && <span>{menu.label}</span>}
            </button>
          ))}
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
              className="absolute left-0 right-0 top-full z-50 border-t border-white/5 bg-neutral-900 p-4 shadow-2xl md:hidden"
            >
              <div className="flex flex-col gap-2">
                {menus.map((menu) => (
                  <button
                    key={menu.id}
                    onClick={() => {
                      onMenuClick(menu.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-center rounded-xl px-4 py-4 text-base font-black uppercase tracking-widest transition-all ${
                      activeMenu === menu.id
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20'
                        : 'text-neutral-400 hover:bg-neutral-800 border border-white/5'
                    }`}
                  >
                    {menu.label && <span>{menu.label}</span>}
                  </button>
                ))}
                
                {user && (
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3 text-base font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all font-sans"
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
