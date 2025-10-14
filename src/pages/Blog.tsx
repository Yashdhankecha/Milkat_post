import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight } from "lucide-react";

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "Top 10 Real Estate Investment Tips for 2024",
      excerpt: "Discover the latest strategies for maximizing your real estate investments in today's market. From location analysis to market timing, learn the essential tips every investor should know.",
      category: "Investment",
      author: "Rajesh Kumar",
      date: "March 15, 2024",
      readTime: "5 min read",
      image: "/api/placeholder/400/250"
    },
    {
      id: 2,
      title: "NRI Property Investment: Complete Guide",
      excerpt: "Everything Non-Resident Indians need to know about investing in Indian real estate. Legal requirements, tax implications, and best practices for overseas investors.",
      category: "NRI Guide",
      author: "Priya Sharma",
      date: "March 12, 2024",
      readTime: "8 min read",
      image: "/api/placeholder/400/250"
    },
    {
      id: 3,
      title: "Mumbai Real Estate Market Trends 2024",
      excerpt: "An in-depth analysis of Mumbai's property market, including price trends, upcoming projects, and investment hotspots. What buyers and investors need to know.",
      category: "Market Analysis",
      author: "Amit Patel",
      date: "March 10, 2024",
      readTime: "6 min read",
      image: "/api/placeholder/400/250"
    },
    {
      id: 4,
      title: "First-Time Home Buyer's Checklist",
      excerpt: "A comprehensive checklist for first-time home buyers. From budgeting and loan approval to property inspection and legal documentation.",
      category: "Buying Guide",
      author: "Sneha Verma",
      date: "March 8, 2024",
      readTime: "7 min read",
      image: "/api/placeholder/400/250"
    },
    {
      id: 5,
      title: "Commercial Real Estate: Opportunities in Tier 2 Cities",
      excerpt: "Exploring the growing commercial real estate opportunities in India's tier 2 cities. Market potential, rental yields, and investment prospects.",
      category: "Commercial",
      author: "Vikram Singh",
      date: "March 5, 2024",
      readTime: "6 min read",
      image: "/api/placeholder/400/250"
    },
    {
      id: 6,
      title: "Sustainable Housing: Green Building Trends",
      excerpt: "The rise of eco-friendly and sustainable housing solutions. Green building certifications, energy efficiency, and their impact on property values.",
      category: "Sustainability",
      author: "Dr. Meera Joshi",
      date: "March 3, 2024",
      readTime: "5 min read",
      image: "/api/placeholder/400/250"
    }
  ];

  const categories = ["All", "Investment", "NRI Guide", "Market Analysis", "Buying Guide", "Commercial", "Sustainability"];
  const featuredPost = blogPosts[0];
  const regularPosts = blogPosts.slice(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-hero py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Real Estate Blog
          </h1>
          <p className="text-xl text-white/90 text-center max-w-2xl mx-auto">
            Stay updated with the latest real estate news, market insights, 
            investment tips, and industry trends.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {/* Featured Post */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Featured Article</h2>
          <Card className="overflow-hidden shadow-medium hover:shadow-strong transition-shadow">
            <div className="md:flex">
              <div className="md:w-1/2">
                <div className="h-64 md:h-full bg-gradient-card flex items-center justify-center">
                  <div className="text-6xl text-estate-gray">📰</div>
                </div>
              </div>
              <div className="md:w-1/2">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{featuredPost.category}</Badge>
                    <span className="text-sm text-muted-foreground">{featuredPost.readTime}</span>
                  </div>
                  <h3 className="text-2xl font-bold">{featuredPost.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>{featuredPost.author}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{featuredPost.date}</span>
                      </div>
                    </div>
                    <Button>
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </section>

        {/* Regular Posts */}
        <section>
          <h2 className="text-3xl font-bold mb-8">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-medium transition-shadow cursor-pointer group">
                <div className="h-48 bg-gradient-card flex items-center justify-center">
                  <div className="text-4xl text-estate-gray">📝</div>
                </div>
                
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{post.category}</Badge>
                    <span className="text-sm text-muted-foreground">{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-semibold group-hover:text-estate-blue transition-colors">
                    {post.title}
                  </h3>
                </CardHeader>
                
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{post.date}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="mt-16 py-16 bg-gradient-primary rounded-2xl text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-white mb-4">
              Stay Updated with Real Estate Insights
            </h2>
            <p className="text-white/90 mb-8">
              Subscribe to our newsletter for the latest market trends, investment tips, 
              and exclusive property opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <Button variant="secondary" className="whitespace-nowrap">
                Subscribe Now
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Blog;