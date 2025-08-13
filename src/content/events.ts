export type UpcomingEvent = {
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  attendees: string;
  description: string;
  status: 'hosting' | 'covering' | 'attending' | string;
  featured?: boolean;
};

export type PastEvent = {
  title: string;
  date: string;
  location: string;
  coverage: string;
  photos: number;
  videos: number;
};

export const upcomingEvents: UpcomingEvent[] = [
  {
    title: "Formula 1 Monaco Grand Prix",
    date: "May 24-26, 2024",
    time: "All Day",
    location: "Monte Carlo, Monaco",
    type: "Coverage",
    attendees: "Expected 200K+",
    description:
      "Live coverage and behind-the-scenes content from the most prestigious race in Formula 1.",
    status: "covering",
    featured: true,
  },
  {
    title: "AUTODEBATE Live Stream",
    date: "March 15, 2024",
    time: "8:00 PM EST",
    location: "Online - Kick/YouTube",
    type: "Live Stream",
    attendees: "Join us live",
    description:
      "Weekly automotive debate covering the latest industry news and hot topics.",
    status: "hosting",
  },
  {
    title: "Cars & Coffee Los Angeles",
    date: "March 10, 2024",
    time: "7:00 AM - 11:00 AM",
    location: "Santa Monica, CA",
    type: "Meetup",
    attendees: "500+ expected",
    description:
      "Monthly gathering of automotive enthusiasts. AUTODEBATE will be there with cameras!",
    status: "attending",
  },
  {
    title: "SEMA Show 2024",
    date: "November 5-8, 2024",
    time: "All Day",
    location: "Las Vegas Convention Center",
    type: "Trade Show",
    attendees: "160K+ industry professionals",
    description:
      "The premier automotive specialty products trade event. Full coverage planned.",
    status: "covering",
  },
];

export const pastEvents: PastEvent[] = [
  {
    title: "Tokyo Auto Salon 2024",
    date: "January 12-14, 2024",
    location: "Makuhari Messe, Tokyo",
    coverage: "Complete",
    photos: 156,
    videos: 12,
  },
  {
    title: "Barrett-Jackson Scottsdale",
    date: "January 20-28, 2024",
    location: "Scottsdale, AZ",
    coverage: "Highlights",
    photos: 89,
    videos: 8,
  },
];
