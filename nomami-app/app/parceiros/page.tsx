import { getPartners } from "@/lib/queries";
import { PartnerCard } from "@/components/partner-card";
import { SiteHeader } from "@/components/site-header";

export const dynamic = 'force-dynamic';

export default async function PublicPartnersPage() {
  const partners = await getPartners();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activePartners = partners.filter((p: any) => p.status === 'Ativo').map((p: any) => ({
    id: p.id,
    company_name: p.company_name,
    category: p.category,
    benefit_description: p.benefit_description,
    address: p.address,
    phone: p.phone,
    logo_url: p.logo_url,
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-2 font-bold text-xl">
             <span className="text-primary">Nomami</span> Parceiros
           </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Nossos Parceiros</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Conheça as empresas parceiras que oferecem benefícios exclusivos para assinantes Nomami.
          </p>
        </div>

        {activePartners.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum parceiro encontrado no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activePartners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Nomami. Todos os direitos reservados.
      </footer>
    </div>
  );
}