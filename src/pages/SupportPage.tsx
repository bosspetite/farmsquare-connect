import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, HelpCircle, Clock, Phone } from 'lucide-react';
import logo from '@/assets/logo.png';

const SupportPage = () => {
  const supportOptions = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help via email',
      contact: 'support@farmsquare.com',
      action: 'mailto:support@farmsquare.com',
      color: 'text-[#22C55E]',
      bgColor: 'bg-[#F0FDF4]',
    },
    {
      icon: MessageCircle,
      title: 'Contact Form',
      description: 'Fill out our contact form',
      contact: 'Get detailed help',
      action: '/contact',
      isLink: true,
      color: 'text-[#22C55E]',
      bgColor: 'bg-[#F0FDF4]',
    },
    {
      icon: HelpCircle,
      title: 'FAQ',
      description: 'Find quick answers',
      contact: 'Common questions',
      action: '/faq',
      isLink: true,
      color: 'text-[#22C55E]',
      bgColor: 'bg-[#F0FDF4]',
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
              We're Here to Help
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <MessageCircle className="w-12 h-12 text-[#22C55E]" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              Support
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Get the help you need. Our support team is ready to assist you.
          </p>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {supportOptions.map((option, index) => {
              const IconComponent = option.icon;
              const content = option.isLink ? (
                <Link
                  to={option.action}
                  className="block w-full h-full"
                >
                  <div className={`${option.bgColor} rounded-xl p-6 border-2 border-transparent hover:border-[#22C55E] transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col`}>
                    <IconComponent className={`w-10 h-10 ${option.color} mb-4`} />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{option.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 flex-1">{option.description}</p>
                    <p className="text-[#22C55E] font-semibold text-sm">→ {option.contact}</p>
                  </div>
                </Link>
              ) : (
                <a
                  href={option.action}
                  className="block w-full h-full"
                >
                  <div className={`${option.bgColor} rounded-xl p-6 border-2 border-transparent hover:border-[#22C55E] transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col`}>
                    <IconComponent className={`w-10 h-10 ${option.color} mb-4`} />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{option.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 flex-1">{option.description}</p>
                    <p className="text-[#22C55E] font-semibold text-sm break-all">→ {option.contact}</p>
                  </div>
                </a>
              );
              return <div key={index}>{content}</div>;
            })}
          </div>

          {/* Response Time */}
          <div className="bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] rounded-2xl p-8 border border-[#BBF7D0] mb-8">
            <div className="flex items-start gap-4">
              <Clock className="w-8 h-8 text-[#22C55E] flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Response Times</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Email Support:</strong> We typically respond within 24 hours</li>
                  <li>• <strong>Urgent Issues:</strong> Mark your email as urgent for faster response</li>
                  <li>• <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM WAT</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Common Issues */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Common Support Topics</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[#FAFAFA] border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Account Issues</h4>
                <p className="text-sm text-gray-600">Password reset, account verification, profile updates</p>
              </div>
              <div className="p-4 rounded-lg bg-[#FAFAFA] border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Transaction Help</h4>
                <p className="text-sm text-gray-600">Payment issues, order tracking, refund requests</p>
              </div>
              <div className="p-4 rounded-lg bg-[#FAFAFA] border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Technical Support</h4>
                <p className="text-sm text-gray-600">App issues, browser compatibility, feature questions</p>
              </div>
              <div className="p-4 rounded-lg bg-[#FAFAFA] border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Business Inquiries</h4>
                <p className="text-sm text-gray-600">Partnerships, enterprise plans, bulk orders</p>
              </div>
            </div>
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

export default SupportPage;

