import apiClient from '@/lib/api';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Home } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StateCitySelector from "@/components/StateCitySelector";

const SubmitRequirement = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mockEnabled = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    purpose: '',
    budget: {
      min: '',
      max: '',
      currency: 'INR'
    },
    propertyType: '',
    location: {
      city: '',
      state: '',
      area: '',
      pincode: ''
    },
    area: {
      min: '',
      max: '',
      unit: 'sqft'
    },
    description: '',
    preferences: {
      furnished: 'any',
      age: 'any',
      floor: 'any',
      facing: 'any'
    },
    amenities: [],
    contact: {
      phone: '',
      email: '',
      preferredTime: 'any'
    },
    priority: 'medium',
    timeline: 'flexible'
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

  const getRoleBasedDashboardPath = (role: string) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'buyer_seller':
        return '/buyer-seller/dashboard';
      case 'broker':
        return '/broker/dashboard';
      case 'developer':
        return '/developer/dashboard';
      case 'society_owner':
        return '/society-owner/dashboard';
      case 'society_member':
        return '/society-member/dashboard';
      default:
        return '/';
    }
  };

  const handleStateChange = (state: string) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        state: state,
        city: '' // Reset city when state changes
      }
    });
  };

  const handleCityChange = (city: string) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        city: city
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('SubmitRequirement form submitted:', { user: user?.id, formData });
    
    if (!user?.id) {
      console.error('No authenticated user found during requirement submission');
      toast({
        title: "Authentication Required",
        description: "Please login to submit requirements.",
        variant: "destructive",
      });
      return;
    }

    // Frontend validation for required fields
    const requiredFields = [
      { field: 'purpose', value: formData.purpose, label: 'Purpose' },
      { field: 'propertyType', value: formData.propertyType, label: 'Property Type' },
      { field: 'city', value: formData.location.city, label: 'City' },
      { field: 'state', value: formData.location.state, label: 'State' },
      { field: 'phone', value: formData.contact.phone, label: 'Phone Number' }
    ];

    const missingFields = requiredFields.filter(field => !field.value || field.value.trim() === '');
    
    if (missingFields.length > 0) {
      const missingFieldNames = missingFields.map(field => field.label).join(', ');
      toast({
        title: "Missing Required Fields",
        description: `Please fill in the following required fields: ${missingFieldNames}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Attempting to create requirement with data:', formData);

      let error;
      
      // Handle mock mode differently since RLS policies won't work
      if (mockEnabled) {
        // In mock mode, we'll simulate the insertion by storing in localStorage
        const mockRequirements = JSON.parse(localStorage.getItem('mock_requirements') || '[]');
        const newRequirement = {
          id: `req_${Date.now()}`,
          user_id: user.id,
          purpose: formData.purpose,
          budget: formData.budget,
          propertyType: formData.propertyType,
          location: formData.location,
          description: formData.description,
          created_at: new Date().toISOString()
        };
        mockRequirements.push(newRequirement);
        localStorage.setItem('mock_requirements', JSON.stringify(mockRequirements));
        error = null;
      } else {
        // Real API call with proper authentication
        const result = await apiClient.createRequirement({
          purpose: formData.purpose,
          budget: {
            min: formData.budget.min ? parseInt(formData.budget.min) : undefined,
            max: formData.budget.max ? parseInt(formData.budget.max) : undefined,
            currency: formData.budget.currency
          },
          propertyType: formData.propertyType,
          location: {
            city: formData.location.city,
            state: formData.location.state,
            area: formData.location.area,
            pincode: formData.location.pincode
          },
          area: {
            min: formData.area.min ? parseInt(formData.area.min) : undefined,
            max: formData.area.max ? parseInt(formData.area.max) : undefined,
            unit: formData.area.unit
          },
          description: formData.description,
          preferences: formData.preferences,
          amenities: formData.amenities,
          contact: {
            phone: formData.contact.phone,
            email: formData.contact.email,
            preferredTime: formData.contact.preferredTime
          },
          priority: formData.priority,
          timeline: formData.timeline
        });
        
        error = result.error;
      }

      if (error) {
        console.error('Error during requirement creation:', error);
        throw error;
      }

      console.log('Requirement created successfully');
      
      toast({
        title: "Requirement Submitted Successfully!",
        description: "Your property requirement has been submitted. Our team will contact you soon.",
      });

      // Redirect to appropriate dashboard
      const dashboardPath = getRoleBasedDashboardPath(profile?.role || 'buyer');
      navigate(dashboardPath);

    } catch (error: any) {
      console.error('Error submitting requirement:', error);
      
      // Handle detailed validation errors from backend
      if (error?.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
        toast({
          title: "Validation Error",
          description: `Please fix the following issues: ${errorMessages}`,
          variant: "destructive",
        });
      } else if (error?.message) {
        toast({
          title: "Error submitting requirement",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error submitting requirement",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="animate-slide-in-down">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Submit Your Property Requirement
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto animate-fade-in-up" style={{animationDelay: '200ms'}}>
              Tell us what you're looking for and we'll help you find the perfect property.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-6xl">
          <Card className="animate-fade-in-up" style={{animationDelay: '400ms'}}>
            <CardHeader className="bg-gradient-to-r from-estate-blue to-estate-blue-light text-white">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Search className="w-6 h-6" />
                Property Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-estate-blue border-b border-estate-blue/20 pb-2">
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Purpose */}
                    <div>
                      <Label htmlFor="purpose" className="text-sm font-medium">Purpose *</Label>
                      <Select value={formData.purpose} onValueChange={(value) => setFormData({...formData, purpose: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Buy</SelectItem>
                          <SelectItem value="rent">Rent</SelectItem>
                          <SelectItem value="invest">Invest</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Property Type */}
                    <div>
                      <Label htmlFor="propertyType" className="text-sm font-medium">Property Type *</Label>
                      <Select value={formData.propertyType} onValueChange={(value) => setFormData({...formData, propertyType: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="plot">Plot</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="shop">Shop</SelectItem>
                          <SelectItem value="warehouse">Warehouse</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Budget Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-estate-blue border-b border-estate-blue/20 pb-2">
                    Budget Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="budgetMin" className="text-sm font-medium">Minimum Budget (₹)</Label>
                      <Input
                        id="budgetMin"
                        type="number"
                        placeholder="e.g., 5000000"
                        value={formData.budget.min}
                        onChange={(e) => setFormData({
                          ...formData, 
                          budget: {...formData.budget, min: e.target.value}
                        })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="budgetMax" className="text-sm font-medium">Maximum Budget (₹)</Label>
                      <Input
                        id="budgetMax"
                        type="number"
                        placeholder="e.g., 10000000"
                        value={formData.budget.max}
                        onChange={(e) => setFormData({
                          ...formData, 
                          budget: {...formData.budget, max: e.target.value}
                        })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
                      <Select value={formData.budget.currency} onValueChange={(value) => setFormData({
                        ...formData, 
                        budget: {...formData.budget, currency: value}
                      })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-estate-blue border-b border-estate-blue/20 pb-2">
                    Location Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">State & City *</Label>
                      <StateCitySelector
                        selectedState={formData.location.state}
                        selectedCity={formData.location.city}
                        onStateChange={handleStateChange}
                        onCityChange={handleCityChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="area" className="text-sm font-medium">Area/Locality</Label>
                      <Input
                        id="area"
                        placeholder="e.g., Bandra West"
                        value={formData.location.area}
                        onChange={(e) => setFormData({
                          ...formData, 
                          location: {...formData.location, area: e.target.value}
                        })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pincode" className="text-sm font-medium">Pincode</Label>
                      <Input
                        id="pincode"
                        placeholder="e.g., 400050"
                        value={formData.location.pincode}
                        onChange={(e) => setFormData({
                          ...formData, 
                          location: {...formData.location, pincode: e.target.value}
                        })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-estate-blue border-b border-estate-blue/20 pb-2">
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g., +91 9876543210"
                        value={formData.contact.phone}
                        onChange={(e) => setFormData({
                          ...formData, 
                          contact: {...formData.contact, phone: e.target.value}
                        })}
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="e.g., john@example.com"
                        value={formData.contact.email}
                        onChange={(e) => setFormData({
                          ...formData, 
                          contact: {...formData.contact, email: e.target.value}
                        })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-estate-blue border-b border-estate-blue/20 pb-2">
                    Additional Information
                  </h3>
                  
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">Detailed Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your requirements in detail... (e.g., specific amenities, preferred floor, facing, etc.)"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="timeline" className="text-sm font-medium">Timeline</Label>
                      <Select value={formData.timeline} onValueChange={(value) => setFormData({...formData, timeline: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="1_month">1 Month</SelectItem>
                          <SelectItem value="3_months">3 Months</SelectItem>
                          <SelectItem value="6_months">6 Months</SelectItem>
                          <SelectItem value="1_year">1 Year</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <Button 
                    type="submit" 
                    className="w-full bg-estate-blue hover:bg-estate-blue-dark text-white smooth-transition hover:scale-105 hover:shadow-lg" 
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Submitting Requirement...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Submit Requirement
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SubmitRequirement;