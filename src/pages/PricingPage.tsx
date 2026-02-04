import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, TrendingUp, Users, Shield } from 'lucide-react';
import logo from '@/assets/logo.png';

const PricingPage = () => {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: 'Forever',
      description: 'Perfect for small-scale farmers and buyers',
      features: [
        'Up to 10 listings per month',
        'Basic quality verification',
        'Standard escrow protection',
        'Email support',
        'Mobile app access',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: '₦5,000',
      period: 'per month',
      description: 'Ideal for growing businesses',
      features: [
        'Unlimited listings',
        'Priority quality verification',
        'Enhanced escrow protection',
        'Priority support',
        'Advanced analytics',
        'Bulk order management',
        'Custom payment terms',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'Contact us',
      description: 'For large-scale operations',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom integrations',
        'White-label options',
        'Volume discounts',
        'SLA guarantees',
        '24/7 phone support',
      ],
      popular: false,
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
              Transparent Pricing
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Simple, Fair Pricing
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your business. Start free and upgrade as you grow.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl p-8 border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-[#22C55E] shadow-xl scale-105 md:scale-110'
                    : 'border-gray-200 hover:border-[#22C55E] hover:shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#22C55E] text-white px-4 py-1 rounded-full text-xs font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period !== 'Forever' && plan.period !== 'Contact us' && (
                      <span className="text-gray-600 text-lg">/{plan.period}</span>
                    )}
                  </div>
                  {plan.period === 'Forever' && (
                    <span className="text-gray-600 text-sm">{plan.period}</span>
                  )}
                  {plan.period === 'Contact us' && (
                    <span className="text-gray-600 text-sm">{plan.period}</span>
                  )}
                  <p className="text-gray-600 text-sm mt-3">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/auth"
                  className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-[#22C55E] text-white hover:bg-[#16A34A]'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose FarmSquare?
            </h2>
            <p className="text-lg text-gray-600">
              All plans include our core features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-[#F0FDF4]">
              <Shield className="w-12 h-12 text-[#22C55E] mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Secure Escrow</h3>
              <p className="text-sm text-gray-600">
                Your payments are protected until delivery is confirmed
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-[#F0FDF4]">
              <TrendingUp className="w-12 h-12 text-[#22C55E] mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Quality Verified</h3>
              <p className="text-sm text-gray-600">
                Field agents verify produce quality before delivery
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-[#F0FDF4]">
              <Users className="w-12 h-12 text-[#22C55E] mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Trusted Network</h3>
              <p className="text-sm text-gray-600">
                Connect with verified farmers and buyers nationwide
              </p>
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

export default PricingPage;

