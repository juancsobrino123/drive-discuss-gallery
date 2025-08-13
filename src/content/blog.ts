export type BlogPost = {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  comments: number;
  likes: number;
  category: string;
  featured?: boolean;
};

export const blogPosts: BlogPost[] = [
  {
    title: "The Future of Electric Supercars: Performance vs. Sustainability",
    excerpt:
      "Exploring how electric powertrains are reshaping the supercar landscape and what it means for automotive enthusiasts...",
    author: "AUTODEBATE Team",
    date: "2 days ago",
    comments: 23,
    likes: 156,
    category: "Electric Vehicles",
    featured: true,
  },
  {
    title: "JDM Culture: Why Japanese Performance Cars Still Dominate",
    excerpt:
      "From the Skyline GT-R to the Supra, we dive deep into what makes JDM cars so special and their lasting impact...",
    author: "Mike Chen",
    date: "5 days ago",
    comments: 45,
    likes: 289,
    category: "JDM",
  },
  {
    title: "Track Day Essentials: What Every Beginner Needs to Know",
    excerpt:
      "Your first track day can be intimidating. Here's our complete guide to preparation, safety, and maximizing your experience...",
    author: "Sarah Rodriguez",
    date: "1 week ago",
    comments: 31,
    likes: 198,
    category: "Track Racing",
  },
  {
    title: "Restoration vs Modification: Finding the Perfect Balance",
    excerpt:
      "When working on classic cars, where do you draw the line between preserving history and improving performance?",
    author: "AUTODEBATE Team",
    date: "1 week ago",
    comments: 67,
    likes: 345,
    category: "Restoration",
  },
];

export const blogCategories: string[] = [
  "Electric Vehicles",
  "JDM",
  "Track Racing",
  "Restoration",
  "Supercars",
  "Tuning",
  "Reviews",
];
