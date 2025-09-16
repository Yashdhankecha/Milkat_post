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
  Building,
  Send,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
      <Header />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-soft">
              <CardHeader className="bg-gradient-primary text-white">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <MessageCircle className="w-6 h-6" />
                  Send us a Message
                </CardTitle>
                <p className="text-white/90 text-sm">We'll get back to you within 24 hours</p>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="h-11"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="h-11"
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="h-11"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="office" className="text-sm font-medium">Preferred Office</Label>
                      <Select value={formData.office} onValueChange={(value) => handleInputChange('office', value)}>
                        <SelectTrigger className="h-11">
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

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium">Subject *</Label>
                    <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                      <SelectTrigger className="h-11">
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

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your requirements or questions..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className="resize-none"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-estate-blue hover:bg-estate-blue-light text-white font-medium" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Message
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Office Locations */}
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Our Global Offices</h2>
              <p className="text-muted-foreground text-sm">Visit us at any of our locations worldwide</p>
            </div>
            
            <div className="space-y-4 max-h-[28rem] md:max-h-[32rem] overflow-y-auto pr-1">
              {offices.map((office, index) => (
                <Card key={index} className="hover:shadow-medium transition-all duration-200 border-l-4 border-l-estate-blue/20 hover:border-l-estate-blue">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-estate-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building className="w-5 h-5 text-estate-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1">{office.city}</h3>
                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span className="leading-tight">{office.address}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span>{office.phone}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{office.email}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span>{office.hours}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            
          </div>
        </div>

        {/* Full-width Support CTA */}
        <section className="mt-16">
          <div className="rounded-lg bg-gradient-primary text-white p-8 md:p-12 shadow-medium">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Globe className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">24/7 Global Support</h3>
                  <p className="text-white/90">Need immediate assistance? Our global support team is available around the clock.</p>
                </div>
              </div>
              <div className="flex-1" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
                <a href="tel:+912245678900" className="flex items-center justify-center gap-2 bg-white text-estate-blue rounded-md h-12 px-6 font-medium shadow-soft hover:shadow-medium transition-shadow">
                  <Phone className="w-4 h-4" />
                  +91 22 4567 8900
                </a>
                <a href="mailto:support@realestatepro.com" className="flex items-center justify-center gap-2 bg-white/10 text-white rounded-md h-12 px-6 font-medium hover:bg-white/15 transition-colors">
                  <Mail className="w-4 h-4" />
                  support@realestatepro.com
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about our services and processes
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                question: "How quickly do you respond to inquiries?",
                answer: "We typically respond to all inquiries within 2-4 hours during business hours and within 24 hours on weekends and holidays."
              },
              {
                question: "Do you charge for consultation?",
                answer: "Initial consultation and property search assistance are completely free. We only charge commission upon successful transaction completion."
              },
              {
                question: "Can NRIs buy property through your platform?",
                answer: "Yes! We specialize in NRI property transactions and handle all legal documentation, compliance, and remote purchase procedures."
              },
              {
                question: "Do you provide property management services?",
                answer: "Yes, we offer comprehensive property management services including tenant finding, rent collection, maintenance, and legal support."
              },
              {
                question: "What types of properties do you handle?",
                answer: "We handle residential, commercial, industrial, and land properties across all major cities in our network."
              },
              {
                question: "How do you ensure property authenticity?",
                answer: "All properties undergo thorough verification including legal documentation, ownership verification, and quality inspection before listing."
              }
            ].map((faq, index) => (
              <Card key={index} className="hover:shadow-medium transition-all duration-200 border-0 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-estate-blue/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <HelpCircle className="w-4 h-4 text-estate-blue" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base mb-3 text-foreground">{faq.question}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;