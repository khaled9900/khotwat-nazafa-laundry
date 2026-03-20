import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recent invoices (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [{ data: invoices }, { data: expenses }, { data: products }, { data: customers }] =
      await Promise.all([
        supabase
          .from("invoices")
          .select("*")
          .gte("created_at", ninetyDaysAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("expenses")
          .select("*")
          .gte("expense_date", ninetyDaysAgo.toISOString().slice(0, 10))
          .order("expense_date", { ascending: false })
          .limit(500),
        supabase.from("products").select("*"),
        supabase
          .from("customers")
          .select("*")
          .order("total_spent", { ascending: false })
          .limit(50),
      ]);

    // Build summary stats
    const totalRevenue = (invoices || []).reduce(
      (s: number, i: any) => s + Number(i.total),
      0
    );
    const totalExpenses = (expenses || []).reduce(
      (s: number, e: any) => s + Number(e.amount),
      0
    );
    const invoiceCount = (invoices || []).length;
    const avgOrderValue = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;

    // Payment method breakdown
    const paymentMethods: Record<string, { count: number; total: number }> = {};
    (invoices || []).forEach((inv: any) => {
      const m = inv.payment_method || "unknown";
      if (!paymentMethods[m]) paymentMethods[m] = { count: 0, total: 0 };
      paymentMethods[m].count++;
      paymentMethods[m].total += Number(inv.total);
    });

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    (invoices || []).forEach((inv: any) => {
      statusBreakdown[inv.status] = (statusBreakdown[inv.status] || 0) + 1;
    });

    // Top customers
    const topCustomers = (customers || []).slice(0, 10).map((c: any) => ({
      name: c.name,
      total_spent: c.total_spent,
      total_orders: c.total_orders,
      loyalty_points: c.loyalty_points,
    }));

    // Products list
    const productsList = (products || []).map((p: any) => ({
      name: p.name,
      price: p.price,
      price_per_meter: p.price_per_meter,
      category: p.category,
    }));

    // Daily revenue trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyRevenue: Record<string, number> = {};
    (invoices || [])
      .filter((i: any) => new Date(i.created_at) >= thirtyDaysAgo)
      .forEach((i: any) => {
        const day = i.created_at.slice(0, 10);
        dailyRevenue[day] = (dailyRevenue[day] || 0) + Number(i.total);
      });

    const summaryText = `
بيانات المبيعات لآخر 90 يوم:
- إجمالي الإيرادات: ${totalRevenue.toFixed(2)} ر.س
- إجمالي المصروفات: ${totalExpenses.toFixed(2)} ر.س
- صافي الربح: ${(totalRevenue - totalExpenses).toFixed(2)} ر.س
- عدد الفواتير: ${invoiceCount}
- متوسط قيمة الطلب: ${avgOrderValue.toFixed(2)} ر.س

طرق الدفع:
${Object.entries(paymentMethods)
  .map(([m, v]) => `  - ${m}: ${v.count} فاتورة بإجمالي ${v.total.toFixed(2)} ر.س`)
  .join("\n")}

حالات الطلبات:
${Object.entries(statusBreakdown)
  .map(([s, c]) => `  - ${s}: ${c}`)
  .join("\n")}

أفضل 10 عملاء:
${topCustomers.map((c: any) => `  - ${c.name}: إنفاق ${c.total_spent} ر.س، ${c.total_orders} طلب`).join("\n")}

المنتجات (${productsList.length} منتج):
${productsList.map((p: any) => `  - ${p.name}: ${p.price} ر.س${p.price_per_meter ? `، سعر المتر: ${p.price_per_meter} ر.س` : ""}`).join("\n")}

اتجاه الإيرادات اليومية (آخر 30 يوم):
${Object.entries(dailyRevenue)
  .sort()
  .map(([d, v]) => `  - ${d}: ${(v as number).toFixed(2)} ر.س`)
  .join("\n")}
`.trim();

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `أنت محلل أعمال خبير متخصص في قطاع المغاسل والخدمات. قدم تحليلاً شاملاً وتوصيات عملية بالعربية.
استخدم تنسيق Markdown مع عناوين وقوائم ورموز إيموجي.
قسّم التحليل إلى:
1. 📊 ملخص الأداء العام
2. 📈 تحليل اتجاهات المبيعات
3. 💰 تحليل الربحية
4. 👥 تحليل العملاء
5. 📦 تحليل المنتجات
6. ⚡ توصيات فورية (أهم 5 إجراءات)
7. 🎯 خطة تحسين (قصيرة ومتوسطة المدى)

كن محدداً بالأرقام واعتمد على البيانات الفعلية.`,
            },
            {
              role: "user",
              content: `حلل بيانات المبيعات التالية وقدم توصيات:\n\n${summaryText}`,
            },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد لاستخدام خدمة الذكاء الاصطناعي." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-sales error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
