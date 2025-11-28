import Image from "next/image";
import { Instagram } from "lucide-react";

interface PartnerCardProps {
  partner: {
    id: string;
    company_name: string;
    category: string;
    benefit_description: string;
    address: string;
    phone: string;
    logo_url?: string | null;
    site_url?: string | null;
  };
}

export function PartnerCard({ partner }: PartnerCardProps) {
  return (
    <div className="flex flex-col items-center p-4 bg-[#feebeb] rounded-3xl shadow-sm h-full font-[family-name:var(--font-nunito)]">
      {/* Header: Company Name */}
      <h3 className="text-2xl font-extrabold text-[#4A148C] uppercase mb-3 text-center tracking-wide">
        {partner.company_name}
      </h3>

      {/* Image Container */}
      <div className="relative w-48 h-48 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm overflow-hidden p-4">
        {partner.logo_url ? (
          <Image
            src={partner.logo_url}
            alt={partner.company_name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="text-4xl font-bold text-muted-foreground/30 uppercase">
            {partner.company_name.substring(0, 2)}
          </div>
        )}
      </div>

      {/* Social / Contact Info */}
      <div className="flex flex-col items-center gap-1 text-[#4A148C] font-bold text-lg mb-3 tracking-wider">
        {partner.site_url && (
          <div className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            <span>{partner.site_url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}</span>
          </div>
        )}
        {/* <span className="text-sm">{partner.phone}</span> */}
      </div>

      {/* Discount Badge */}
      <div className="bg-[#4A148C] text-white px-8 py-1.5 rounded-full font-bold text-lg mb-3 tracking-wider shadow-md">
        DESCONTO
      </div>

      {/* Description */}
      <p className="text-center text-[#4A148C] text-lg font-extrabold leading-tight px-2">
        {partner.benefit_description}
      </p>
      
      {/* Address (Optional, maybe smaller at bottom) */}
      <p className="text-center text-[#4A148C]/80 text-sm font-bold mt-4 px-4">
        {partner.address}
      </p>

    </div>
  );
}