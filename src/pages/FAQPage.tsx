import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import logo from '@/assets/logo.png';

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How does FarmSquare work?',
      answer: 'FarmSquare connects farmers directly with buyers through our B2B marketplace. Farmers list their produce with quality grades, buyers browse and place orders, and our escrow system protects payments until delivery is confirmed. Field agents verify quality at the source.',
    },
    {
      question: 'Is there a fee to use FarmSquare?',
      answer: 'FarmSquare offers a free starter plan for small-scale operations. We also have Professional and Enterprise plans with additional features. Check our Pricing page for detailed information.',
    },
    {
      question: 'How is produce quality verified?',
      answer: 'Our network of field agents visits farms to verify produce quality before orders are confirmed. They check for freshness, grade, and quantity, ensuring buyers receive exactly what they ordered.',
    },
    {
      question: 'How are payments processed?',
      answer: 'Payments are held in escrow until delivery is confirmed. Once the buyer confirms receipt and quality, funds are released to the farmer. This protects both parties and ensures fair transactions.',
    },
    {
      question: 'What happens if there\'s a dispute?',
      answer: 'FarmSquare has a dispute resolution system. If there\'s an issue with quality, quantity, or delivery, both parties can file a dispute. Our team reviews the case and works to find a fair resolution.',
    },
    {
      question: 'Can I track my orders?',
      answer: 'Yes! Both farmers and buyers can track orders in real-time. You\'ll receive updates when orders are placed, when quality is verified, when items are in transit, and when delivery is completed.',
    },
    {
      question: 'What regions does FarmSquare operate in?',
      answer: 'FarmSquare currently operates across major agricultural states in Nigeria. We\'re expanding our network to cover more regions. Check our platform to see current coverage areas.',
    },
    {
      question: 'How do I become a verified farmer or buyer?',
      answer: 'Sign up for an account and complete our KYC (Know Your Customer) verification process. This includes providing business documents and identity verification. Once approved, you can start trading on the platform.',
    },
    {
      question: 'What types of produce can I list or buy?',
      answer: 'FarmSquare supports a wide range of agricultural products including grains, vegetables, fruits, and other farm produce. Each listing includes quality grades and detailed descriptions.',
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach our support team via email at support@farmsquare.com, use the contact form on our website, or access in-app support if you\'re a registered user. We typically respond within 24 hours.',
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
              Get Answers
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <HelpCircle className="w-12 h-12 text-[#22C55E]" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about FarmSquare
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[#FAFAFA] transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-5 pt-0">
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Still have questions */}
          <div className="mt-12 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] rounded-2xl p-8 text-center border border-[#BBF7D0]">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Still have questions?</h3>
            <p className="text-gray-700 mb-6">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/support"
                className="px-6 py-3 bg-[#22C55E] text-white rounded-lg font-semibold hover:bg-[#16A34A] transition-colors"
              >
                Contact Support
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold border-2 border-gray-200 hover:border-[#22C55E] transition-colors"
              >
                Contact Us
              </Link>
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

export default FAQPage;

