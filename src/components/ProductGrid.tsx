import { useState } from "react";
import { Search, Minus } from "lucide-react";
import { categories, type Product } from "@/data/products";
import { useProducts } from "@/contexts/ProductsContext";
import { useTranslation } from "react-i18next";
import { productImageMap } from "@/data/productImages";

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
}

const ProductGrid = ({ onAddToCart }: ProductGridProps) => {
  const { products } = useProducts();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("كل الاصناف");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = products.filter((p) => {
    const matchCategory = activeCategory === "كل الاصناف" || p.category === activeCategory;
    const matchSearch = p.name.includes(searchQuery) || p.id.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-secondary/30">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <button className="bg-accent text-accent-foreground px-4 py-1.5 rounded text-sm font-bold hover:bg-accent/90 transition-colors shrink-0">
          {t("wash")}
        </button>
        <div className="flex-1" />
        <div className="flex gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all border ${
                activeCategory === cat
                  ? "bg-category-active text-category-active-foreground border-category-active shadow-sm"
                  : "bg-card text-foreground border-border hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <input
            placeholder={t("item_number")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-border rounded px-3 py-1.5 text-sm bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-2">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => onAddToCart(product)}
              className={`group flex flex-col rounded hover:shadow-md transition-all cursor-pointer overflow-hidden ${
                product.price_per_meter
                  ? "bg-accent/20 border-2 border-accent ring-1 ring-accent/30"
                  : "bg-card border border-product-card-border"
              }`}
            >
              <div className="flex items-center justify-center h-16 bg-muted/30 border-b border-border p-1">
                {productImageMap[product.id] ? (
                  <img src={productImageMap[product.id]} alt={product.name} className="h-full w-full object-contain group-hover:scale-110 transition-transform" />
                ) : (
                  <span className="text-3xl group-hover:scale-110 transition-transform">{product.emoji}</span>
                )}
              </div>
              <div className="px-1.5 pt-1 text-center">
                <span className="text-[11px] font-semibold text-foreground leading-tight line-clamp-1">{product.name}</span>
              </div>
              <div className="flex flex-col px-1.5 pb-1.5 pt-0.5 gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground">{product.price.toFixed(2)}</span>
                  <div className="h-5 w-5 rounded bg-secondary flex items-center justify-center">
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
                {product.price_per_meter && (
                  <span className="text-[9px] text-muted-foreground">{product.price_per_meter.toFixed(2)} /م²</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">{t("no_data")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
