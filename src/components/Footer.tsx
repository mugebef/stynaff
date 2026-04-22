import React from 'react';
import { Globe, Heart, Shield, Zap, Smartphone } from 'lucide-react';
import { APP_NAME, FOOTER_TEXT } from '../constants';

interface FooterProps {
  appConfig?: any;
}

export const Footer: React.FC<FooterProps> = ({ appConfig }) => {
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

          <a
            href="/styn.apk"
            download
            className="flex items-center gap-3 rounded-2xl bg-orange-600 px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-orange-900/20 hover:bg-orange-700 transition-all hover:-translate-y-1"
          >
            <Smartphone size={20} />
            Download Android App
          </a>
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
