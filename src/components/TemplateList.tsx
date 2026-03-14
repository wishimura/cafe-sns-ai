"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PostTemplate } from "@/types/database";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface TemplateListProps {
  shopId: string;
  onSelect: (template: PostTemplate) => void;
  refreshKey?: number;
}

export default function TemplateList({
  shopId,
  onSelect,
  refreshKey,
}: TemplateListProps) {
  const supabase = createClient();
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTemplates() {
      setLoading(true);
      const { data, error } = await supabase
        .from("post_templates")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("テンプレート取得エラー:", error);
        toast.error("テンプレートの取得に失敗しました");
      } else {
        setTemplates(data || []);
      }
      setLoading(false);
    }
    fetchTemplates();
  }, [shopId, supabase, refreshKey]);

  const handleDelete = async (
    e: React.MouseEvent,
    templateId: string
  ) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("post_templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      toast.error("テンプレートの削除に失敗しました");
    } else {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      toast.success("テンプレートを削除しました");
    }
  };

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-48 h-24 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-3">
        テンプレートがありません
      </p>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          onClick={() => onSelect(template)}
          className={cn(
            "flex-shrink-0 w-48 text-left p-3 rounded-lg border border-gray-200",
            "bg-white hover:border-brand-400 hover:shadow-sm transition-all",
            "relative group"
          )}
        >
          <button
            type="button"
            onClick={(e) => handleDelete(e, template.id)}
            className={cn(
              "absolute top-1 right-1 p-1 rounded-full",
              "text-gray-400 hover:text-red-500 hover:bg-red-50",
              "opacity-0 group-hover:opacity-100 transition-opacity"
            )}
            title="削除"
          >
            <X className="w-3 h-3" />
          </button>
          <p className="text-sm font-medium text-gray-900 truncate pr-5">
            {template.name}
          </p>
          <p className="text-xs text-gray-500 truncate mt-1">
            {template.theme}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {template.menu_item}
          </p>
        </button>
      ))}
    </div>
  );
}
