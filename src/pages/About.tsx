import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Award, Shield, Users, Briefcase, TrendingUp } from "lucide-react";

const About = () => {
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
    { number: "1,000+", label: "NRI Brokers" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            About RealEstatePro
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Your trusted partner in real estate since 2009. We connect property seekers 
            with their perfect homes and investment opportunities across the globe.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-estate-blue mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Story</h2>
            <div className="prose prose-lg mx-auto text-muted-foreground">
              <p>
                Founded in 2009, RealEstatePro began as a vision to revolutionize how people 
                discover, evaluate, and acquire real estate. What started as a local initiative 
                has grown into a global platform serving clients across five countries.
              </p>
              <p>
                Our journey has been marked by continuous innovation, unwavering commitment to 
                transparency, and a deep understanding of diverse real estate markets. From 
                luxury villas in Mumbai to commercial spaces in Dubai, we've facilitated 
                thousands of successful transactions.
              </p>
              <p>
                Today, we're proud to be the preferred choice for NRI investors, first-time 
                buyers, seasoned investors, and developers alike. Our technology-driven approach 
                combined with human expertise ensures every client receives personalized service 
                and the best possible outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-estate-blue-lighter/30">
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

      {/* Global Presence */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Global Presence</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            With offices and partners across five countries, we provide seamless real estate 
            services to clients worldwide.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {["India", "USA", "UAE", "Canada", "Kenya"].map((country) => (
              <Badge key={country} variant="secondary" className="px-6 py-2 text-lg">
                {country}
              </Badge>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;