import { MapPin, Phone, Mail, Facebook, MessageSquare } from "lucide-react";

const Footer = () => {
  const offices = [
    {
      region: "North America",
      locations: [
        { city: "New York", phone: "+1 (555) 123-4567", email: "newyork@realestatepro.com" },
        { city: "Los Angeles", phone: "+1 (555) 234-5678", email: "losangeles@realestatepro.com" },
        { city: "Chicago", phone: "+1 (555) 345-6789", email: "chicago@realestatepro.com" }
      ]
    },
    {
      region: "Europe",
      locations: [
        { city: "London", phone: "+44 20 7123 4567", email: "london@realestatepro.com" },
        { city: "Paris", phone: "+33 1 23 45 67 89", email: "paris@realestatepro.com" }
      ]
    },
    {
      region: "Asia Pacific",
      locations: [
        { city: "Sydney", phone: "+61 2 1234 5678", email: "sydney@realestatepro.com" },
        { city: "Singapore", phone: "+65 6123 4567", email: "singapore@realestatepro.com" }
      ]
    }
  ];

  const services = [
    "Legal Advisory",
    "Interior Design",
    "Architecture Consultation",
    "Property Valuation",
    "Investment Planning",
    "Mortgage Assistance"
  ];

  const quickLinks = [
    "Property Search",
    "Buyer's Guide",
    "Seller's Guide",
    "Investment Opportunities",
    "Market Reports",
    "FAQ"
  ];

  return (
    <footer className="bg-estate-blue text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        {/* Office Locations */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6">Our Global Offices</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {offices.map((office, index) => (
              <div key={index}>
                <h4 className="font-semibold text-lg mb-4 text-estate-blue-lighter">{office.region}</h4>
                <div className="space-y-3">
                  {office.locations.map((location, locIndex) => (
                    <div key={locIndex} className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">{location.city}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1 text-estate-blue-lighter">
                        <Phone className="h-3 w-3" />
                        <span>{location.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-estate-blue-lighter">
                        <Mail className="h-3 w-3" />
                        <span>{location.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="font-semibold text-lg mb-4">Services</h4>
            <ul className="space-y-2 text-estate-blue-lighter">
              {services.map((service, index) => (
                <li key={index}>
                  <a href="#" className="hover:text-white transition-colors text-sm">
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-estate-blue-lighter">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a href="#" className="hover:text-white transition-colors text-sm">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Resources</h4>
            <ul className="space-y-2 text-estate-blue-lighter">
              <li><a href="#" className="hover:text-white transition-colors text-sm">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">Market Insights</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">Property Calculator</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">Investment Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Legal</h4>
            <ul className="space-y-2 text-estate-blue-lighter">
              <li><a href="#" className="hover:text-white transition-colors text-sm">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">Disclaimers</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">Regulatory Info</a></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-estate-blue-light pt-8 mb-8">
          <div className="bg-estate-blue-light/10 rounded-lg p-4">
            <h5 className="font-semibold mb-2">Important Disclaimer</h5>
            <p className="text-sm text-estate-blue-lighter leading-relaxed">
              RealEstatePro acts as an intermediary platform connecting property buyers, sellers, and renters. 
              We do not own, develop, or manage properties directly. All property information is provided by 
              third parties and should be independently verified. We are not responsible for the accuracy of 
              listings or the outcomes of transactions between parties.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-estate-blue-light pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="text-2xl font-bold mb-2">
              RealEstate<span className="text-estate-blue-lighter">Pro</span>
            </div>
            <p className="text-sm text-estate-blue-lighter">
              © 2024 RealEstatePro. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-estate-blue-lighter transition-colors">
              <MessageSquare className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-estate-blue-lighter transition-colors">
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;