import React from 'react';
import { Globe, Heart, Shield, Zap } from 'lucide-react';
import { APP_NAME, FOOTER_TEXT } from '../constants';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-lg shadow-orange-200">
                <Globe size={20} />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-neutral-900">
                {APP_NAME}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-neutral-500">
              Empowering Africa's digital future through connection, entertainment, and innovation.
            </p>
          </div>
          
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">Platform</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li><a href="#" className="hover:text-orange-600 transition-colors">Chat</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Dating</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Blockbuster</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Community</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">Support</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li><a href="#" className="hover:text-orange-600 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Safety Tips</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-orange-50 hover:text-orange-600 transition-all">
                <Zap size={20} />
              </a>
              <a href="#" className="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-orange-50 hover:text-orange-600 transition-all">
                <Shield size={20} />
              </a>
              <a href="#" className="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-orange-50 hover:text-orange-600 transition-all">
                <Heart size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-neutral-100 pt-8 md:flex-row">
          <p className="text-sm font-medium text-neutral-500">
            © 2026 {APP_NAME}. All rights reserved.
          </p>
          <p className="mt-4 text-sm font-bold text-orange-600 md:mt-0">
            {FOOTER_TEXT}
          </p>
        </div>
      </div>
    </footer>
  );
};
