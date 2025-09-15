import { Target, Shield, Globe, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AboutSection = () => {
  const values = [
    {
      icon: Target,
      title: "Innovation",
      description: "Cutting-edge technology and modern solutions for real estate"
    },
    {
      icon: Shield,
      title: "Ethics & Transparency",
      description: "Honest dealings and complete transparency in all transactions"
    },
    {
      icon: TrendingUp,
      title: "Leadership",
      description: "Industry-leading expertise and market knowledge"
    },
    {
      icon: Globe,
      title: "Global Presence",
      description: "Worldwide network with local market expertise"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* About Content */}
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              About RealEstate<span className="text-accent">Pro</span>
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              With over 25 years of experience in the real estate industry, we have built our reputation on 
              innovation, ethics, transparency, and leadership. Our global presence combined with local market 
              expertise ensures that we deliver exceptional results for our clients worldwide.
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              We are committed to revolutionizing the real estate experience through technology, 
              providing comprehensive solutions for buyers, sellers, investors, and developers across international markets.
            </p>

            {/* Values Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {values.map((value, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-estate-blue-lighter rounded-lg flex items-center justify-center flex-shrink-0">
                    <value.icon className="h-5 w-5 text-estate-blue" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{value.title}</h4>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter & CTA */}
          <div className="bg-gradient-card p-8 rounded-lg shadow-medium">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Stay Updated</h3>
              <p className="text-muted-foreground">
                Get the latest property listings and market insights delivered to your inbox
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <Input 
                placeholder="Enter your email address" 
                type="email"
                className="w-full"
              />
              <Button className="w-full bg-estate-blue hover:bg-estate-blue-light">
                Subscribe to Newsletter
              </Button>
            </div>

            <div className="border-t border-border pt-6">
              <h4 className="font-semibold text-foreground mb-3">Need Investment Support?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Our expert team is ready to help you make informed investment decisions
              </p>
              <Button variant="outline" className="w-full">
                Get Investment Consultation
              </Button>
            </div>

            <div className="border-t border-border pt-6 mt-6">
              <h4 className="font-semibold text-foreground mb-3">Share Your Feedback</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Help us improve our services with your valuable feedback
              </p>
              <Button variant="outline" className="w-full">
                Submit Feedback
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;