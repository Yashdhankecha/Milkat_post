import { Facebook, MessageSquare } from "lucide-react";

const Footer = () => {

  return (
    <footer className="bg-estate-blue text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Footer Content */}
        <div className="text-center mb-8">
          <div className="text-2xl sm:text-3xl font-bold mb-4">
            Milkat<span className="text-estate-blue-lighter">Post</span>
          </div>
          <p className="text-estate-blue-lighter max-w-md mx-auto">
            Your trusted partner in real estate. Connecting buyers, sellers, and developers with the best properties and opportunities.
          </p>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-estate-blue-light pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-estate-blue-lighter">
            © 2024 MilkatPost. All rights reserved.
          </div>
          
          <div className="flex items-center gap-4">
            <a href="#" className="text-estate-blue-lighter hover:text-white transition-colors">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-estate-blue-lighter hover:text-white transition-colors">
              <MessageSquare className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;