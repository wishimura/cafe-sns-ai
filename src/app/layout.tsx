import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "カフェSNS投稿AI - 小規模カフェのSNS運用をAIでサポート",
  description:
    "Instagram投稿文、ストーリー文、LINE配信文、Googleレビュー返信をAIが自動生成。小規模カフェの店主のSNS運用を効率化します。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
              borderRadius: "8px",
            },
          }}
        />
      </body>
    </html>
  );
}
