import React, { useState } from 'react';
import { Languages, Menu } from 'lucide-react';

const LandingHeader = ({ onOpenAuth }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed transition-all duration-300 bg-white/90 w-full z-50 border-slate-100 border-b backdrop-blur-md" id="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center mr-3 text-white">
              <Languages size={24} />
            </div>
            <span className="text-xl font-semibold tracking-tight text-navy-900">SkillForge</span>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex space-x-8">
            <a href="#benefits" className="text-base font-medium text-slate-600 hover:text-navy transition-colors">Why Us</a>
            <a href="#courses" className="text-base font-medium text-slate-600 hover:text-navy transition-colors">Courses</a>
            <a href="#pricing" className="text-base font-medium text-slate-600 hover:text-navy transition-colors">Pricing</a>
            <a href="#faq" className="text-base font-medium text-slate-600 hover:text-navy transition-colors">FAQ</a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <button onClick={onOpenAuth} className="text-base font-medium text-navy hover:text-navy-800">Log in</button>
            <button onClick={onOpenAuth} className="bg-coral hover:bg-coral-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-coral/20">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 hover:text-navy focus:outline-none" 
              aria-label="Toggle menu"
            >
              <Menu size={28} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <a href="#benefits" className="block px-3 py-3 text-lg font-medium text-slate-700 rounded-md hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Why Us</a>
            <a href="#courses" className="block px-3 py-3 text-lg font-medium text-slate-700 rounded-md hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Courses</a>
            <a href="#pricing" className="block px-3 py-3 text-lg font-medium text-slate-700 rounded-md hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
            <button 
              onClick={() => { setIsMobileMenuOpen(false); onOpenAuth(); }} 
              className="w-full mt-4 bg-coral text-white px-5 py-3 rounded-lg text-lg font-medium text-center"
            >
              Enroll Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
