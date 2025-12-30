import Image from "next/image";
import { Instagram, Globe } from "lucide-react";

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

export function PartnerCard({ partner }: PartnerCardProps) {
  const hasContacts = partner.site_url || partner.instagram_url || partner.phone;
  const contactCount = [partner.site_url, partner.instagram_url, partner.phone].filter(Boolean).length;
  
  return (
    <div className="flex flex-col items-center p-4 bg-[#feebeb] rounded-3xl shadow-sm aspect-square w-full font-[family-name:var(--font-nunito)]">
      {/* Header: Company Name */}
      <h3 className="text-xl font-extrabold text-[#4A148C] uppercase mb-2 text-center tracking-wide line-clamp-2">
        {partner.company_name}
      </h3>

      {/* Image Container */}
      <div className="relative w-32 h-32 bg-white rounded-3xl flex items-center justify-center mb-2 shadow-sm overflow-hidden p-3 flex-shrink-0">
        {partner.logo_url ? (
          <Image
            src={partner.logo_url}
            alt={partner.company_name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="text-3xl font-bold text-muted-foreground/30 uppercase">
            {partner.company_name.substring(0, 2)}
          </div>
        )}
      </div>

      {/* Social / Contact Info */}
      {hasContacts && (
        <div className={`flex flex-col items-center gap-1 text-[#4A148C] font-bold mb-2 tracking-wider ${contactCount > 2 ? 'text-xs' : 'text-sm'}`}>
          {partner.site_url && (
            <a 
              href={partner.site_url.startsWith('http') ? partner.site_url : `https://${partner.site_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-[#602986] transition-colors"
            >
              <Globe className="h-4 w-4 flex-shrink-0" />
              <span className="truncate max-w-[150px]">Visitar Site</span>
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
              className="flex items-center gap-1.5 hover:text-[#602986] transition-colors"
            >
              <Instagram className="h-4 w-4 flex-shrink-0" />
              <span className="truncate max-w-[150px]">
                {partner.instagram_url.startsWith('@') 
                  ? partner.instagram_url 
                  : partner.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}
              </span>
            </a>
          )}
          {partner.phone && (
            <a 
              href={`tel:${partner.phone.replace(/\D/g, '')}`}
              className="flex items-center gap-1.5 hover:text-[#602986] transition-colors"
            >
              <span className="truncate max-w-[150px]">{partner.phone}</span>
            </a>
          )}
        </div>
      )}

      {/* Discount Badge */}
      <div className="bg-[#4A148C] text-white px-6 py-1 rounded-full font-bold text-base mb-2 tracking-wider shadow-md flex-shrink-0">
        DESCONTO
      </div>

      {/* Description */}
      {partner.benefit_description && (
        <p className={`text-center text-[#4A148C] font-extrabold leading-tight px-2 flex-grow flex items-center ${partner.benefit_description.length > 80 ? 'text-sm' : partner.benefit_description.length > 50 ? 'text-base' : 'text-lg'}`}>
          {partner.benefit_description}
        </p>
      )}
      
      {/* Address */}
      {partner.address && (
        <p className={`text-center text-[#4A148C]/80 font-bold mt-2 px-2 line-clamp-2 ${partner.address.length > 60 ? 'text-xs' : 'text-sm'}`}>
          {partner.address}
        </p>
      )}

    </div>
  );
}