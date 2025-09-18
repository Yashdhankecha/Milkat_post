import { Users, Building2, MapPin, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const StatsSection = () => {
  const [statsData, setStatsData] = useState({
    clients: 0,
    properties: 0,
    brokers: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Call the secure database function to get stats
        const { data, error } = await supabase.rpc('get_public_stats');
        
        if (error) throw error;

        const statsResult = data as { clients: number; properties: number; brokers: number };

        setStatsData({
          clients: statsResult?.clients || 0,
          properties: statsResult?.properties || 0,
          brokers: statsResult?.brokers || 0,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStatsData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K+';
    }
    return num.toString() + '+';
  };

  const stats = [
    {
      icon: Users,
      number: statsData.loading ? "..." : statsData.clients.toString(),
      label: "Happy Clients",
      description: "Satisfied customers worldwide"
    },
    {
      icon: Building2,
      number: statsData.loading ? "..." : formatNumber(statsData.properties),
      label: "Properties Listed",
      description: "Premium listings available"
    },
    {
      icon: Award,
      number: "25+",
      label: "Years Experience",
      description: "Industry expertise and trust"
    }
  ];

  const testimonials = [
    {
      name: "Yash Dhankecha ",
      role: "Property Investor",
      quote: "Exceptional service and professionalism. Found my dream property within weeks!",
      rating: 4
    },
    {
      name: "Harsh Vyas",
      role: "First-time Buyer",
      quote: "The team guided me through every step. Transparent, reliable, and trustworthy.",
      rating: 5
    },
    {
      name: "Karansinh Desai ",
      role: "Real Estate Developer",
      quote: "Outstanding market knowledge and innovative approach. Highly recommended!",
      rating: 5
    }
  ];

  return (
    <section className="py-16 bg-estate-gray-light">
      <div className="container mx-auto px-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-none shadow-soft hover:shadow-medium transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-estate-blue rounded-full flex items-center justify-center">
                    <stat.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-estate-blue mb-2">{stat.number}</div>
                <div className="font-semibold text-foreground">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">What Our Clients Say</h2>
          <p className="text-muted-foreground">Real experiences from satisfied customers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-none shadow-soft">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <div key={i} className="w-5 h-5 bg-estate-warning rounded-full mr-1"></div>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;