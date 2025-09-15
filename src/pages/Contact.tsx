import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  MessageCircle,
  Globe,
  Building
} from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    office: ''
  });

  const offices = [
    {
      country: "India",
      city: "Mumbai (Head Office)",
      address: "123 Business District, Bandra Kurla Complex, Mumbai - 400051",
      phone: "+91 22 4567 8900",
      email: "mumbai@realestatepro.com",
      hours: "Mon-Sat: 9:00 AM - 7:00 PM"
    },
    {
      country: "India",
      city: "Bangalore",
      address: "456 Tech Park, Electronic City, Bangalore - 560100",
      phone: "+91 80 4567 8901",
      email: "bangalore@realestatepro.com",
      hours: "Mon-Sat: 9:00 AM - 7:00 PM"
    },
    {
      country: "USA",
      city: "New York",
      address: "789 Manhattan Plaza, New York, NY 10001",
      phone: "+1 212 456 7890",
      email: "newyork@realestatepro.com",
      hours: "Mon-Fri: 9:00 AM - 6:00 PM EST"
    },
    {
      country: "UAE",
      city: "Dubai",
      address: "321 Business Bay, Dubai Marina, UAE",
      phone: "+971 4 567 8900",
      email: "dubai@realestatepro.com",
      hours: "Sun-Thu: 9:00 AM - 6:00 PM GST"
    },
    {
      country: "Canada", 
      city: "Toronto",
      address: "654 Financial District, Toronto, ON M5H 2N2",
      phone: "+1 416 567 8900",
      email: "toronto@realestatepro.com",
      hours: "Mon-Fri: 9:00 AM - 6:00 PM EST"
    },
    {
      country: "Kenya",
      city: "Nairobi",
      address: "987 Westlands Business Park, Nairobi, Kenya",
      phone: "+254 20 567 8900",
      email: "nairobi@realestatepro.com",
      hours: "Mon-Fri: 8:00 AM - 5:00 PM EAT"
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message Sent!",
      description: "Thank you for contacting us. We'll get back to you within 24 hours.",
    });
    
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      office: ''
    });
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-hero py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-white/90 text-center max-w-2xl mx-auto">
            Get in touch with our real estate experts. We're here to help you 
            with all your property needs across the globe.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-6 h-6" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="office">Preferred Office</Label>
                      <Select value={formData.office} onValueChange={(value) => handleInputChange('office', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select office" />
                        </SelectTrigger>
                        <SelectContent>
                          {offices.map((office, index) => (
                            <SelectItem key={index} value={office.city}>
                              {office.city}, {office.country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buying">Property Buying Inquiry</SelectItem>
                        <SelectItem value="selling">Property Selling Inquiry</SelectItem>
                        <SelectItem value="renting">Property Rental Inquiry</SelectItem>
                        <SelectItem value="investment">Investment Consultation</SelectItem>
                        <SelectItem value="nri">NRI Services</SelectItem>
                        <SelectItem value="commercial">Commercial Properties</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your requirements or questions..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Office Locations */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Our Global Offices</h2>
            
            {offices.map((office, index) => (
              <Card key={index} className="hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-estate-blue/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building className="w-6 h-6 text-estate-blue" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{office.city}</h3>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{office.address}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{office.phone}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span>{office.email}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>{office.hours}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Quick Contact */}
            <Card className="bg-estate-blue text-white">
              <CardContent className="p-6 text-center">
                <Globe className="w-12 h-12 mx-auto mb-4 text-white/90" />
                <h3 className="text-xl font-semibold mb-2">24/7 Global Support</h3>
                <p className="text-white/90 mb-4">
                  Need immediate assistance? Our global support team is available around the clock.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>+91 22 4567 8900</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>support@realestatepro.com</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How quickly do you respond to inquiries?</h3>
                <p className="text-muted-foreground text-sm">
                  We typically respond to all inquiries within 2-4 hours during business hours 
                  and within 24 hours on weekends and holidays.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Do you charge for consultation?</h3>
                <p className="text-muted-foreground text-sm">
                  Initial consultation and property search assistance are completely free. 
                  We only charge commission upon successful transaction completion.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Can NRIs buy property through your platform?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes! We specialize in NRI property transactions and handle all legal 
                  documentation, compliance, and remote purchase procedures.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Do you provide property management services?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes, we offer comprehensive property management services including 
                  tenant finding, rent collection, maintenance, and legal support.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;