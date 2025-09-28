import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, HelpCircle, MessageCircle, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  tags: string[];
}

const FAQ = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "general", label: "General" },
    { value: "buyer", label: "For Buyers" },
    { value: "seller", label: "For Sellers" },
    { value: "broker", label: "For Brokers" },
    { value: "developer", label: "For Developers" },
    { value: "nri", label: "NRI Services" },
    { value: "investment", label: "Investment" }
  ];

  useEffect(() => {
    fetchFAQs();
  }, [searchTerm, selectedCategory]);

  const fetchFAQs = async () => {
    try {
      if (selectedCategory !== 'all') {
        // Apply category filter
        // This would be handled by the API client
      }

      if (searchTerm) {
        // Apply search filter
        // This would be handled by the API client
      }

      const result = await apiClient.getSupportTickets(); // Using existing API method as placeholder

      if (result.error) throw result.error;
      setFaqs(result.data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast({
        title: "Error",
        description: "Failed to load FAQs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSelectedCategory("all");
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchTerm === "" || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getFAQsByCategory = (category: string) => {
    return faqs.filter(faq => faq.category === category);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <HelpCircle className="h-16 w-16 text-white mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Get instant answers to common questions about buying, selling, and investing in real estate
            </p>

            {/* Quick Search */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {/* Search and Filter */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions, answers, or topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="flex gap-2">
                  {searchTerm || selectedCategory !== 'all' ? (
                    <Button variant="ghost" onClick={clearSearch}>
                      Clear Search
                    </Button>
                  ) : null}
                </div>
              </div>
              
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 mt-4">
                {categories.map((category) => (
                  <Badge
                    key={category.value}
                    variant={selectedCategory === category.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(category.value)}
                  >
                    {category.label} 
                    {category.value !== 'all' && (
                      <span className="ml-1">({getFAQsByCategory(category.value).length})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main FAQ Content */}
          <div className="lg:col-span-2">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
              <TabsList className="grid grid-cols-3 lg:grid-cols-4 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="buyer">Buyers</TabsTrigger>
                <TabsTrigger value="seller">Sellers</TabsTrigger>
                <TabsTrigger value="nri">NRI</TabsTrigger>
              </TabsList>

              <div className="space-y-6">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredFAQs.length > 0 ? (
                  <Card>
                    <CardContent className="p-6">
                      <Accordion type="single" collapsible className="space-y-2">
                        {filteredFAQs.map((faq, index) => (
                          <AccordionItem key={faq.id} value={`item-${index}`} className="border rounded-lg px-4">
                            <AccordionTrigger className="text-left hover:no-underline">
                              <div className="flex items-start gap-3">
                                <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <span className="font-medium">{faq.question}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-8 pb-4">
                              <div className="prose prose-sm max-w-none">
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                  {faq.answer}
                                </p>
                              </div>
                              
                              {faq.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {faq.tags.map((tag, tagIndex) => (
                                    <Badge key={tagIndex} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No FAQs Found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm 
                          ? `No questions match "${searchTerm}". Try different keywords or browse by category.`
                          : "No FAQs available for this category."
                        }
                      </p>
                      <Button variant="outline" onClick={clearSearch}>
                        Clear Search
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Categories */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Browse by Category</h3>
                <div className="space-y-2">
                  {categories.filter(c => c.value !== 'all').map((category) => {
                    const count = getFAQsByCategory(category.value).length;
                    return (
                      <Button
                        key={category.value}
                        variant={selectedCategory === category.value ? "default" : "ghost"}
                        className="w-full justify-between"
                        onClick={() => setSelectedCategory(category.value)}
                      >
                        <span>{category.label}</span>
                        <Badge variant="outline">{count}</Badge>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Still Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Live Chat
                  </Button>
                  
                  <Button className="w-full" variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Support
                  </Button>
                  
                  <Button className="w-full" variant="outline">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Us
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Popular Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {['platform', 'about', 'search', 'properties', 'listing', 'sell', 'commission', 'earnings', 'nri', 'investment', 'legal'].map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setSearchTerm(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;