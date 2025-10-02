import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Globe, Award, Shield, Users, Briefcase, TrendingUp, Building2, CheckCircle2, MapPin, Handshake } from "lucide-react";
import heroImg from "@/assets/hero-cityscape.jpg";
import { useEffect, useState } from "react";

const About = () => {
  // simple typewriter for hero title
  const phrases = ["Building Trust.", "Creating Value.", "Guiding Your Investment."];
  const [pIndex, setPIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[pIndex % phrases.length];
    const speed = deleting ? 20 : 50;

    const timer = setTimeout(() => {
      if (!deleting) {
        const next = current.slice(0, typed.length + 1);
        setTyped(next);
        if (next === current) {
          setTimeout(() => setDeleting(true), 900);
        }
      } else {
        const next = current.slice(0, typed.length - 1);
        setTyped(next);
        if (next === "") {
          setDeleting(false);
          setPIndex((i) => (i + 1) % phrases.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [typed, deleting, pIndex]);
  const values = [
    {
      icon: TrendingUp,
      title: "Innovation",
      description: "Pioneering technology-driven solutions in real estate"
    },
    {
      icon: Shield,
      title: "Transparency", 
      description: "Complete transparency in all transactions and processes"
    },
    {
      icon: Globe,
      title: "Global Presence",
      description: "Serving clients across India, USA, UAE, Canada, and Kenya"
    },
    {
      icon: Users,
      title: "Leadership",
      description: "Industry leaders with decades of combined experience"
    },
    {
      icon: Award,
      title: "Recognition",
      description: "Award-winning platform trusted by thousands of clients"
    },
    {
      icon: Briefcase,
      title: "Professional Service",
      description: "Dedicated support from property experts and advisors"
    }
  ];

  const stats = [
    { number: "50,000+", label: "Happy Customers" },
    { number: "15+", label: "Years Experience" },
    { number: "5", label: "Countries" },
    { number: "1,000+", label: "Brokers" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section
        className="relative py-24 md:py-28"
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(220 85% 25% / 0.85), hsl(220 85% 35% / 0.85)), url(${heroImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container mx-auto px-6 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            {typed}
            <span className="opacity-80 animate-pulse">|</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Your global partner for residential, commercial and investment real estate.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <a href="#story" className="px-6 py-3 rounded-md bg-white text-estate-blue font-medium shadow-soft hover:shadow-medium transition-shadow">Our Story</a>
            <a href="#why" className="px-6 py-3 rounded-md bg-transparent border border-white/50 text-white hover:bg-white/10 transition-colors">Why Choose Us</a>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section id="story" className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Founded in 2009, MilkatPost began as a vision to revolutionize how people
                  discover, evaluate, and acquire real estate. What started as a local initiative has
                  grown into a global platform serving clients across five countries.
                </p>
                <p>
                  Our journey has been marked by continuous innovation, unwavering commitment to transparency,
                  and a deep understanding of diverse real estate markets. From luxury villas in Mumbai to
                  commercial spaces in Dubai, we've facilitated thousands of successful transactions.
                </p>
                <p>
                  Today, we're proud to be the preferred choice for NRI investors, first-time buyers, seasoned
                  investors, and developers alike.
                </p>
              </div>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-foreground"><Shield className="h-5 w-5 text-estate-blue" /> Ethics & Transparency</div>
                <div className="flex items-center gap-2 text-foreground"><Globe className="h-5 w-5 text-estate-blue" /> Global Expertise</div>
                <div className="flex items-center gap-2 text-foreground"><CheckCircle2 className="h-5 w-5 text-estate-blue" /> Tech-driven Approach</div>
                <div className="flex items-center gap-2 text-foreground"><Users className="h-5 w-5 text-estate-blue" /> Personalized Service</div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-medium">
                <img src={heroImg} alt="Cityscape" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
             
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-estate-blue-lighter/30" id="values">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-estate-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <value.icon className="w-8 h-8 text-estate-blue" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-soft">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-3">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Empower clients with transparent information, expert guidance, and seamless experiences
                  to make confident real estate decisions.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-soft">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-3">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To be the most trusted global platform for discovering, investing, and managing real estate.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why" className="py-20 bg-gradient-card">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose MilkatPost</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[{
              icon: Shield, title: 'Secure & Transparent', desc: 'Verified listings, secure transactions, full transparency.'
            }, {
              icon: Globe, title: 'Global Network', desc: 'Local expertise with worldwide reach and insights.'
            }, {
              icon: Users, title: 'Expert Guidance', desc: 'Dedicated advisors throughout your journey.'
            }, {
              icon: Award, title: 'Award-Winning', desc: 'Recognized for service excellence and innovation.'
            }, {
              icon: Briefcase, title: 'Investment Focus', desc: 'Data-led advisory for strong ROI.'
            }, {
              icon: MapPin, title: 'Prime Locations', desc: 'Handpicked projects in sought-after areas.'
            }].map((item, i) => (
              <Card key={i} className="border-0 shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-md bg-estate-blue/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-estate-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Legal Advisory', desc: 'End-to-end legal due diligence and documentation.' },
              { icon: Users, title: 'Interior Design', desc: 'Bespoke interiors tailored to your lifestyle.' },
              { icon: Building2, title: 'Architecture Consultation', desc: 'Concept to blueprint with expert architects.' },
              { icon: Briefcase, title: 'Property Valuation', desc: 'Accurate valuations using market data and comps.' },
              { icon: Globe, title: 'Investment Planning', desc: 'Portfolio strategy for rental yield and appreciation.' },
              { icon: MapPin, title: 'Mortgage Assistance', desc: 'Best financing options with leading lenders.' }
            ].map((s, i) => (
              <Card key={i} className="border-0 shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-md bg-estate-blue/10 flex items-center justify-center shrink-0">
                      <s.icon className="w-6 h-6 text-estate-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>



      


      
      <Footer />
    </div>
  );
};

export default About;