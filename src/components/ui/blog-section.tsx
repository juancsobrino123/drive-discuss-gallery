import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, MessageSquare, Heart, Share } from "lucide-react";

const BlogSection = () => {
  const posts = [
    {
      title: "The Future of Electric Supercars: Performance vs. Sustainability",
      excerpt: "Exploring how electric powertrains are reshaping the supercar landscape and what it means for automotive enthusiasts...",
      author: "AUTODEBATE Team",
      date: "2 days ago",
      comments: 23,
      likes: 156,
      category: "Electric Vehicles",
      featured: true
    },
    {
      title: "JDM Culture: Why Japanese Performance Cars Still Dominate",
      excerpt: "From the Skyline GT-R to the Supra, we dive deep into what makes JDM cars so special and their lasting impact...",
      author: "Mike Chen",
      date: "5 days ago",
      comments: 45,
      likes: 289,
      category: "JDM"
    },
    {
      title: "Track Day Essentials: What Every Beginner Needs to Know",
      excerpt: "Your first track day can be intimidating. Here's our complete guide to preparation, safety, and maximizing your experience...",
      author: "Sarah Rodriguez",
      date: "1 week ago",
      comments: 31,
      likes: 198,
      category: "Track Racing"
    },
    {
      title: "Restoration vs Modification: Finding the Perfect Balance",
      excerpt: "When working on classic cars, where do you draw the line between preserving history and improving performance?",
      author: "AUTODEBATE Team",
      date: "1 week ago",
      comments: 67,
      likes: 345,
      category: "Restoration"
    }
  ];

  const categories = [
    "Electric Vehicles",
    "JDM",
    "Track Racing",
    "Restoration",
    "Supercars",
    "Tuning",
    "Reviews"
  ];

  return (
    <section id="blog" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Automotive Insights & Discussions
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Deep dives into automotive culture, technical analysis, and community discussions. Join the conversation about everything cars.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {posts.map((post, index) => (
              <Card 
                key={post.title}
                className={`p-6 hover:shadow-royal transition-all duration-300 bg-gradient-card ${
                  post.featured ? 'ring-2 ring-primary/20' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                      {post.featured && (
                        <span className="bg-gradient-royal text-primary-foreground text-xs px-3 py-1 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>

                    <h3 className={`font-bold text-foreground mb-3 hover:text-primary transition-colors cursor-pointer ${
                      post.featured ? 'text-xl md:text-2xl' : 'text-lg'
                    }`}>
                      {post.title}
                    </h3>

                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{post.author}</span>
                        <span>•</span>
                        <span>{post.date}</span>
                      </div>

                      <Button variant="ghost" size="sm" className="group">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">{post.comments}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                        <Share className="w-4 h-4" />
                        <span className="text-sm">Share</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <div className="text-center">
              <Button variant="royal" size="lg">
                Load More Articles
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Categories */}
            <Card className="p-6 bg-gradient-card">
              <h3 className="text-xl font-bold text-foreground mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    className="block w-full text-left py-2 px-3 rounded-md text-muted-foreground hover:bg-primary-light hover:text-primary transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </Card>

            {/* Community Stats */}
            <Card className="p-6 bg-gradient-card">
              <h3 className="text-xl font-bold text-foreground mb-4">Community</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Posts</span>
                  <span className="font-semibold text-foreground">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Members</span>
                  <span className="font-semibold text-foreground">15,623</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">This Week</span>
                  <span className="font-semibold text-foreground">89 new posts</span>
                </div>
              </div>
              <Button variant="hero" className="w-full mt-4">
                Join Discussion
              </Button>
            </Card>

            {/* Newsletter */}
            <Card className="p-6 bg-gradient-royal text-primary-foreground">
              <h3 className="text-xl font-bold mb-4">Stay Updated</h3>
              <p className="mb-4 opacity-90">
                Get the latest automotive insights delivered to your inbox.
              </p>
              <div className="space-y-3">
                <input 
                  type="email"
                  placeholder="Your email"
                  className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 placeholder-white/70 text-white focus:ring-2 focus:ring-white/30 focus:border-transparent outline-none"
                />
                <Button variant="platform" className="w-full bg-white text-primary hover:bg-white/90">
                  Subscribe
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;