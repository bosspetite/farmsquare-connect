import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import logo from '@/assets/logo.png';

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
          <h1 className="text-3xl font-display font-bold text-foreground mb-4 text-center">
            Contact Us
          </h1>
          <p className="text-muted-foreground text-center mb-12">
            Have questions? We're here to help.
          </p>

          <div className="grid gap-4 mb-12">
            {[
              { icon: Phone, label: 'Phone', value: '+234 800 123 4567' },
              { icon: Mail, label: 'Email', value: 'support@farmsquare.ng' },
              { icon: MapPin, label: 'Address', value: 'Lagos, Nigeria' },
            ].map((item, i) => (
              <div key={i} className="farm-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-medium text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Name</label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Message</label>
              <textarea
                rows={4}
                placeholder="How can we help?"
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium btn-glow transition-all hover:scale-[1.02]"
            >
              Send Message
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
