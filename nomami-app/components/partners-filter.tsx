"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { PartnerCard } from "./partner-card";

interface Partner {
  id: string;
  company_name: string;
  category: string;
  benefit_description: string;
  address: string;
  phone?: string | null;
  logo_url?: string | null;
  site_url?: string | null;
  instagram_url?: string | null;
}

interface PartnersFilterProps {
  partners: Partner[];
}

export function PartnersFilter({ partners }: PartnersFilterProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");

  // Extrai categorias únicas dos parceiros (considerando múltiplas categorias)
  const categories = useMemo(() => {
    const cats = new Set<string>();
    partners.forEach((p) => {
      if (p.category) {
        // Divide categorias separadas por vírgula
        const partnerCategories = p.category.split(',').map(cat => cat.trim());
        partnerCategories.forEach(cat => cats.add(cat));
      }
    });
    return Array.from(cats).sort();
  }, [partners]);

  // Filtra parceiros por busca e categoria
  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const matchesSearch = search === "" || 
        partner.company_name.toLowerCase().includes(search.toLowerCase());
      
      // Verifica se o parceiro tem a categoria selecionada (suporta múltiplas categorias)
      const matchesCategory = selectedCategory === "todas" || 
        (partner.category && partner.category.split(',').map(cat => cat.trim()).includes(selectedCategory));

      return matchesSearch && matchesCategory;
    });
  }, [partners, search, selectedCategory]);

  return (
    <>
      {/* Filtros */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
        {/* Busca por nome */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4A148C]/60" />
          <input
            type="text"
            placeholder="Buscar parceiro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-full bg-white/90 text-[#4A148C] placeholder:text-[#4A148C]/50 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 shadow-md"
          />
        </div>

        {/* Filtro por categoria */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCategory("todas")}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all shadow-md ${
                selectedCategory === "todas"
                  ? "bg-white text-[#4A148C]"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-bold text-sm transition-all shadow-md ${
                  selectedCategory === category
                    ? "bg-white text-[#4A148C]"
                    : "bg-white/20 text-white hover:bg-white/30"
              }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contador de resultados */}
      <p className="text-center text-white/70 mb-6 font-medium">
        {filteredPartners.length === 0
          ? "Nenhum parceiro encontrado"
          : filteredPartners.length === 1
          ? "1 parceiro encontrado"
          : `${filteredPartners.length} parceiros encontrados`}
      </p>

      {/* Grid de parceiros */}
      {filteredPartners.length === 0 ? (
        <div className="text-center py-12 text-white/60">
          Nenhum parceiro encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
          {filteredPartners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      )}
    </>
  );
}
