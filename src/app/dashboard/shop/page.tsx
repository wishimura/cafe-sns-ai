"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Store, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function ShopPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    business_hours: "",
    closed_days: "",
    menu_type: "",
    atmosphere: "",
    tone: "",
    has_takeout: false,
    hashtag_policy: "",
  });

  useEffect(() => {
    async function loadShop() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("shops")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setShopId(data.id);
        setForm({
          name: data.name || "",
          description: data.description || "",
          address: data.address || "",
          business_hours: data.business_hours || "",
          closed_days: data.closed_days || "",
          menu_type: data.menu_type || "",
          atmosphere: data.atmosphere || "",
          tone: data.tone || "",
          has_takeout: data.has_takeout || false,
          hashtag_policy: data.hashtag_policy || "",
        });
      }
      setLoading(false);
    }
    loadShop();
  }, [supabase]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      if (shopId) {
        const { error } = await supabase
          .from("shops")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", shopId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("shops")
          .insert({ ...form, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        setShopId(data.id);
      }

      toast.success("店舗情報を保存しました");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "保存に失敗しました";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Store className="w-6 h-6 text-brand-600" />
        <h1 className="text-2xl font-bold">店舗情報設定</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-bold text-lg">基本情報</h2>

          <div>
            <label className="label">
              店舗名 <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              className="input-field"
              placeholder="○○カフェ"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">店舗紹介文</label>
            <textarea
              name="description"
              className="textarea-field h-24"
              placeholder="お店の特徴や想いを書いてください"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="label">住所</label>
            <input
              name="address"
              className="input-field"
              placeholder="東京都渋谷区..."
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">営業時間</label>
              <input
                name="business_hours"
                className="input-field"
                placeholder="9:00〜18:00"
                value={form.business_hours}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">定休日</label>
              <input
                name="closed_days"
                className="input-field"
                placeholder="毎週水曜日"
                value={form.closed_days}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="label">提供メニューの系統</label>
            <input
              name="menu_type"
              className="input-field"
              placeholder="コーヒー、おにぎり、カレー"
              value={form.menu_type}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="has_takeout"
              id="has_takeout"
              className="w-4 h-4 text-brand-600 rounded"
              checked={form.has_takeout}
              onChange={handleChange}
            />
            <label htmlFor="has_takeout" className="text-sm text-gray-700">
              テイクアウトあり
            </label>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-bold text-lg">雰囲気・文体設定</h2>

          <div>
            <label className="label">お店の雰囲気</label>
            <input
              name="atmosphere"
              className="input-field"
              placeholder="落ち着いた、あたたかい、地域密着"
              value={form.atmosphere}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              カンマ区切りで複数入力できます
            </p>
          </div>

          <div>
            <label className="label">文体トーン</label>
            <select
              name="tone"
              className="input-field"
              value={form.tone}
              onChange={handleChange}
            >
              <option value="">選択してください</option>
              <option value="やさしい、親しみやすい">
                やさしい・親しみやすい
              </option>
              <option value="丁寧、上品">丁寧・上品</option>
              <option value="カジュアル、元気">カジュアル・元気</option>
              <option value="おしゃれ、洗練">おしゃれ・洗練</option>
              <option value="シンプル、端的">シンプル・端的</option>
            </select>
          </div>

          <div>
            <label className="label">ハッシュタグ方針</label>
            <textarea
              name="hashtag_policy"
              className="textarea-field h-20"
              placeholder="地域名を含める、メニュー名を含める、店名タグを入れるなど"
              value={form.hashtag_policy}
              onChange={handleChange}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary flex items-center gap-2"
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          保存する
        </button>
      </form>
    </div>
  );
}
