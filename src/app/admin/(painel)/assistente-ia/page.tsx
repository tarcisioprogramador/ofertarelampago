import { AdminPageHeader, AdminCard } from "@/components/admin/ui";
import { AiAssistant } from "@/components/admin/ai-assistant";
import { aiConfigured } from "@/lib/ai";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function AiAssistantPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const configured = aiConfigured();

  return (
    <>
      <AdminPageHeader
        title="Assistente IA"
        subtitle="Cole o link do produto ou descreva o item + fotos — a IA cria a página completa para você."
      />

      {!configured && (
        <div className="mb-6 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          ⚠️ A chave de IA (<span className="font-mono">AI_API_KEY</span>) ainda não está configurada. Adicione no{" "}
          <span className="font-mono">.env</span> e na Vercel (ex.: Google Gemini, OpenAI ou OpenRouter — modelos
          compatíveis com a API OpenAI).
        </div>
      )}

      <AdminCard>
        <AiAssistant categories={categories} brands={brands} />
      </AdminCard>
    </>
  );
}
