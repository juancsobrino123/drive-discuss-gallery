import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Clock, Users, ExternalLink } from "lucide-react";

const EventsSection = () => {
  const upcomingEvents = [
    {
      title: "Formula 1 Monaco Grand Prix",
      date: "May 24-26, 2024",
      time: "All Day",
      location: "Monte Carlo, Monaco",
      type: "Coverage",
      attendees: "Expected 200K+",
      description: "Live coverage and behind-the-scenes content from the most prestigious race in Formula 1.",
      status: "covering",
      featured: true
    },
    {
      title: "AUTODEBATE Live Stream",
      date: "March 15, 2024",
      time: "8:00 PM EST",
      location: "Online - Kick/YouTube",
      type: "Live Stream",
      attendees: "Join us live",
      description: "Weekly automotive debate covering the latest industry news and hot topics.",
      status: "hosting"
    },
    {
      title: "Cars & Coffee Los Angeles",
      date: "March 10, 2024",
      time: "7:00 AM - 11:00 AM",
      location: "Santa Monica, CA",
      type: "Meetup",
      attendees: "500+ expected",
      description: "Monthly gathering of automotive enthusiasts. AUTODEBATE will be there with cameras!",
      status: "attending"
    },
    {
      title: "SEMA Show 2024",
      date: "November 5-8, 2024",
      time: "All Day",
      location: "Las Vegas Convention Center",
      type: "Trade Show",
      attendees: "160K+ industry professionals",
      description: "The premier automotive specialty products trade event. Full coverage planned.",
      status: "covering"
    }
  ];

  const pastEvents = [
    {
      title: "Tokyo Auto Salon 2024",
      date: "January 12-14, 2024",
      location: "Makuhari Messe, Tokyo",
      coverage: "Complete",
      photos: 156,
      videos: 12
    },
    {
      title: "Barrett-Jackson Scottsdale",
      date: "January 20-28, 2024",
      location: "Scottsdale, AZ",
      coverage: "Highlights",
      photos: 89,
      videos: 8
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hosting': return 'bg-primary text-primary-foreground';
      case 'covering': return 'bg-green-500 text-white';
      case 'attending': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <section id="events" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Automotive Events Calendar
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stay updated with upcoming automotive events, our live streams, and meetups. Never miss a moment of automotive excellence.
          </p>
        </div>

        {/* Upcoming Events */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-foreground mb-8 flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-primary" />
            Upcoming Events
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingEvents.map((event, index) => (
              <Card 
                key={event.title}
                className={`p-6 hover:shadow-royal transition-all duration-300 transform hover:-translate-y-1 bg-gradient-card ${
                  event.featured ? 'lg:col-span-2 ring-2 ring-primary/20' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(event.status)}`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">
                      {event.type}
                    </span>
                  </div>
                  {event.featured && (
                    <span className="bg-gradient-royal text-primary-foreground text-xs px-3 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                </div>

                <h4 className={`font-bold text-foreground mb-3 ${event.featured ? 'text-xl md:text-2xl' : 'text-lg'}`}>
                  {event.title}
                </h4>

                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {event.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                    {event.date}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2 text-primary" />
                    {event.time}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    {event.location}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-2 text-primary" />
                    {event.attendees}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="hero" size="sm" className="flex-1">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Learn More
                  </Button>
                  <Button variant="platform" size="sm" className="flex-1">
                    Add to Calendar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Past Events */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-foreground mb-8 flex items-center">
            <Clock className="w-6 h-6 mr-3 text-primary" />
            Recent Coverage
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pastEvents.map((event, index) => (
              <Card key={event.title} className="p-6 bg-gradient-card hover:shadow-card transition-all duration-300">
                <h4 className="text-lg font-bold text-foreground mb-3">{event.title}</h4>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                    {event.date}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    {event.location}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-primary">{event.photos}</div>
                      <div className="text-xs text-muted-foreground">Photos</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{event.videos}</div>
                      <div className="text-xs text-muted-foreground">Videos</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{event.coverage}</div>
                      <div className="text-xs text-muted-foreground">Coverage</div>
                    </div>
                  </div>
                </div>

                <Button variant="ghost" size="sm" className="w-full">
                  View Coverage
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto p-8 bg-gradient-royal text-primary-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h3 className="text-2xl font-bold mb-4">
              Want Us at Your Event?
            </h3>
            <p className="mb-6 opacity-90">
              Planning an automotive event? We'd love to provide coverage and connect with the community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="platform" size="lg" className="bg-white text-primary hover:bg-white/90">
                Submit Event
              </Button>
              <Button variant="platform" size="lg" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Partnership Inquiry
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;