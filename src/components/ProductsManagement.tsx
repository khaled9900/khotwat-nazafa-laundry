import { useState } from "react";
import { Plus, Pencil, Trash2, Search, X, Check, Package } from "lucide-react";
import { useProducts } from "@/contexts/ProductsContext";
import { categories } from "@/data/products";
import { toast } from "sonner";
import type { Product } from "@/data/products";

const emojis = ["📦", "🛋️", "🛏️", "🧶", "🪟", "🟫", "🧣", "🐑", "🪑", "🧩", "🧥", "💺", "🍳", "🔌", "📺"];

interface ProductFormData {
  name: string;
  price: string;
  category: string;
  emoji: string;
  price_per_meter: string;
}

const emptyForm: ProductFormData = { name: "", price: "", category: categories[1] || "", emoji: "📦", price_per_meter: "" };

const ProductsManagement = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("الكل");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.includes(searchQuery) || p.id.includes(searchQuery);
    const matchCat = filterCategory === "الكل" || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      price: String(p.price),
      category: p.category,
      emoji: p.emoji,
      price_per_meter: p.price_per_meter ? String(p.price_per_meter) : "",
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("يرجى إدخال اسم الصنف");
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error("يرجى إدخال سعر صحيح");
      return;
    }

    const data = {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category,
      emoji: form.emoji,
      price_per_meter: form.price_per_meter ? Number(form.price_per_meter) : null,
    };

    if (editingId) {
      updateProduct(editingId, data);
      toast.success("تم تعديل الصنف بنجاح ✅");
    } else {
      addProduct(data);
      toast.success("تم إضافة الصنف بنجاح ✅");
    }

    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setDeleteConfirm(null);
    toast.success("تم حذف الصنف ✅");
  };

  const allCategories = ["الكل", ...categories.filter((c) => c !== "كل الاصناف")];

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0 overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">إدارة الأصناف والأسعار</h1>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-bold hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            إضافة صنف جديد
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="بحث بالاسم أو الرقم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-border rounded-md pr-10 pl-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">
            {filtered.length} صنف
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 sticky top-0 z-10">
            <tr>
              <th className="text-right px-4 py-3 font-semibold text-foreground">#</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">الرمز</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">اسم الصنف</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">التصنيف</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">السعر</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">سعر المتر</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product, index) => (
              <tr
                key={product.id}
                className="border-b border-border hover:bg-secondary/20 transition-colors"
              >
                <td className="px-4 py-2.5 text-muted-foreground">{index + 1}</td>
                <td className="px-4 py-2.5 text-xl">{product.emoji}</td>
                <td className="px-4 py-2.5 font-medium text-foreground">{product.name}</td>
                <td className="px-4 py-2.5">
                  <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs">
                    {product.category}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-bold text-price-tag">{product.price.toFixed(2)} ر.س</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {product.price_per_meter ? `${product.price_per_meter.toFixed(2)} ر.س` : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => openEdit(product)}
                      className="h-8 w-8 rounded flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                      title="تعديل"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {deleteConfirm === product.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="h-8 w-8 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                          title="تأكيد الحذف"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
                          title="إلغاء"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="h-8 w-8 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>لا توجد أصناف</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div
            className="bg-card rounded-lg border border-border shadow-xl w-full max-w-md animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-foreground">
                {editingId ? "تعديل صنف" : "إضافة صنف جديد"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="h-8 w-8 rounded flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Emoji picker */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">الرمز</label>
                <div className="flex gap-1.5 flex-wrap">
                  {emojis.map((e) => (
                    <button
                      key={e}
                      onClick={() => setForm({ ...form, emoji: e })}
                      className={`h-9 w-9 rounded text-lg flex items-center justify-center transition-all ${
                        form.emoji === e
                          ? "bg-primary text-primary-foreground ring-2 ring-primary scale-110"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">اسم الصنف *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="مثال: كنب ثلاثي"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">التصنيف</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {categories.filter((c) => c !== "كل الاصناف").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Price + Price per meter */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">السعر (ر.س) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">سعر المتر (ر.س)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price_per_meter}
                    onChange={(e) => setForm({ ...form, price_per_meter: e.target.value })}
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-4 border-t border-border">
              <button
                onClick={handleSave}
                className="flex-1 bg-accent text-accent-foreground py-2.5 rounded-md font-bold text-sm hover:bg-accent/90 transition-colors"
              >
                {editingId ? "حفظ التعديلات" : "إضافة الصنف"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManagement;
