"use client";

import { Scan, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-[#000919]/70 backdrop-blur-[100px] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Scan className="w-6 h-6 text-[#0094c6]" />
              <span className="text-xl font-semibold text-white tracking-tight">
                ChismiScan
              </span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Empowering users to navigate the digital noise with AI-driven
              gossip analysis and real-time fake news detection.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-medium mb-4">Quicklinks</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-[#0094c6] transition-colors">
                  Analyzer
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0094c6] transition-colors">
                  Safety Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0094c6] transition-colors">
                  API Access
                </a>
              </li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h3 className="text-white font-medium mb-4">Connect</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all border border-white/10"
              >
                <Mail className="w-4 h-4 text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-5 pt-5 border-t border-white/5 flex flex-col md:flex-row justify-between gap-1">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} ChismiScan. Built for digital truth.
          </p>
        </div>
      </div>
    </footer>
  );
}
