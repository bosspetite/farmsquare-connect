import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';
import logo from '@/assets/logo.png';

const PrivacyPage = () => {
  const sections = [
    {
      icon: FileText,
      title: 'Information We Collect',
      content: 'We collect information that you provide directly to us, such as when you create an account, list produce, place orders, or contact us. This includes your name, email address, phone number, business information, and payment details. We also collect information about your use of our services, including transaction history and platform interactions.',
    },
    {
      icon: Eye,
      title: 'How We Use Your Information',
      content: 'We use the information we collect to provide, maintain, and improve our services, process transactions, verify identities, communicate with you about your account and transactions, send you updates and marketing communications (with your consent), detect and prevent fraud, and comply with legal obligations.',
    },
    {
      icon: Lock,
      title: 'Information Sharing',
      content: 'We do not sell your personal information. We may share your information with trusted service providers who assist us in operating our platform (such as payment processors and logistics partners), when required by law, to protect our rights and safety, or with your explicit consent. All third parties are contractually obligated to protect your information.',
    },
    {
      icon: Shield,
      title: 'Data Security',
      content: 'We implement industry-standard security measures to protect your personal information, including encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure. We encourage you to use strong passwords and keep your account information confidential.',
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
              Your Privacy Matters
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="w-12 h-12 text-[#22C55E]" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              Privacy Policy
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
              At FarmSquare, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using FarmSquare, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
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
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to access, update, or delete your personal information at any time. You can also opt out of marketing communications and request a copy of your data. To exercise these rights, please contact us at privacy@farmsquare.com.
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-6">Changes to This Policy</h3>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </div>

          {/* Contact */}
          <div className="mt-8 text-center">
            <p className="text-gray-700 mb-4">
              Questions about our Privacy Policy?
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

export default PrivacyPage;

