import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  MapPin, 
  Clock, 
  Briefcase,
  DollarSign,
  GraduationCap,
  Building,
  Globe
} from "lucide-react";

const Careers = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    location: '',
    resume: null as File | null,
    coverLetter: ''
  });

  const openPositions = [
    {
      id: 1,
      title: "Senior Real Estate Consultant",
      department: "Sales",
      location: "Mumbai, India",
      type: "Full-time",
      experience: "3-5 years",
      salary: "₹8-15 LPA",
      description: "Lead property consultations, manage client relationships, and drive sales in the luxury real estate segment.",
      requirements: ["Bachelor's degree", "3+ years real estate experience", "Excellent communication skills", "Knowledge of Mumbai market"]
    },
    {
      id: 2,
      title: "NRI Services Manager",
      department: "NRI Services",
      location: "Dubai, UAE",
      type: "Full-time",
      experience: "4-6 years",
      salary: "AED 120-180k",
      description: "Manage NRI property investments, handle documentation, and provide end-to-end support for overseas clients.",
      requirements: ["Bachelor's degree", "4+ years NRI services experience", "Legal documentation knowledge", "Multi-lingual preferred"]
    },
    {
      id: 3,
      title: "Property Research Analyst",
      department: "Research",
      location: "Bangalore, India",
      type: "Full-time",
      experience: "2-4 years",
      salary: "₹6-12 LPA",
      description: "Analyze market trends, prepare investment reports, and provide data-driven insights for property investments.",
      requirements: ["MBA/Masters in relevant field", "2+ years market research experience", "Advanced Excel/Analytics skills", "Real estate knowledge"]
    },
    {
      id: 4,
      title: "Digital Marketing Specialist",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      experience: "2-3 years",
      salary: "$50-70k",
      description: "Drive digital marketing campaigns, manage social media presence, and optimize online lead generation.",
      requirements: ["Bachelor's in Marketing/Digital", "2+ years digital marketing experience", "SEO/SEM expertise", "Real estate marketing preferred"]
    },
    {
      id: 5,
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Toronto, Canada",
      type: "Full-time",
      experience: "3-5 years",
      salary: "CAD 60-85k",
      description: "Ensure client satisfaction, manage onboarding processes, and drive customer retention and growth.",
      requirements: ["Bachelor's degree", "3+ years customer success experience", "Excellent communication skills", "CRM experience"]
    },
    {
      id: 6,
      title: "Legal Counsel - Real Estate",
      department: "Legal",
      location: "New York, USA",
      type: "Full-time",
      experience: "5-8 years",
      salary: "$120-180k",
      description: "Handle property transactions, review contracts, ensure compliance, and provide legal guidance on real estate matters.",
      requirements: ["JD from accredited law school", "5+ years real estate law experience", "Bar admission", "International law knowledge preferred"]
    }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "Competitive Compensation",
      description: "Industry-leading salaries with performance bonuses and equity options"
    },
    {
      icon: GraduationCap,
      title: "Learning & Development",
      description: "Continuous learning opportunities, certifications, and conference attendance"
    },
    {
      icon: Globe,
      title: "Global Opportunities",
      description: "Work across 5 countries with opportunities for international assignments"
    },
    {
      icon: Users,
      title: "Team Culture",
      description: "Collaborative, diverse, and inclusive work environment with team events"
    },
    {
      icon: Building,
      title: "Modern Workspaces",
      description: "State-of-the-art offices in prime locations with flexible work arrangements"
    },
    {
      icon: Clock,
      title: "Work-Life Balance",
      description: "Flexible schedules, remote work options, and generous vacation policies"
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        resume: file
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Application Submitted!",
      description: "Thank you for your interest. Our HR team will review your application and get back to you within 5-7 business days.",
    });
    
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      position: '',
      experience: '',
      location: '',
      resume: null,
      coverLetter: ''
    });
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Join Our Global Team
          </h1>
          <p className="text-xl text-estate-blue-lighter max-w-3xl mx-auto">
            Build your career with MilkatPost and help shape the future of real estate across 5 countries. 
            We're looking for passionate professionals to join our growing team.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {/* Company Stats */}
        <section className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-estate-blue mb-2">200+</div>
              <div className="text-muted-foreground">Team Members</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-estate-blue mb-2">5</div>
              <div className="text-muted-foreground">Countries</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-estate-blue mb-2">15+</div>
              <div className="text-muted-foreground">Years Growth</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-estate-blue mb-2">95%</div>
              <div className="text-muted-foreground">Employee Satisfaction</div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Work With Us</h2>
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

        {/* Open Positions */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Open Positions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {openPositions.map((position) => (
              <Card key={position.id} className="hover:shadow-medium transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-xl mb-2">{position.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{position.department}</Badge>
                        <Badge variant="secondary">{position.type}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-estate-blue">{position.salary}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{position.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-1" />
                        <span>{position.experience}</span>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground">{position.description}</p>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Requirements:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {position.requirements.map((req, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-1 h-1 bg-estate-blue rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Button className="w-full" onClick={() => {
                      setFormData(prev => ({ ...prev, position: position.title }));
                      document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}>
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Application Form */}
        <section id="application-form" className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Submit Your Application</CardTitle>
              <p className="text-center text-muted-foreground">
                Ready to join our team? Fill out the form below and we'll get back to you soon.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
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
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position Applied For *</Label>
                    <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {openPositions.map((position) => (
                          <SelectItem key={position.id} value={position.title}>
                            {position.title}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experience">Years of Experience *</Label>
                    <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1 years</SelectItem>
                        <SelectItem value="2-3">2-3 years</SelectItem>
                        <SelectItem value="4-5">4-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Preferred Location *</Label>
                    <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mumbai">Mumbai, India</SelectItem>
                        <SelectItem value="bangalore">Bangalore, India</SelectItem>
                        <SelectItem value="delhi">Delhi, India</SelectItem>
                        <SelectItem value="dubai">Dubai, UAE</SelectItem>
                        <SelectItem value="newyork">New York, USA</SelectItem>
                        <SelectItem value="toronto">Toronto, Canada</SelectItem>
                        <SelectItem value="nairobi">Nairobi, Kenya</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="resume">Resume/CV *</Label>
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepted formats: PDF, DOC, DOCX (Max 5MB)
                  </p>
                </div>

                <div>
                  <Label htmlFor="coverLetter">Cover Letter</Label>
                  <Textarea
                    id="coverLetter"
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                    rows={5}
                    value={formData.coverLetter}
                    onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? "Submitting Application..." : "Submit Application"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Careers;