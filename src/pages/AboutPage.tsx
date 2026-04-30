import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo-web.png';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link to="/" className="flex items-center gap-3">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <img src={logo} alt="FarmSquare" className="w-10 h-10" />
            <span className="font-display font-bold text-xl text-foreground">FarmSquare</span>
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-display font-bold text-foreground mb-6 text-center">
            About FarmSquare
          </h1>
          
          <div className="prose prose-invert max-w-none">
            <div className="farm-card mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground mb-3">Our Mission</h2>
              <p className="text-muted-foreground">
                FarmSquare is on a mission to transform agricultural trade in Nigeria by connecting farmers directly with buyers, eliminating middlemen, and ensuring fair prices for quality produce.
              </p>
            </div>

            <div className="farm-card mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground mb-3">What We Do</h2>
              <p className="text-muted-foreground">
                We've built a trusted B2B marketplace where farmers can list their produce with quality grades, buyers can source with confidence, and every transaction is protected by our escrow system. Our network of field agents ensures quality verification at the source.
              </p>
            </div>

            <div className="farm-card">
              <h2 className="text-xl font-display font-semibold text-foreground mb-3">Our Impact</h2>
              <ul className="text-muted-foreground space-y-2">
                <li>• 5,000+ farmers connected to reliable markets</li>
                <li>• ₦2.5B+ in trade volume facilitated</li>
                <li>• 98% on-time delivery rate</li>
                <li>• Operating across major agricultural states</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
