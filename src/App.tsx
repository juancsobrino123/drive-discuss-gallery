import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Gallery from "./pages/Gallery";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import Forum from "./pages/Forum";
import ForumDetail from "./pages/ForumDetail";
import Events from "./pages/Events";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import GalleryDetail from "./pages/GalleryDetail";
import Community from "./pages/Community";
import Showroom from "./pages/Showroom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/galeria" element={<Gallery />} />
            <Route path="/galeria/:eventId" element={<GalleryDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:postId" element={<BlogDetail />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/:threadId" element={<ForumDetail />} />
            <Route path="/eventos" element={<Events />} />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/comunidad" element={<Community />} />
            <Route path="/showroom/:userId" element={<Showroom />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
