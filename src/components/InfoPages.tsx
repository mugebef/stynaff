import React from 'react';
import { motion } from 'motion/react';
import { X, Shield, FileText, Info, Zap, Globe, Heart, Lock, UserCheck, AlertTriangle } from 'lucide-react';
import { APP_NAME } from '../constants';

interface InfoPageProps {
  onClose: () => void;
  type: 'privacy' | 'terms' | 'about';
}

export const InfoPages: React.FC<InfoPageProps> = ({ onClose, type }) => {
  const content = {
    privacy: {
      title: 'Privacy Policy',
      icon: <Shield className="text-blue-500" size={40} />,
      sections: [
        {
          title: 'Data Collection',
          text: `At ${APP_NAME}, we collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested (for delivery services), delivery notes, and other information you choose to provide.`
        },
        {
          title: 'Location Information',
          text: 'To provide dating and local services, we collect precise location data from your mobile device when the app is running in the foreground or background. You can control this through your device settings.'
        },
        {
          title: 'Media and Photos',
          text: 'When you upload photos or videos, we store them on our secure servers. We also extract metadata for optimization but do not share this raw data with third parties without your consent.'
        },
        {
          title: 'Information Sharing',
          text: 'We do not sell your personal data. We share information with other users as part of the social and dating features (per your privacy settings) and with service providers who perform work on our behalf.'
        }
      ]
    },
    terms: {
      title: 'Terms & Conditions',
      icon: <FileText className="text-orange-500" size={40} />,
      sections: [
        {
          title: 'Acceptance of Terms',
          text: `By accessing or using ${APP_NAME}, you agree to be bound by these Terms and Conditions. If you do not agree, you may not use the services.`
        },
        {
          title: 'User Conduct',
          text: 'You are responsible for all activity that occurs under your account. You agree not to use the services for any unlawful or prohibited purpose, including harassment, scamming, or uploading prohibited content.'
        },
        {
          title: 'Prohibited Content',
          text: 'Uploading illegal material, hate speech, or explicit adult content that violates our community guidelines will result in an immediate and permanent ban without refund of any points or subscriptions.'
        },
        {
          title: 'Payments and Refunds',
          text: 'Purchases made within the app (Verification, Boosting, Points) are generally non-refundable unless required by law. Digital goods are consumed immediately upon activation.'
        }
      ]
    },
    about: {
      title: 'About Us',
      icon: <Info className="text-indigo-500" size={40} />,
      sections: [
        {
          title: 'Our Mission',
          text: `${APP_NAME} was built to connect the world through culture, entertainment, and genuine human connection. From short-form reels to full-length blockbusters, we provide a platform for creators to shine.`
        },
        {
          title: 'Dating Redefined',
          text: 'We believe dating should be transparent and fun. Our verification system and point-based interactions ensure a quality environment for everyone looking for love or friendship.'
        },
        {
          title: 'Innovation',
          text: 'Powered by cutting-edge technology and a passion for African and global storytelling, we are constantly evolving to provide the best social experience on the continent.'
        }
      ]
    }
  };

  const activeContent = content[type];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-4xl h-[85vh] bg-neutral-900 rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-8 md:p-12 border-b border-white/5 flex items-center justify-between bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-white/5 shadow-inner">
              {activeContent.icon}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter leading-none">{activeContent.title}</h1>
              <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mt-2">Last Updated: March 2026</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-4 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-all border border-white/5 active:scale-95"
          >
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 no-scrollbar">
          <div className="space-y-12 max-w-2xl">
            {activeContent.sections.map((section, i) => (
              <motion.section 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-1 w-8 rounded-full bg-orange-600" />
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">{section.title}</h2>
                </div>
                <p className="text-neutral-400 leading-relaxed font-medium">
                  {section.text}
                </p>
              </motion.section>
            ))}
          </div>

          {/* Bottom Branding */}
          <div className="mt-20 flex flex-col items-center justify-center p-12 border-t border-white/5 text-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-serif text-3xl font-black italic tracking-tighter text-white">Styn</span>
              <UserCheck size={20} className="text-orange-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">
              © 2026 {APP_NAME} INC. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
