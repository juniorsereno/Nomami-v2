import { getPartners } from "@/lib/queries";
import { PartnersFilter } from "@/components/partners-filter";
import { NomamiLogo } from "@/components/nomami-logo";

export const dynamic = 'force-dynamic';

export default async function PublicPartnersPage() {
  const partners = await getPartners() ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activePartners = partners.filter((p: any) => p.status === 'Ativo').map((p: any) => ({
    id: p.id,
    company_name: p.company_name || '',
    category: p.category || '',
    benefit_description: p.benefit_description || '',
    address: p.address || '',
    phone: p.phone,
    logo_url: p.logo_url,
    site_url: p.site_url,
    instagram_url: p.instagram_url,
  }));

  return (
    <div className="min-h-screen bg-[#602986] flex flex-col">
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
           <NomamiLogo width={160} height={48} priority />
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8 font-[family-name:var(--font-nunito)]">
        <div className="mb-8 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase drop-shadow-md">
            Guia de <span className="text-[#adc1d8]">PARCEIROS</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-white/90">
            Benefícios exclusivos para Mães
          </h2>
          <p className="text-white/80 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            O noMAMI conecta você aos melhores parceiros da cidade para tornar sua maternidade mais leve e econômica
          </p>
        </div>

        <PartnersFilter partners={activePartners} />
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-white/80 font-[family-name:var(--font-nunito)]">
        <p className="flex items-center justify-center gap-2 text-lg font-medium">
          Feito com amor <span className="text-red-400 animate-pulse">❤️</span>
        </p>
      </footer>
    </div>
  );
}