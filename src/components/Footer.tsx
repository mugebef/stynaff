import React from 'react';
import { Globe, Heart, Shield, Zap } from 'lucide-react';
import { APP_NAME, FOOTER_TEXT } from '../constants';

interface FooterProps {
  appConfig?: any;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ appConfig, onOpenPrivacy, onOpenTerms }) => {
  return (
    <footer className="border-t border-white/5 bg-neutral-900 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="flex items-center gap-4">
            {appConfig?.logoUrl ? (
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-neutral-800 p-3 shadow-2xl ring-2 ring-white/10 hover:scale-110 transition-transform duration-500">
                <img src={appConfig.logoUrl} alt="Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
              </div>
            ) : null}
            <span className="font-display text-6xl font-black tracking-tighter text-white uppercase italic drop-shadow-2xl">
              {APP_NAME}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
            <button onClick={onOpenPrivacy} className="hover:text-orange-500 transition-colors cursor-pointer">Privacy Policy</button>
            <span className="h-1 w-1 rounded-full bg-neutral-800"></span>
            <button onClick={onOpenTerms} className="hover:text-orange-500 transition-colors cursor-pointer">Terms & Conditions</button>
            <span className="h-1 w-1 rounded-full bg-neutral-800"></span>
            <a href="mailto:support@styni.com" className="hover:text-orange-500 transition-colors">Support</a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center border-t border-white/5 pt-8">
          <div className="flex items-center gap-4 text-sm font-bold text-orange-500">
            <span>{FOOTER_TEXT}</span>
            <span className="h-4 w-px bg-white/5"></span>
            <a href="https://ai.studio" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-orange-400 transition-colors">
              Powered by <span className="text-orange-500">Google AI Studio</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
