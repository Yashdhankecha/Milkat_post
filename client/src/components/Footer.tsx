import { MapPin, Phone, Mail, Facebook, MessageSquare } from "lucide-react";

const Footer = () => {
  const offices = [
    { city: "New York", phone: "+1 (555) 123-4567", email: "newyork@milkatpost.com" },
    { city: "London", phone: "+44 20 7123 4567", email: "london@milkatpost.com" },
    { city: "Mumbai", phone: "+91 22 4567 8900", email: "mumbai@milkatpost.com" }
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
      <div className="container mx-auto px-4 py-5">
        
       

   
        {/* Bottom Section */}
        <div className="border-t border-estate-blue-light pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="text-2xl font-bold mb-2">
              Milkat<span className="text-estate-blue-lighter">Post</span>
            </div>
            <p className="text-sm text-estate-blue-lighter">
              © 2024 MilkatPost. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
           
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;