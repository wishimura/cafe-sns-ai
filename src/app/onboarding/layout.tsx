import { Coffee } from "lucide-react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Coffee className="w-7 h-7 text-brand-600" />
          <span className="text-xl font-bold text-brand-800">
            カフェSNS投稿AI
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
