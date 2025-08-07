import {
  SiGithub,
  SiX,
  SiProducthunt,
  SiAppstore,
  SiGoogleplay,
  SiDiscord,
  SiFacebook,
  SiInstagram,
  SiYoutube,
} from "@icons-pack/react-simple-icons";
import { Globe, LinkIcon as LinkIconLucide } from "lucide-react";

const map = {
  github: SiGithub,
  twitter: SiX,
  producthunt: SiProducthunt,
  appstore: SiAppstore,
  googleplay: SiGoogleplay,
  discord: SiDiscord,
  facebook: SiFacebook,
  instagram: SiInstagram,
  youtube: SiYoutube,
  website: Globe,
};

export const LinkIcon = ({
  link,
}: {
  link: { title: string; url: string };
}) => {
  if (!link.title && !link.url)
    return <LinkIconLucide className="w-5 h-5 text-muted-foreground" />;

  const normalizedTitle = link.title.toLowerCase();
  
  let Icon = map[normalizedTitle as keyof typeof map];
  
  if (!Icon && link.url) {
    try {
      const url = new URL(link.url);
      const domain = url.hostname.replace(/^www\./, "");
      
      const mainDomain = domain.split('.')[0];
      
      Icon = map[mainDomain as keyof typeof map];
      
      if (!Icon) {
        Icon = Globe;
      }
    } catch (error: unknown) {
      console.error(error);
      Icon = LinkIconLucide;
    }
  } else if (!Icon) {
    Icon = LinkIconLucide;
  }
  
  return <Icon className="w-5 h-5 text-muted-foreground" />;
};
