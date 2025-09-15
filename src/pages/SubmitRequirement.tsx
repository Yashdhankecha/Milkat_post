import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Home } from "lucide-react";

const SubmitRequirement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    purpose: '',
    budget: '',
    property_type: '',
    city: '',
    description: ''
  });

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Search className="w-16 h-16 text-estate-gray mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              Please login to submit your property requirements.
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('requirements')
        .insert({
          user_id: user.id,
          purpose: formData.purpose,
          budget: formData.budget,
          property_type: formData.property_type,
          city: formData.city,
          description: formData.description
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your requirement has been submitted. Our team will contact you soon.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting requirement:', error);
      toast({
        title: "Error",
        description: "Failed to submit requirement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-hero py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Submit Your Requirement
          </h1>
          <p className="text-xl text-white/90 text-center max-w-2xl mx-auto">
            Tell us what you're looking for and our property experts will find 
            the perfect match for your needs.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-6 h-6" />
                Property Requirement Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="purpose">What are you looking for? *</Label>
                  <Select value={formData.purpose} onValueChange={(value) => handleInputChange('purpose', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy Property</SelectItem>
                      <SelectItem value="rent">Rent Property</SelectItem>
                      <SelectItem value="sell">Sell Property</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="property_type">Property Type *</Label>
                  <Select value={formData.property_type} onValueChange={(value) => handleInputChange('property_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="budget">Budget Range *</Label>
                  <Select value={formData.budget} onValueChange={(value) => handleInputChange('budget', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Below 50L">Below ₹50 Lakh</SelectItem>
                      <SelectItem value="50L-1Cr">₹50 Lakh - ₹1 Crore</SelectItem>
                      <SelectItem value="1-2Cr">₹1 - ₹2 Crore</SelectItem>
                      <SelectItem value="2-5Cr">₹2 - ₹5 Crore</SelectItem>
                      <SelectItem value="Above 5Cr">Above ₹5 Crore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city">Preferred City/Location *</Label>
                  <Input
                    id="city"
                    placeholder="e.g. Mumbai, Bangalore, Delhi"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Additional Requirements</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us more about your specific requirements, preferences, timeline, etc."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                <div className="bg-estate-blue-lighter/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">What happens next?</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Our property experts will review your requirements</li>
                    <li>• We'll match you with suitable properties from our database</li>
                    <li>• You'll receive curated property recommendations via email/phone</li>
                    <li>• Our team will assist you throughout the property selection process</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || !formData.purpose || !formData.property_type || !formData.budget || !formData.city}
                    className="flex-1"
                  >
                    {loading ? "Submitting..." : "Submit Requirement"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <div className="text-2xl font-bold text-estate-blue">15+</div>
              <div className="text-sm text-muted-foreground">Years Experience</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-estate-blue">50,000+</div>
              <div className="text-sm text-muted-foreground">Happy Customers</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-estate-blue">1,000+</div>
              <div className="text-sm text-muted-foreground">NRI Brokers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitRequirement;