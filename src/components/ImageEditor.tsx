"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Check } from "lucide-react";
import {
  FILTERS,
  type TextPosition,
  type TextOverlayOptions,
  applyFilterToCanvas,
  addTextOverlay,
  exportCanvasToBlob,
  resizeImage,
} from "@/lib/image-filters";

interface ImageEditorProps {
  imageFile: File;
  onSave: (editedBlob: Blob) => void;
  onCancel: () => void;
}

const TEXT_COLORS = [
  { value: "#ffffff", label: "白", bg: "bg-white border border-gray-300" },
  { value: "#000000", label: "黒", bg: "bg-black" },
  { value: "#c96a27", label: "ブランド", bg: "bg-brand-600" },
  { value: "#db2777", label: "ピンク", bg: "bg-pink-600" },
  { value: "#ca8a04", label: "イエロー", bg: "bg-yellow-600" },
];

const POSITION_OPTIONS: { value: TextPosition; label: string }[] = [
  { value: "top", label: "上部" },
  { value: "center", label: "中央" },
  { value: "bottom", label: "下部" },
];

const MAX_CANVAS_WIDTH = 1080;

export default function ImageEditor({
  imageFile,
  onSave,
  onCancel,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [selectedFilter, setSelectedFilter] = useState("none");
  const [showText, setShowText] = useState(false);
  const [textOptions, setTextOptions] = useState<TextOverlayOptions>({
    text: "",
    position: "bottom",
    fontSize: 24,
    color: "#ffffff",
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create a preview URL for the thumbnail filter previews
  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    previewUrlRef.current = url;
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Load and resize image
  useEffect(() => {
    let cancelled = false;
    resizeImage(imageFile, MAX_CANVAS_WIDTH).then((img) => {
      if (cancelled) return;
      imageRef.current = img;
      setImageLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [imageFile]);

  // Redraw canvas whenever filter or text options change
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const filterDef = FILTERS[selectedFilter] || FILTERS.none;
    applyFilterToCanvas(canvas, ctx, image, filterDef.filter);

    if (showText && textOptions.text.trim()) {
      addTextOverlay(ctx, canvas.width, canvas.height, textOptions);
    }
  }, [selectedFilter, showText, textOptions]);

  useEffect(() => {
    if (imageLoaded) {
      redrawCanvas();
    }
  }, [imageLoaded, redrawCanvas]);

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);
    try {
      const blob = await exportCanvasToBlob(canvas);
      onSave(blob);
    } catch {
      console.error("Failed to export canvas");
    } finally {
      setSaving(false);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50">
      <div className="flex flex-col h-full max-h-full bg-white sm:m-4 sm:rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800"
          >
            <X className="w-4 h-4" />
            キャンセル
          </button>
          <h2 className="font-bold text-lg">画像編集</h2>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3"
          >
            <Check className="w-4 h-4" />
            {saving ? "処理中..." : "適用"}
          </button>
        </div>

        {/* Main content - scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Canvas preview */}
          <div className="flex items-center justify-center bg-gray-900 p-4">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[50vh] object-contain"
              style={{ imageRendering: "auto" }}
            />
          </div>

          {/* Controls */}
          <div className="p-4 space-y-5">
            {/* Filter selector */}
            <div>
              <label className="label">フィルター</label>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {Object.entries(FILTERS).map(([key, { filter, label }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedFilter(key)}
                    className="flex flex-col items-center gap-1.5 shrink-0"
                  >
                    <div
                      className={`w-[60px] h-[60px] rounded-full overflow-hidden border-2 transition-colors ${
                        selectedFilter === key
                          ? "border-brand-600 ring-2 ring-brand-300"
                          : "border-gray-200"
                      }`}
                    >
                      {previewUrlRef.current && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrlRef.current}
                          alt={label}
                          className="w-full h-full object-cover"
                          style={{
                            filter: filter === "none" ? undefined : filter,
                          }}
                        />
                      )}
                    </div>
                    <span
                      className={`text-xs ${
                        selectedFilter === key
                          ? "text-brand-600 font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text overlay controls */}
            <div className="card border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="showTextOverlay"
                  className="w-4 h-4 text-brand-600 rounded"
                  checked={showText}
                  onChange={(e) => setShowText(e.target.checked)}
                />
                <label
                  htmlFor="showTextOverlay"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  テキストを追加
                </label>
              </div>

              {showText && (
                <div className="space-y-4">
                  {/* Text input */}
                  <div>
                    <label className="label">テキスト</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="例：本日のおすすめ"
                      value={textOptions.text}
                      onChange={(e) =>
                        setTextOptions((prev) => ({
                          ...prev,
                          text: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Font size slider */}
                  <div>
                    <label className="label">
                      文字サイズ: {textOptions.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="16"
                      max="48"
                      step="1"
                      value={textOptions.fontSize}
                      onChange={(e) =>
                        setTextOptions((prev) => ({
                          ...prev,
                          fontSize: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-brand-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>16px</span>
                      <span>48px</span>
                    </div>
                  </div>

                  {/* Position selector */}
                  <div>
                    <label className="label">位置</label>
                    <div className="grid grid-cols-3 gap-2">
                      {POSITION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setTextOptions((prev) => ({
                              ...prev,
                              position: opt.value,
                            }))
                          }
                          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            textOptions.position === opt.value
                              ? "bg-brand-600 text-white border-brand-600"
                              : "bg-white text-gray-600 border-gray-300 hover:border-brand-400"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color selector */}
                  <div>
                    <label className="label">文字色</label>
                    <div className="flex gap-3">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() =>
                            setTextOptions((prev) => ({
                              ...prev,
                              color: c.value,
                            }))
                          }
                          className={`w-8 h-8 rounded-full ${c.bg} transition-all ${
                            textOptions.color === c.value
                              ? "ring-2 ring-brand-600 ring-offset-2"
                              : ""
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
