import Link from "next/link";
import {
  Coffee,
  Instagram,
  MessageSquare,
  Star,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="w-6 h-6 text-brand-600" />
            <span className="text-xl font-bold text-brand-800">
              カフェSNS投稿AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">
              ログイン
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          AIがあなたのお店の言葉を紡ぎます
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          カフェのSNS投稿、
          <br />
          もう悩まない。
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          お店の情報を入力するだけで、Instagram投稿文、ストーリー、
          <br className="hidden md:block" />
          LINE配信文、Googleレビュー返信をAIが自動生成。
        </p>
        <Link
          href="/register"
          className="btn-primary text-lg px-8 py-3 inline-flex items-center gap-2"
        >
          無料で始める
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">
          こんなお悩みを解決します
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Instagram className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">SNS投稿文の自動生成</h3>
            <p className="text-gray-600 text-sm">
              Instagram、ストーリー、LINE配信用の文面を一括で生成。毎回の文章作成の手間から解放されます。
            </p>
          </div>
          <div className="card text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">レビュー返信も簡単</h3>
            <p className="text-gray-600 text-sm">
              Googleレビューの返信文もAIが作成。高評価も低評価も、お店に合った丁寧な返信を。
            </p>
          </div>
          <div className="card text-center">
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-brand-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">お店の雰囲気に合わせる</h3>
            <p className="text-gray-600 text-sm">
              お店の文体やトーンを登録するだけ。AIがお店らしい自然な文章を作ります。
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coffee className="w-4 h-4" />
            <span className="font-medium">カフェSNS投稿AI</span>
          </div>
          <p>&copy; 2024 カフェSNS投稿AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
