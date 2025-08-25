import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share, Copy, Check, Facebook, Twitter, Linkedin, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  variant?: "default" | "ghost" | "outline" | "destructive" | "secondary" | "link" | "hero" | "platform" | "royal";
  size?: "default" | "sm" | "lg";
  className?: string;
}

const ShareButton = ({ 
  url, 
  title, 
  description = "", 
  variant = "ghost", 
  size = "sm",
  className = ""
}: ShareButtonProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedUrl = encodeURIComponent(fullUrl);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: fullUrl,
        });
        return true; // Success
      } catch (error) {
        console.log('Native share failed, falling back to menu:', error);
        return false; // Failed, will show dropdown
      }
    }
    return false; // Not available
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({
        title: "¡Enlace copiado!",
        description: "El enlace se ha copiado al portapapeles.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace.",
        variant: "destructive",
      });
    }
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&t=${encodedTitle}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareToX = () => {
    const xUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=autodebate`;
    window.open(xUrl, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareToLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
  };

  // Always show dropdown instead of trying native share due to permission issues
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`group ${className}`}
        >
          <Share className="h-4 w-4 mr-1" />
          {size !== "sm" && t('blog.share')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-background border border-border z-50">
        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? "¡Copiado!" : "Copiar enlace"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToFacebook} className="cursor-pointer">
          <Facebook className="h-4 w-4 mr-2 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToX} className="cursor-pointer">
          <Twitter className="h-4 w-4 mr-2" />
          X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToWhatsApp} className="cursor-pointer">
          <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToLinkedIn} className="cursor-pointer">
          <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
          LinkedIn
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;