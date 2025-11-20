import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone } from "lucide-react";

interface PartnerCardProps {
  partner: {
    id: string;
    company_name: string;
    category: string;
    benefit_description: string;
    address: string;
    phone: string;
    logo_url?: string | null;
  };
}

export function PartnerCard({ partner }: PartnerCardProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 w-full bg-muted flex items-center justify-center overflow-hidden">
        {partner.logo_url ? (
          <Image
            src={partner.logo_url}
            alt={partner.company_name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="text-4xl font-bold text-muted-foreground/50 uppercase">
            {partner.company_name.substring(0, 2)}
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {partner.category}
          </Badge>
        </div>
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-1" title={partner.company_name}>
          {partner.company_name}
        </CardTitle>
        <CardDescription className="line-clamp-2 min-h-[2.5rem]" title={partner.benefit_description}>
          {partner.benefit_description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{partner.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 shrink-0" />
          <span>{partner.phone}</span>
        </div>
      </CardContent>
    </Card>
  );
}