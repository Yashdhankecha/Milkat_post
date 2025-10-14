import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  Users, 
  TrendingUp, 
  Shield,
  DollarSign,
  Award,
  Building,
  CheckCircle,
  FileText,
  UserCheck
} from "lucide-react";

const NRIBrokerRegistration = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      countryCode: '+91',
      currentCountry: '',
      nationality: '',
      alternatePhone: ''
    },
    professionalInfo: {
      experience: '',
      certifications: '',
      previousBrokerLicense: '',
      specializations: [] as string[],
      currentEmployment: '',
      annualIncome: ''
    },
    businessInfo: {
      businessName: '',
      businessType: '',
      licenseNumber: '',
      yearsInBusiness: '',
      teamSize: '',
      servicesOffered: [] as string[]
    },
    preferences: {
      targetMarkets: [] as string[],
      propertyTypes: [] as string[],
      commissionExpectation: '',
      availabilityHours: '',
      languagesSpoken: [] as string[]
    },
    documents: {
      identity: null as File | null,
      businessLicense: null as File | null,
      certifications: null as File | null,
      references: ''
    },
    agreements: {
      termsAccepted: false,
      privacyAccepted: false,
      marketingConsent: false
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const benefits = [
    {
      icon: DollarSign,
      title: "Attractive Commission Structure",
      description: "Earn up to 2.5% commission on successful transactions with performance bonuses"
    },
    {
      icon: Globe,
      title: "Global Network Access",
      description: "Connect with clients across 5 countries and access international property listings"
    },
    {
      icon: Users,
      title: "Dedicated Support Team",
      description: "24/7 support from our NRI services team and technical assistance"
    },
    {
      icon: TrendingUp,
      title: "Business Growth Tools",
      description: "Marketing materials, CRM access, and lead generation support"
    },
    {
      icon: Shield,
      title: "Legal & Compliance Support",
      description: "Full legal backing for international transactions and documentation"
    },
    {
      icon: Award,
      title: "Recognition & Rewards",
      description: "Annual awards, performance recognition, and exclusive broker events"
    }
  ];

  const specializations = [
    "Residential Properties", "Commercial Properties", "Luxury Real Estate", 
    "Investment Properties", "Rental Management", "Land Development",
    "Industrial Properties", "Agricultural Land", "NRI Investments"
  ];

  const services = [
    "Property Consultation", "Market Analysis", "Investment Advisory",
    "Documentation Support", "Legal Assistance", "Property Management",
    "Rental Services", "After-sales Support"
  ];

  const countries = [
    "India", "USA", "Canada", "UAE", "UK", "Australia", "Singapore", 
    "Saudi Arabia", "Qatar", "Kuwait", "Germany", "Netherlands"
  ];

  const propertyTypes = [
    "Residential Apartments", "Villas", "Plots/Land", "Commercial Offices",
    "Retail Spaces", "Warehouses", "Agricultural Land", "Industrial Units"
  ];

  const languages = [
    "English", "Hindi", "Tamil", "Telugu", "Marathi", "Gujarati",
    "Bengali", "Kannada", "Malayalam", "Punjabi", "Arabic", "French"
  ];

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleArrayToggle = (section: string, field: string, value: string) => {
    setFormData(prev => {
      const currentArray = (prev[section as keyof typeof prev] as any)[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [field]: newArray
        }
      };
    });
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Application Submitted Successfully!",
      description: "Thank you for registering as an NRI Broker. Our team will review your application and get back to you within 3-5 business days.",
    });
    
    // Reset form or redirect
    setLoading(false);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.personalInfo.fullName}
                  onChange={(e) => handleInputChange('personalInfo', 'fullName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.personalInfo.email}
                  onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="countryCode">Country Code</Label>
                <Select 
                  value={formData.personalInfo.countryCode} 
                  onValueChange={(value) => handleInputChange('personalInfo', 'countryCode', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">+91 (India)</SelectItem>
                    <SelectItem value="+1">+1 (USA/Canada)</SelectItem>
                    <SelectItem value="+971">+971 (UAE)</SelectItem>
                    <SelectItem value="+44">+44 (UK)</SelectItem>
                    <SelectItem value="+61">+61 (Australia)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.personalInfo.phone}
                  onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentCountry">Current Country of Residence *</Label>
                <Select 
                  value={formData.personalInfo.currentCountry} 
                  onValueChange={(value) => handleInputChange('personalInfo', 'currentCountry', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country} value={country.toLowerCase()}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nationality">Nationality *</Label>
                <Select 
                  value={formData.personalInfo.nationality} 
                  onValueChange={(value) => handleInputChange('personalInfo', 'nationality', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country} value={country.toLowerCase()}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Years of Real Estate Experience *</Label>
                <Select 
                  value={formData.professionalInfo.experience} 
                  onValueChange={(value) => handleInputChange('professionalInfo', 'experience', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1">0-1 years</SelectItem>
                    <SelectItem value="2-5">2-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currentEmployment">Current Employment Status</Label>
                <Select 
                  value={formData.professionalInfo.currentEmployment} 
                  onValueChange={(value) => handleInputChange('professionalInfo', 'currentEmployment', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed (Real Estate)</SelectItem>
                    <SelectItem value="self-employed">Self-Employed</SelectItem>
                    <SelectItem value="business-owner">Business Owner</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Area of Specialization *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {specializations.map(spec => (
                  <div key={spec} className="flex items-center space-x-2">
                    <Checkbox
                      id={spec}
                      checked={formData.professionalInfo.specializations.includes(spec)}
                      onCheckedChange={() => handleArrayToggle('professionalInfo', 'specializations', spec)}
                    />
                    <Label htmlFor={spec} className="text-sm">{spec}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="certifications">Professional Certifications</Label>
              <Textarea
                id="certifications"
                placeholder="List any real estate certifications, licenses, or qualifications you hold..."
                value={formData.professionalInfo.certifications}
                onChange={(e) => handleInputChange('professionalInfo', 'certifications', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Business/Company Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessInfo.businessName}
                  onChange={(e) => handleInputChange('businessInfo', 'businessName', e.target.value)}
                  placeholder="Your business name (if applicable)"
                />
              </div>
              <div>
                <Label htmlFor="businessType">Business Type</Label>
                <Select 
                  value={formData.businessInfo.businessType} 
                  onValueChange={(value) => handleInputChange('businessInfo', 'businessType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="llc">LLC</SelectItem>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="individual">Individual Broker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseNumber">Business License Number</Label>
                <Input
                  id="licenseNumber"
                  value={formData.businessInfo.licenseNumber}
                  onChange={(e) => handleInputChange('businessInfo', 'licenseNumber', e.target.value)}
                  placeholder="Enter license number"
                />
              </div>
              <div>
                <Label htmlFor="teamSize">Team Size</Label>
                <Select 
                  value={formData.businessInfo.teamSize} 
                  onValueChange={(value) => handleInputChange('businessInfo', 'teamSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Just Me</SelectItem>
                    <SelectItem value="2-5">2-5 People</SelectItem>
                    <SelectItem value="6-10">6-10 People</SelectItem>
                    <SelectItem value="11+">11+ People</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Services You Offer *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {services.map(service => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={formData.businessInfo.servicesOffered.includes(service)}
                      onCheckedChange={() => handleArrayToggle('businessInfo', 'servicesOffered', service)}
                    />
                    <Label htmlFor={service} className="text-sm">{service}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Preferences & Documents</h3>
            
            <div>
              <Label>Target Markets *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {countries.slice(0, 8).map(country => (
                  <div key={country} className="flex items-center space-x-2">
                    <Checkbox
                      id={`market-${country}`}
                      checked={formData.preferences.targetMarkets.includes(country)}
                      onCheckedChange={() => handleArrayToggle('preferences', 'targetMarkets', country)}
                    />
                    <Label htmlFor={`market-${country}`} className="text-sm">{country}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Property Types of Interest</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {propertyTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`property-${type}`}
                      checked={formData.preferences.propertyTypes.includes(type)}
                      onCheckedChange={() => handleArrayToggle('preferences', 'propertyTypes', type)}
                    />
                    <Label htmlFor={`property-${type}`} className="text-sm">{type}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="commissionExpectation">Expected Commission Rate</Label>
                <Select 
                  value={formData.preferences.commissionExpectation} 
                  onValueChange={(value) => handleInputChange('preferences', 'commissionExpectation', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select commission rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-1.5">1-1.5%</SelectItem>
                    <SelectItem value="1.5-2">1.5-2%</SelectItem>
                    <SelectItem value="2-2.5">2-2.5%</SelectItem>
                    <SelectItem value="negotiable">Negotiable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="availabilityHours">Availability Hours</Label>
                <Select 
                  value={formData.preferences.availabilityHours} 
                  onValueChange={(value) => handleInputChange('preferences', 'availabilityHours', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="part-time">Part-time (20-30 hrs/week)</SelectItem>
                    <SelectItem value="full-time">Full-time (40+ hrs/week)</SelectItem>
                    <SelectItem value="flexible">Flexible Hours</SelectItem>
                    <SelectItem value="weekends">Weekends Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Documents & Agreements</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="identity">Identity Document (Passport/ID) *</Label>
                <Input
                  id="identity"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('identity', e.target.files?.[0] || null)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="businessLicense">Business License (if applicable)</Label>
                <Input
                  id="businessLicense"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('businessLicense', e.target.files?.[0] || null)}
                />
              </div>
              
              <div>
                <Label htmlFor="certifications">Professional Certifications</Label>
                <Input
                  id="certifications"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('certifications', e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <Label htmlFor="references">Professional References</Label>
                <Textarea
                  id="references"
                  placeholder="Provide contact details of 2-3 professional references..."
                  value={formData.documents.references}
                  onChange={(e) => handleInputChange('documents', 'references', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreements.termsAccepted}
                  onCheckedChange={(checked) => 
                    handleInputChange('agreements', 'termsAccepted', checked)
                  }
                  required
                />
                <Label htmlFor="terms" className="text-sm">
                  I accept the <span className="text-estate-blue cursor-pointer">Terms and Conditions</span> and 
                  <span className="text-estate-blue cursor-pointer"> Broker Agreement</span> *
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="privacy"
                  checked={formData.agreements.privacyAccepted}
                  onCheckedChange={(checked) => 
                    handleInputChange('agreements', 'privacyAccepted', checked)
                  }
                  required
                />
                <Label htmlFor="privacy" className="text-sm">
                  I accept the <span className="text-estate-blue cursor-pointer">Privacy Policy</span> *
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="marketing"
                  checked={formData.agreements.marketingConsent}
                  onCheckedChange={(checked) => 
                    handleInputChange('agreements', 'marketingConsent', checked)
                  }
                />
                <Label htmlFor="marketing" className="text-sm">
                  I consent to receiving marketing communications and updates
                </Label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Become an NRI Broker Partner
          </h1>
          <p className="text-xl text-estate-blue-lighter max-w-3xl mx-auto">
            Join our global network of trusted real estate professionals and help NRIs find their perfect property investments. 
            Expand your business across 5 countries with our support.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {/* Benefits Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Partner With Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-estate-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-8 h-8 text-estate-blue" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Registration Form */}
        <section className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
                <UserCheck className="w-6 h-6" />
                NRI Broker Registration
              </CardTitle>
              
              {/* Progress Indicator */}
              <div className="flex justify-center mt-6">
                <div className="flex items-center space-x-2">
                  {Array.from({ length: totalSteps }, (_, index) => (
                    <div key={index} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep > index + 1 
                          ? 'bg-estate-success text-white' 
                          : currentStep === index + 1 
                            ? 'bg-estate-blue text-white' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {currentStep > index + 1 ? <CheckCircle className="w-4 h-4" /> : index + 1}
                      </div>
                      {index < totalSteps - 1 && (
                        <div className={`w-8 h-0.5 ${
                          currentStep > index + 1 ? 'bg-estate-success' : 'bg-muted'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Step {currentStep} of {totalSteps}
                </p>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit}>
                {renderStepContent()}
                
                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>
                  
                  {currentStep === totalSteps ? (
                    <Button
                      type="submit"
                      disabled={loading || !formData.agreements.termsAccepted || !formData.agreements.privacyAccepted}
                    >
                      {loading ? "Submitting..." : "Submit Application"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={nextStep}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Contact Information */}
        <section className="mt-16 text-center">
          <Card className="bg-estate-blue text-white max-w-2xl mx-auto">
            <CardContent className="p-8">
              <Building className="w-12 h-12 mx-auto mb-4 text-white/90" />
              <h3 className="text-xl font-semibold mb-4">Need Help with Registration?</h3>
              <p className="text-white/90 mb-6">
                Our broker partnership team is here to assist you with the registration process 
                and answer any questions you may have.
              </p>
              <div className="space-y-2">
                <p><strong>Email:</strong> brokers@milkatpost.com</p>
                <p><strong>Phone:</strong> +91 22 4567 8900</p>
                <p><strong>Hours:</strong> Mon-Fri 9:00 AM - 7:00 PM IST</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default NRIBrokerRegistration;