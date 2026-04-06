/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Globe, Server, Shield, Zap, ArrowRight } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 selection:bg-orange-100 selection:text-orange-900">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-200">
              <Globe size={24} />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-neutral-900">
              Styn Africa
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#" className="text-sm font-medium text-neutral-600 hover:text-orange-600 transition-colors">Solutions</a>
            <a href="#" className="text-sm font-medium text-neutral-600 hover:text-orange-600 transition-colors">Infrastructure</a>
            <a href="#" className="text-sm font-medium text-neutral-600 hover:text-orange-600 transition-colors">About</a>
            <button className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition-all active:scale-95">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
                </span>
                Now Live on ray.styni.com
              </div>
              <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl">
                Empowering Africa's <span className="text-orange-600">Digital Future</span>
              </h1>
              <p className="mt-8 text-lg leading-relaxed text-neutral-600 sm:text-xl">
                Styn Africa provides enterprise-grade infrastructure and digital solutions tailored for the continent's growing economy. Scalable, secure, and ready for your next big idea.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <button className="group flex items-center gap-2 rounded-full bg-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all hover:translate-y-[-2px] active:scale-95">
                  Launch Console
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="rounded-full border border-neutral-300 bg-white px-8 py-4 text-lg font-semibold text-neutral-700 hover:bg-neutral-50 transition-all active:scale-95">
                  View Documentation
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square overflow-hidden rounded-3xl bg-neutral-200 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=2020" 
                  alt="Modern Technology" 
                  className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Floating Stats Card */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-neutral-200"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-green-50 p-2 text-green-600">
                    <Server size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-500">VPS Status</p>
                    <p className="text-xl font-bold text-neutral-900">Online</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Built for Performance & Scale
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              Our infrastructure is optimized for the African market, ensuring low latency and high availability.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Zap className="text-orange-600" />,
                title: "High Performance",
                description: "Optimized Node.js 20 environment running on high-speed VPS infrastructure."
              },
              {
                icon: <Shield className="text-orange-600" />,
                title: "Enterprise Security",
                description: "Advanced protection for your data and applications with 24/7 monitoring."
              },
              {
                icon: <Globe className="text-orange-600" />,
                title: "Global Reach",
                description: "Connect your business to the world with our optimized network routing."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="rounded-2xl border border-neutral-100 bg-neutral-50 p-8 transition-all hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-bold text-neutral-900">{feature.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Globe size={20} className="text-orange-600" />
              <span className="font-display font-bold text-neutral-900">Styn Africa</span>
            </div>
            <p className="text-sm text-neutral-500">
              © 2026 Styn Africa. All rights reserved. IP: 129.121.73.168
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-neutral-600 hover:text-orange-600">Privacy</a>
              <a href="#" className="text-sm text-neutral-600 hover:text-orange-600">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
