import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, TrendingUp, Users, ChevronRight } from 'lucide-react';
import logo from '@/assets/logo.png';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="FarmSquare" className="w-10 h-10" />
            <span className="font-display font-bold text-xl text-foreground">FarmSquare</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>
          
          <Link
            to="/auth"
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium btn-glow transition-all hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6 animate-fade-up">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Nigeria's B2B Agro Marketplace
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
            Connect. Trade.{' '}
            <span className="text-gradient">Grow.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
            The trusted marketplace connecting Nigerian farmers directly with buyers. 
            Quality-graded produce, secure payments, reliable logistics.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <Link
              to="/auth"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-lg font-medium btn-glow transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Start Selling
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/auth"
              className="w-full sm:w-auto px-8 py-4 bg-card border border-border text-foreground rounded-2xl text-lg font-medium transition-all hover:border-primary/50 flex items-center justify-center gap-2"
            >
              Buy Produce
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-y border-border">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '5,000+', label: 'Active Farmers' },
              { value: '₦2.5B+', label: 'Traded Volume' },
              { value: '98%', label: 'On-Time Delivery' },
              { value: '150+', label: 'Enterprise Buyers' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Why FarmSquare?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We've built the infrastructure to make agricultural trade seamless, secure, and profitable.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Quality Grading',
                description: 'Every produce is inspected and graded (A/B/C) by certified field agents.',
              },
              {
                icon: TrendingUp,
                title: 'Fair Pricing',
                description: 'Real-time market intelligence ensures you get competitive prices.',
              },
              {
                icon: Truck,
                title: 'Reliable Logistics',
                description: 'End-to-end tracking from farm to warehouse with our logistics network.',
              },
              {
                icon: Users,
                title: 'Escrow Payments',
                description: 'Funds are held securely and released only after verified delivery.',
              },
            ].map((feature, i) => (
              <div key={i} className="farm-card-interactive p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="farm-card p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Ready to transform your agribusiness?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Join thousands of farmers and buyers already trading on FarmSquare.
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-lg font-medium btn-glow transition-all hover:scale-105"
              >
                Get Started Today
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="FarmSquare" className="w-10 h-10" />
                <span className="font-display font-bold text-lg text-foreground">FarmSquare</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Nigeria's trusted B2B agricultural marketplace.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Platform</h4>
              <div className="space-y-2">
                <Link to="/how-it-works" className="block text-sm text-muted-foreground hover:text-foreground">How it Works</Link>
                <Link to="/pricing" className="block text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
                <Link to="/faq" className="block text-sm text-muted-foreground hover:text-foreground">FAQ</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <div className="space-y-2">
                <Link to="/about" className="block text-sm text-muted-foreground hover:text-foreground">About</Link>
                <Link to="/contact" className="block text-sm text-muted-foreground hover:text-foreground">Contact</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <div className="space-y-2">
                <Link to="/terms" className="block text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
                <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2024 FarmSquare. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
