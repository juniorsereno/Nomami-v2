import Image from "next/image";
import { Instagram, Globe, Phone } from "lucide-react";

interface PartnerCardProps {
  partner: {
    id: string;
    company_name: string;
    category: string;
    benefit_description: string;
    address: string;
    phone?: string | null;
    logo_url?: string | null;
    site_url?: string | null;
    instagram_url?: string | null;
  };
}

function getDescriptionSize(text: string): string {
  if (!text) return "text-sm";
  const len = text.length;
  if (len > 100) return "text-xs";
  if (len > 60) return "text-sm";
  return "text-base";
}

export function PartnerCard({ partner }: PartnerCardProps) {
  const descSize = getDescriptionSize(partner.benefit_description);
  
  return (
    <div className="flex flex-col items-center p-3 bg-[#feebeb] rounded-3xl shadow-sm h-[360px] w-full font-[family-name:var(--font-nunito)]">
      {/* Header: Company Name */}
      <div className="h-11 flex items-center justify-center w-full">
        <h3 className="text-base font-extrabold text-[#4A148C] uppercase text-center tracking-wide line-clamp-2 leading-tight">
          {partner.company_name}
        </h3>
      </div>

      {/* Image Container */}
      <div className="relative w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-sm overflow-hidden p-2 flex-shrink-0">
        {partner.logo_url ? (
          <Image
            src={partner.logo_url}
            alt={partner.company_name}
            fill
            className="object-contain p-1.5"
            sizes="96px"
          />
        ) : (
          <div className="text-xl font-bold text-muted-foreground/30 uppercase">
            {partner.company_name.substring(0, 2)}
          </div>
        )}
      </div>

      {/* Social / Contact Info */}
      <div className="h-[60px] flex flex-col items-center justify-center w-full mt-1.5 gap-0.5">
        {partner.site_url && (
          <a 
            href={partner.site_url.startsWith('http') ? partner.site_url : `https://${partner.site_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#4A148C] font-bold text-xs hover:text-[#602986] transition-colors"
          >
            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Visitar Site</span>
          </a>
        )}
        {partner.instagram_url && (
          <a 
            href={
              partner.instagram_url.startsWith('http') 
                ? partner.instagram_url 
                : partner.instagram_url.startsWith('@')
                ? `https://www.instagram.com/${partner.instagram_url.replace('@', '')}`
                : `https://www.instagram.com/${partner.instagram_url}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#4A148C] font-bold text-xs hover:text-[#602986] transition-colors"
          >
            <Instagram className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate max-w-[130px]">
              {partner.instagram_url.startsWith('@') 
                ? partner.instagram_url 
                : partner.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}
            </span>
          </a>
        )}
        {partner.phone && (
          <a 
            href={`tel:${partner.phone.replace(/\D/g, '')}`}
            className="flex items-center gap-1 text-[#4A148C] font-bold text-xs hover:text-[#602986] transition-colors"
          >
            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{partner.phone}</span>
          </a>
        )}
      </div>

      {/* Discount Badge */}
      <div className="bg-[#4A148C] text-white px-5 py-1 rounded-full font-bold text-xs tracking-wider shadow-md flex-shrink-0">
        DESCONTO
      </div>

      {/* Description - texto adaptável */}
      <div className="flex-1 w-full mt-1.5 overflow-hidden flex items-center justify-center">
        {partner.benefit_description && (
          <p className={`text-center text-[#4A148C] font-extrabold leading-tight px-2 ${descSize}`}>
            {partner.benefit_description}
          </p>
        )}
      </div>
      
      {/* Address */}
      <div className="h-8 w-full flex items-end justify-center">
        {partner.address && (
          <p className="text-center text-[#4A148C]/70 font-semibold text-[10px] line-clamp-2 px-2">
            {partner.address}
          </p>
        )}
      </div>
    </div>
  );
}
