"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  saving: boolean;
}

export default function SaveTemplateModal({
  isOpen,
  onClose,
  onSave,
  saving,
}: SaveTemplateModalProps) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="card w-full max-w-md mx-4">
        <h3 className="text-lg font-bold mb-4">テンプレートを保存</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="label">テンプレート名</label>
            <input
              ref={inputRef}
              type="text"
              className="input-field"
              placeholder="例：季節メニュー紹介、定番投稿"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saving}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={saving}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={saving || !name.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
