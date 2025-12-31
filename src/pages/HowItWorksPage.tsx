import { Link } from 'react-router-dom';
import { ArrowLeft, Tractor, ShoppingBag, CheckCircle } from 'lucide-react';
import logo from '@/assets/logo.png';

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <img src={logo} alt="FarmSquare" className="w-10 h-10" />
            <span className="font-display font-bold text-xl text-foreground">FarmSquare</span>
          </Link>
          
          <Link
            to="/auth"
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4 text-center">
            How FarmSquare Works
          </h1>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-16">
            Whether you're selling farm produce or sourcing for your business, we've made the process simple and secure.
          </p>

          {/* For Farmers */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tractor className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">For Farmers</h2>
            </div>

            <div className="grid gap-6">
              {[
                { step: '1', title: 'Register & Verify', description: 'Sign up with your phone, complete KYC verification with a field agent.' },
                { step: '2', title: 'List Your Produce', description: 'Add photos, set your price per kg, and specify quality grade (A/B/C).' },
                { step: '3', title: 'Receive Orders', description: 'Buyers place orders. Accept or decline based on your availability.' },
                { step: '4', title: 'Get Paid', description: 'Funds are held in escrow. After delivery confirmation, money is released to your wallet.' },
              ].map((item) => (
                <div key={item.step} className="farm-card flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* For Buyers */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-farm-brown/20 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-farm-brown-light" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">For Buyers</h2>
            </div>

            <div className="grid gap-6">
              {[
                { step: '1', title: 'Browse Marketplace', description: 'Search by commodity, grade, region, and price. View verified listings with photos.' },
                { step: '2', title: 'Place Orders', description: 'Select quantity, review seller details, and confirm your order.' },
                { step: '3', title: 'Track Delivery', description: 'Real-time updates from pickup to delivery. All logistics handled.' },
                { step: '4', title: 'Confirm Receipt', description: 'Verify quality upon delivery. Funds released to farmer after confirmation.' },
              ].map((item) => (
                <div key={item.step} className="farm-card flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-farm-brown text-foreground flex items-center justify-center flex-shrink-0 font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HowItWorksPage;
