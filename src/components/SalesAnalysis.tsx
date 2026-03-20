import { useState, useCallback } from "react";
import { Brain, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-sales`;

const SalesAnalysis = () => {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setAnalysis("");

    try {
      const resp = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({}),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "خطأ غير معروف" }));
        toast.error(err.error || "حدث خطأ أثناء التحليل");
        setLoading(false);
        return;
      }

      if (!resp.body) {
        toast.error("لم يتم استلام بيانات");
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAnalysis(fullText);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAnalysis(fullText);
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("فشل الاتصال بخدمة التحليل");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                تحليل المبيعات بالذكاء الاصطناعي
              </h1>
              <p className="text-xs text-muted-foreground">
                تحليل شامل وتوصيات ذكية لتحسين أداء عملك
              </p>
            </div>
          </div>
          <Button
            onClick={runAnalysis}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "جاري التحليل..." : "بدء التحليل"}
          </Button>
        </div>

        {/* Content */}
        {!analysis && !loading && (
          <div className="bg-card rounded-xl border border-border p-12 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              تحليل ذكي لبيانات مبيعاتك
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              اضغط على "بدء التحليل" للحصول على تحليل شامل لمبيعات آخر 90 يوم
              مع توصيات عملية لتحسين الأداء
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {[
                "📊 تحليل الأداء",
                "📈 اتجاهات المبيعات",
                "💰 تحليل الربحية",
                "👥 تحليل العملاء",
                "⚡ توصيات فورية",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {loading && !analysis && (
          <div className="bg-card rounded-xl border border-border p-12 text-center space-y-4">
            <RefreshCw className="h-10 w-10 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">
              جاري جمع البيانات وتحليلها...
            </p>
          </div>
        )}

        {analysis && (
          <div className="bg-card rounded-xl border border-border p-6 prose prose-sm max-w-none dark:prose-invert" dir="rtl">
            <ReactMarkdown>{analysis}</ReactMarkdown>
            {loading && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse rounded-sm ml-1" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesAnalysis;
