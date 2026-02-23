import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, TrendingUp, Users, ChevronRight, Package, ChevronLeft, CheckCircle2, Quote } from 'lucide-react';
import logo from '@/assets/logo.png';
import farmProduceImg from '@/assets/agricultural farm produce.jpg';
import farmersTomatoesImg from '@/assets/farmers with tomatoes.jpg';
import maizeFarmImg from '@/assets/maize farm nigeria.jpg';
import tomatoCrateImg from '@/assets/tomota crate market.jpg';
import pexelsFarmImg from '@/assets/pexels-nc-farm-bureau-mark-9798867.jpg';

// TODO: Add 3 more beautiful farm produce images to the assets folder
// 
// RECOMMENDED IMAGES (Free sources: Unsplash, Pexels, Pixabay):
// 
// 1. "fresh-peppers-onions.jpg"
//    - Search: "fresh peppers onions vegetables Nigeria" or "colorful peppers market"
//    - Style: Close-up of vibrant red/green peppers and white/yellow onions arranged beautifully
//    - Recommended size: 1920x1080 or larger, landscape orientation
//    - Sources: Unsplash (unsplash.com/s/photos/fresh-peppers-onions)
// 
// 2. "grains-harvest.jpg"  
//    - Search: "rice grains harvest Nigeria" or "golden grains basket"
//    - Style: Golden rice/wheat grains in traditional baskets or being harvested
//    - Recommended size: 1920x1080 or larger, landscape orientation
//    - Sources: Pexels (pexels.com/search/rice-grains/) or Unsplash
// 
// 3. "vegetables-market.jpg"
//    - Search: "fresh vegetables market Nigeria" or "farm vegetables display"
//    - Style: Colorful array of fresh vegetables (okra, eggplant, leafy greens) in market setting
//    - Recommended size: 1920x1080 or larger, landscape orientation  
//    - Sources: Pixabay (pixabay.com/images/search/vegetables/) or Unsplash
// 
// After adding images to src/assets/, update the carouselImages array below to use the new images

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const carouselImages = [
    {
      image: farmProduceImg,
      title: 'Fresh Farm Produce',
      subtitle: 'Quality-graded agricultural products'
    },
    {
      image: farmersTomatoesImg,
      title: 'Fresh Tomatoes',
      subtitle: 'Direct from Nigerian farms'
    },
    {
      image: maizeFarmImg,
      title: 'Premium Maize',
      subtitle: 'Harvested at peak freshness'
    },
    {
      image: tomatoCrateImg,
      title: 'Market Ready',
      subtitle: 'Carefully packed and graded'
    },
    {
      image: pexelsFarmImg,
      title: 'Farm Fresh',
      subtitle: 'Connecting farmers and buyers'
    },
    // Using existing images temporarily - Replace with new images when available
    {
      image: farmProduceImg, // TODO: Replace with fresh-peppers-onions.jpg
      title: 'Fresh Peppers & Onions',
      subtitle: 'Colorful, vibrant produce from local farms'
    },
    {
      image: maizeFarmImg, // TODO: Replace with grains-harvest.jpg
      title: 'Premium Grains',
      subtitle: 'Golden harvests ready for market'
    },
    {
      image: farmersTomatoesImg, // TODO: Replace with vegetables-market.jpg
      title: 'Farm Vegetables',
      subtitle: 'Fresh, organic vegetables daily'
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000); // Auto-slide every 5 seconds

    return () => clearInterval(timer);
  }, [carouselImages.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="FarmSquare" className="w-10 h-10" />
            <span className="font-display font-bold text-xl text-gray-900">FarmSquare</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/how-it-works" className="text-sm text-gray-600 hover:text-[#22C55E] transition-colors duration-300">
              How it Works
            </Link>
            <Link to="/about" className="text-sm text-gray-600 hover:text-[#22C55E] transition-colors duration-300">
              About
            </Link>
            <Link to="/contact" className="text-sm text-gray-600 hover:text-[#22C55E] transition-colors duration-300">
              Contact
            </Link>
          </nav>
          
          <Link
            to="/auth"
            className="px-5 py-2.5 bg-[#22C55E] text-white rounded-lg text-sm font-medium hover:bg-[#16A34A] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section with Full-Screen Carousel */}
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        {/* Carousel Background Images */}
        <div className="absolute inset-0">
          {carouselImages.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100 z-0' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
            </div>
          ))}
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center px-4 md:px-0">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/95 backdrop-blur-sm border border-white/20 rounded-full text-[#166534] text-sm font-semibold mb-8 shadow-lg">
                Nigeria's B2B Agro Marketplace
              </div>
              
              {/* Main Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-2xl">
                Connect. Trade. Grow.
              </h1>
              
              {/* Subheadline */}
              <p className="text-lg md:text-xl lg:text-2xl text-white/95 max-w-3xl mx-auto mb-10 leading-relaxed drop-shadow-lg">
                The trusted marketplace connecting Nigerian farmers directly with buyers. 
                Quality-graded produce, secure payments, reliable logistics.
              </p>
              
              {/* CTA Buttons - Centered */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/auth?intent=farmer"
                  className="w-full sm:w-auto px-8 py-4 bg-[#22C55E] text-white rounded-xl text-base font-semibold hover:bg-[#16A34A] transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  Start Selling
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/auth?intent=buyer"
                  className="w-full sm:w-auto px-8 py-4 bg-white/95 backdrop-blur-sm border-2 border-white/30 text-gray-900 rounded-xl text-base font-semibold hover:bg-white transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
                >
                  Buy Produce
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 md:p-4 shadow-2xl transition-all hover:scale-110 backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 md:p-4 shadow-2xl transition-all hover:scale-110 backdrop-blur-sm"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-3 rounded-full transition-all shadow-lg ${
                index === currentSlide
                  ? 'w-10 bg-white'
                  : 'w-3 bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 right-8 z-20 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/60 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white border-b border-gray-100">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: '5,000+', label: 'Active Farmers', icon: Users },
              { value: '₦2.5B+', label: 'Traded Volume', icon: TrendingUp },
              { value: '98%', label: 'On-Time Delivery', icon: Truck },
              { value: '150+', label: 'Enterprise Buyers', icon: Shield },
            ].map((stat, i) => (
              <div key={i} className="text-center py-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#F0FDF4] mb-4">
                  <stat.icon className="w-7 h-7 text-[#22C55E]" />
                </div>
                <p className="text-3xl md:text-4xl font-bold text-[#22C55E] mb-1.5">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Produce Section */}
      <section className="py-20 md:py-28 px-4 bg-[#FAFAFA]">
        <div className="container mx-auto">
          <div className="text-center mb-14 md:mb-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Fresh Produce from Nigerian Farms
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Browse quality-graded produce available for bulk purchase from verified farmers
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 md:gap-6">
            {[
              {
                image: farmersTomatoesImg,
                name: 'Fresh Tomatoes',
                label: 'Available in bulk',
                grade: 'Grade A'
              },
              {
                image: maizeFarmImg,
                name: 'Maize',
                label: 'Fresh from farmers',
                grade: 'Grade A'
              },
              {
                image: tomatoCrateImg,
                name: 'Tomato Crates',
                label: 'Market ready',
                grade: 'Grade B'
              },
              {
                image: farmProduceImg,
                name: 'Mixed Vegetables',
                label: 'Farm fresh',
                grade: 'Grade A'
              },
              {
                image: pexelsFarmImg,
                name: 'Farm Produce',
                label: 'Quality assured',
                grade: 'Grade A'
              },
            ].map((produce, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                <div className="relative h-48 md:h-56 overflow-hidden">
                  <img 
                    src={produce.image} 
                    alt={produce.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 bg-[#22C55E] text-white text-xs font-bold rounded-full shadow-md">
                      {produce.grade}
                    </span>
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1">{produce.name}</h3>
                  <p className="text-sm text-gray-600">{produce.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 md:py-28 px-4 bg-white relative overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-full text-[#166534] text-sm font-semibold mb-6">
              Simple Process
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How it Works
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to connect farmers with buyers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                icon: Package,
                title: 'Farmers List Produce',
                description: 'Farmers upload their produce with quality grades and pricing. Field agents verify and grade each listing.',
              },
              {
                step: '2',
                icon: Users,
                title: 'Buyers Place Orders',
                description: 'Buyers browse available produce, compare prices, and place orders. Secure escrow holds payment.',
              },
              {
                step: '3',
                icon: Truck,
                title: 'Delivery & Payment',
                description: 'Produce is delivered with full tracking. Payment is released after verified delivery.',
              },
            ].map((item, i) => (
              <div key={i} className="relative group text-center">
                {/* Connecting Line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[55%] w-[90%] h-0.5 bg-gradient-to-r from-[#22C55E]/30 to-[#BBF7D0]"></div>
                )}
                
                {/* Step Card */}
                <div className="relative bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
                  {/* Step Number Badge */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 mx-auto bg-[#F0FDF4] rounded-xl flex items-center justify-center border-2 border-[#BBF7D0]">
                      <item.icon className="w-8 h-8 text-[#22C55E]" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#22C55E] text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                      {item.step}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* CTA Link */}
          <div className="text-center mt-12">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#22C55E] text-white rounded-lg text-sm font-semibold hover:bg-[#16A34A] transition-colors duration-300 shadow-sm hover:shadow-md"
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Why FarmSquare */}
      <section className="py-24 md:py-32 px-4 bg-gradient-to-b from-white via-[#F0FDF4]/30 to-white relative overflow-hidden">
        {/* Unique animated background elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#22C55E]/10 via-[#16A34A]/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#F0FDF4]/40 to-transparent rounded-full blur-3xl"></div>
        
        {/* Unique geometric pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 border-4 border-[#22C55E] rounded-full rotate-45"></div>
          <div className="absolute bottom-1/4 right-1/4 w-56 h-56 border-4 border-[#16A34A] rounded-full -rotate-45"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-2 border-[#22C55E] rounded-full"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20 md:mb-24">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white rounded-full text-sm font-bold mb-6 shadow-lg">
              <Shield className="w-4 h-4" />
              Our Advantages
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-5">
              Why FarmSquare?
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We've built the infrastructure to make agricultural trade seamless, secure, and profitable for everyone.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
            {[
              {
                icon: Shield,
                title: 'Quality Grading',
                description: 'Every produce is inspected and graded (A/B/C) by certified field agents.',
                gradient: 'from-[#22C55E] to-[#16A34A]',
                iconBg: 'from-[#F0FDF4] to-[#BBF7D0]',
                accent: 'from-[#22C55E]/20 to-[#16A34A]/10',
              },
              {
                icon: TrendingUp,
                title: 'Fair Pricing',
                description: 'Real-time market intelligence ensures you get competitive prices.',
                gradient: 'from-[#16A34A] to-[#22C55E]',
                iconBg: 'from-[#F0FDF4] to-[#BBF7D0]',
                accent: 'from-[#16A34A]/20 to-[#22C55E]/10',
              },
              {
                icon: Truck,
                title: 'Reliable Logistics',
                description: 'End-to-end tracking from farm to warehouse with our logistics network.',
                gradient: 'from-[#22C55E] to-[#15803D]',
                iconBg: 'from-[#F0FDF4] to-[#BBF7D0]',
                accent: 'from-[#22C55E]/20 to-[#15803D]/10',
              },
              {
                icon: Users,
                title: 'Escrow Payments',
                description: 'Funds are held securely and released only after verified delivery.',
                gradient: 'from-[#16A34A] to-[#22C55E]',
                iconBg: 'from-[#F0FDF4] to-[#BBF7D0]',
                accent: 'from-[#16A34A]/20 to-[#22C55E]/10',
              },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group relative bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-[#22C55E] transition-all duration-500 transform hover:-translate-y-4 hover:shadow-2xl overflow-hidden"
              >
                {/* Unique gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}></div>
                
                {/* Unique animated border glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-3xl blur-xl`}></div>
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Enhanced Icon Container with unique effects */}
                  <div className="relative mb-6">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center border-2 border-[#BBF7D0] shadow-lg group-hover:scale-110 group-hover:shadow-2xl transition-all duration-500 relative overflow-hidden`}>
                      <feature.icon className={`w-10 h-10 ${feature.iconColor} z-10 relative`} />
                      {/* Unique shimmer effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
                      {/* Glow ring */}
                      <div className="absolute inset-0 rounded-2xl border-2 border-[#22C55E]/30 scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    {/* Unique floating particles effect */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#22C55E] rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-500"></div>
                    <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-[#16A34A] rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-700"></div>
                  </div>
                  
                  {/* Title with unique underline effect */}
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#166534] transition-colors duration-300 relative">
                    {feature.title}
                    <span className={`absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r ${feature.gradient} group-hover:w-full transition-all duration-500`}></span>
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed text-base group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                  
                  {/* Unique bottom accent with gradient */}
                  <div className={`absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#22C55E] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-3xl`}></div>
                </div>
                
                {/* Unique corner decorations */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-bl-3xl`}></div>
                <div className={`absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-tr-3xl`}></div>
                
                {/* Unique floating badge effect */}
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-[#22C55E] to-[#16A34A] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 px-4 bg-gradient-to-b from-white via-[#F0FDF4]/20 to-white relative overflow-hidden">
        {/* Unique decorative elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-[#22C55E]/15 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-[#16A34A]/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="relative bg-gradient-to-br from-[#F0FDF4] via-white to-[#F0FDF4] border-2 border-[#BBF7D0] rounded-3xl p-10 md:p-14 lg:p-20 text-center max-w-5xl mx-auto shadow-2xl overflow-hidden">
            {/* Unique animated background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-10 left-10 w-32 h-32 border-2 border-[#22C55E] rounded-full animate-pulse"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 border-2 border-[#16A34A] rounded-full animate-pulse delay-300"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white rounded-full text-sm font-bold mb-6 shadow-lg">
                <TrendingUp className="w-4 h-4" />
                Join the Revolution
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Ready to Transform Your Agribusiness?
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-10 leading-relaxed">
                Join thousands of farmers and buyers already trading on FarmSquare. Start your journey today and grow your agricultural business with confidence.
              </p>
              
              {/* Enhanced CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <Link
                  to="/auth?intent=farmer"
                  className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white rounded-xl text-lg font-bold hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Selling
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  {/* Unique shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </Link>
                <Link
                  to="/auth?intent=buyer"
                  className="group relative inline-flex items-center gap-3 px-10 py-5 bg-white border-3 border-[#22C55E] text-[#166534] rounded-xl text-lg font-bold hover:bg-[#F0FDF4] transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Buy Produce
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>
              
              {/* Trust indicators */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                  <span>Trusted by 5,000+ Farmers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
            
            {/* Corner decorations */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#22C55E]/10 to-transparent rounded-bl-3xl"></div>
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-tr from-[#16A34A]/10 to-transparent rounded-tr-3xl"></div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-28 px-4 bg-gradient-to-b from-white via-[#FAFAFA] to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03),transparent_50%)] pointer-events-none"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-14 md:mb-20">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider bg-[#F0FDF4] px-4 py-2 rounded-full">
                Trusted by Thousands
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Testimonials
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Real stories from farmers, buyers, and logistics partners.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              {
                role: 'Farmer',
                name: 'Musa B.',
                quote: 'Before Farm Square, I lost 30% of my harvest to middleman delays. Now, my produce is sold before I even finish harvesting.',
                initials: 'MB',
                gradient: 'from-[#F0FDF4] to-[#DCFCE7]',
              },
              {
                role: 'Wholesaler',
                name: 'Chinelo O.',
                quote: 'Sourcing organic produce used to take days of travel. I can now verify quality and lock in prices directly from my phone.',
                initials: 'CO',
                gradient: 'from-[#ECFDF5] to-[#D1FAE5]',
              },
              {
                role: 'Logistics',
                name: 'David E.',
                quote: 'The platform makes scheduling pickups easy. It\'s the first time I\'ve felt like part of a truly organized supply chain.',
                initials: 'DE',
                gradient: 'from-[#F0FDF4] to-[#DCFCE7]',
              },
            ].map((testimonial, i) => (
              <div 
                key={i} 
                className="group bg-white rounded-2xl p-6 md:p-8 border border-gray-200 hover:border-[#22C55E] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#22C55E]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.gradient} border-2 border-[#BBF7D0] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow duration-300`}>
                      <span className="text-base font-bold text-[#166534]">{testimonial.initials}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Quote className="w-5 h-5 text-[#22C55E]" />
                        <span className="text-xs font-semibold text-[#22C55E] uppercase tracking-wide">{testimonial.role}</span>
                      </div>
                      <p className="font-bold text-gray-900 text-base">{testimonial.name}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-base md:text-lg italic relative pl-4 border-l-2 border-[#BBF7D0]">
                    "{testimonial.quote}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 md:py-28 px-4 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,197,94,0.02)_0%,transparent_100%)] pointer-events-none"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-14 md:mb-20">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider bg-[#F0FDF4] px-4 py-2 rounded-full">
                Trusted Ecosystem
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Our Partners
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Working with trusted partners to build a stronger agricultural supply chain
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 max-w-6xl mx-auto">
            {[
              { 
                name: 'Paystack', 
                logo: (
                  <svg viewBox="0 0 200 60" className="w-full h-12">
                    <rect width="200" height="60" rx="8" fill="#00A8FF"/>
                    <text x="100" y="35" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif">Paystack</text>
                  </svg>
                ),
                category: 'Payments'
              },
              { 
                name: 'AgroCo Nigeria', 
                logo: (
                  <div className="w-full h-12 flex items-center justify-center bg-gradient-to-r from-[#22C55E] to-[#16A34A] rounded-lg">
                    <span className="text-white font-bold text-lg">AgroCo</span>
                  </div>
                ),
                category: 'Agricultural Co-op'
              },
              { 
                name: 'Swift Logistics', 
                logo: (
                  <div className="w-full h-12 flex items-center justify-center bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg">
                    <Truck className="w-6 h-6 text-white mr-2" />
                    <span className="text-white font-bold text-sm">Swift</span>
                  </div>
                ),
                category: 'Logistics'
              },
              { 
                name: 'QualityCert', 
                logo: (
                  <div className="w-full h-12 flex items-center justify-center bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-lg">
                    <Shield className="w-6 h-6 text-white mr-2" />
                    <span className="text-white font-bold text-sm">QCert</span>
                  </div>
                ),
                category: 'Quality Assurance'
              },
              { 
                name: 'FarmInputs Pro', 
                logo: (
                  <div className="w-full h-12 flex items-center justify-center bg-gradient-to-r from-[#10B981] to-[#059669] rounded-lg">
                    <Package className="w-6 h-6 text-white mr-2" />
                    <span className="text-white font-bold text-xs">FarmInputs</span>
                  </div>
                ),
                category: 'Farm Supplies'
              },
              { 
                name: 'Nigerian Farmers Union', 
                logo: (
                  <div className="w-full h-12 flex items-center justify-center bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-lg">
                    <Users className="w-6 h-6 text-white mr-2" />
                    <span className="text-white font-bold text-xs">NFU</span>
                  </div>
                ),
                category: 'Farmers Union'
              },
            ].map((partner, i) => (
              <div
                key={i}
                className="group bg-white rounded-xl p-4 md:p-6 border-2 border-gray-200 hover:border-[#22C55E] hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center min-h-[120px] md:min-h-[140px] text-center transform hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#22C55E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 w-full">
                  <div className="mb-3 transform group-hover:scale-105 transition-transform duration-300">
                    {partner.logo}
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-gray-700 group-hover:text-[#166534] transition-colors duration-300 mb-1">
                    {partner.name}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500">
                    {partner.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Trusted by leading agricultural organizations across Nigeria
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 opacity-60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                <span className="text-sm text-gray-600">Verified Partners</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#22C55E]" />
                <span className="text-sm text-gray-600">Secure Transactions</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#22C55E]" />
                <span className="text-sm text-gray-600">Growing Network</span>
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
              <h4 className="font-semibold text-gray-900 mb-4">Legal & Support</h4>
              <div className="space-y-2">
                <Link to="/terms" className="block text-sm text-gray-600 hover:text-[#22C55E] transition-colors duration-300">
                  Terms of Service
                </Link>
                <Link to="/privacy" className="block text-sm text-gray-600 hover:text-[#22C55E] transition-colors duration-300">
                  Privacy Policy
                </Link>
                <Link to="/support" className="block text-sm text-gray-600 hover:text-[#22C55E] transition-colors duration-300">
                  Support
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

export default LandingPage;
