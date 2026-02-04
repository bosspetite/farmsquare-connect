import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, AlertCircle, CheckCircle } from 'lucide-react';
import logo from '@/assets/logo.png';

const TermsPage = () => {
  const sections = [
    {
      icon: FileText,
      title: 'Acceptance of Terms',
      content: 'By accessing and using FarmSquare, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our platform. We reserve the right to modify these terms at any time, and your continued use constitutes acceptance of any changes.',
    },
    {
      icon: Scale,
      title: 'User Responsibilities',
      content: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary. You must be at least 18 years old to use our services.',
    },
    {
      icon: CheckCircle,
      title: 'Transactions and Payments',
      content: 'All transactions on FarmSquare are subject to our escrow system. Buyers agree to pay the listed price plus applicable fees. Farmers agree to deliver produce that matches the listed quality and quantity. Payments are held in escrow until delivery is confirmed. Refunds are processed according to our refund policy.',
    },
    {
      icon: AlertCircle,
      title: 'Prohibited Activities',
      content: 'You agree not to use FarmSquare for any unlawful purpose or in any way that could damage, disable, or impair the platform. Prohibited activities include fraud, misrepresentation, spamming, hacking, or any activity that violates applicable laws or regulations.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFA] via-white to-[#FAFAFA]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="FarmSquare" className="w-10 h-10" />
            <span className="font-display font-bold text-xl text-gray-900">FarmSquare</span>
          </Link>
          <Link
            to="/auth"
            className="px-5 py-2.5 bg-[#22C55E] text-white rounded-lg text-sm font-medium hover:bg-[#16A34A] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-br from-[#F0FDF4] via-white to-[#FAFAFA]">
        <div className="container mx-auto max-w-4xl text-center">
          <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-gray-600 hover:text-[#22C55E] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider bg-[#F0FDF4] px-4 py-2 rounded-full">
              Legal Agreement
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <FileText className="w-12 h-12 text-[#22C55E]" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              Terms of Service
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Last updated: January 2024
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-2xl p-8 md:p-12 border border-gray-200 shadow-sm mb-8">
            <p className="text-gray-700 leading-relaxed mb-6">
              Welcome to FarmSquare. These Terms of Service ("Terms") govern your access to and use of our platform, services, and applications. Please read these Terms carefully before using our services.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By creating an account, accessing, or using FarmSquare, you agree to be bound by these Terms and our Privacy Policy. If you disagree with any part of these terms, you may not access our services.
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 md:p-8 border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-[#22C55E]" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                        {section.title}
                      </h2>
                      <p className="text-gray-700 leading-relaxed">{section.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="mt-8 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] rounded-2xl p-8 border border-[#BBF7D0]">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              FarmSquare acts as a platform connecting buyers and sellers. We are not responsible for the quality, safety, or legality of products listed on our platform. Users are responsible for their own transactions and should exercise due diligence.
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-6">Changes to Terms</h3>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or platform notifications. Continued use of our services after changes constitutes acceptance of the new Terms.
            </p>
          </div>

          {/* Contact */}
          <div className="mt-8 text-center">
            <p className="text-gray-700 mb-4">
              Questions about our Terms of Service?
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#22C55E] text-white rounded-lg font-semibold hover:bg-[#16A34A] transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-[#BBF7D0] bg-gradient-to-b from-[#F0FDF4] to-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="FarmSquare" className="w-10 h-10" />
                <span className="font-display font-bold text-lg text-gray-900">FarmSquare</span>
              </div>
              <p className="text-sm text-gray-600">
                Nigeria's trusted B2B agricultural marketplace.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Platform</h4>
              <div className="space-y-2">
                <Link to="/how-it-works" className="block text-sm text-gray-600 hover:text-[#22C55E] transition-colors duration-300">
                  How it Works
                </Link>
                <Link to="/pricing" className="block text-sm text-gray-600 hover:text-[#22C55E] transition-colors duration-300">
                  Pricing
                </Link>
                <Link to="/faq" className="block text-sm text-gray-600 hover:text-[#22C55E] transition-colors duration-300">
                  FAQ
                </Link>
                <Link to="/support" className="block text-sm text-gray-600 hover:text-[#22C55E] transition-colors duration-300">
                  Support
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <div className="space-y-2">
                <Link to="/about" className="block text-sm text-gray-600 hover:text-[#22C55E] transition-colors duration-300">
                  About
                </Link>
                <Link to="/contact" className="block text-sm text-gray-600 hover:text-[#22C55E] transition-colors duration-300">
                  Contact
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <div className="space-y-2">
                <Link to="/terms" className="block text-sm text-gray-600 hover:text-[#22C55E] transition-colors duration-300">
                  Terms of Service
                </Link>
                <Link to="/privacy" className="block text-sm text-gray-600 hover:text-[#22C55E] transition-colors duration-300">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-[#BBF7D0] text-center text-sm text-gray-600">
            © 2024 FarmSquare. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;

