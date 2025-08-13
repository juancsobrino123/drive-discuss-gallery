import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, MessageSquare, Heart, Share } from "lucide-react";
import { useTranslation } from "react-i18next";
import { blogPosts as posts, blogCategories as categories } from "@/content/blog";

const BlogSection = () => {
  const { t } = useTranslation();

  return (
    <section id="blog" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t('blog.heading')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('blog.subheading')}
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
                          {t('blog.featured')}
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
                        {t('blog.readMore')}
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
                        <span className="text-sm">{t('blog.share')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <div className="text-center">
              <Button variant="royal" size="lg">
                {t('blog.loadMore')}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Categories */}
            <Card className="p-6 bg-gradient-card">
              <h3 className="text-xl font-bold text-foreground mb-4">{t('blog.categories')}</h3>
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
              <h3 className="text-xl font-bold text-foreground mb-4">{t('blog.community')}</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('blog.totalPosts')}</span>
                  <span className="font-semibold text-foreground">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('blog.activeMembers')}</span>
                  <span className="font-semibold text-foreground">15,623</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('blog.thisWeek')}</span>
                  <span className="font-semibold text-foreground">{t('blog.newPosts', { count: 89 })}</span>
                </div>
              </div>
              <Button variant="hero" className="w-full mt-4">
                {t('blog.joinDiscussion')}
              </Button>
            </Card>

            {/* Newsletter */}
            <Card className="p-6 bg-gradient-royal text-primary-foreground">
              <h3 className="text-xl font-bold mb-4">{t('blog.stayUpdated')}</h3>
              <p className="mb-4 opacity-90">
                {t('blog.newsletterDesc')}
              </p>
              <div className="space-y-3">
                <input 
                  type="email"
                  placeholder={t('blog.yourEmail')}
                  className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 placeholder-white/70 text-white focus:ring-2 focus:ring-white/30 focus:border-transparent outline-none"
                />
                <Button variant="platform" className="w-full bg-white text-primary hover:bg-white/90">
                  {t('blog.subscribe')}
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