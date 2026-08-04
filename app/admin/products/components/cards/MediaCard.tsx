"use client";

import { useRef, useState, type Dispatch } from "react";
import { FormCard } from "@/components/admin/ui/FormCard";
import { Badge } from "@/components/admin/ui/Badge";
import { useToast } from "@/components/admin/ui/Toast";
import { uploadProductMedia, removeProductMedia } from "@/app/admin/products/actions";
import type { ProductFormState } from "@/app/admin/products/types";
import type { ProductFormAction } from "@/app/admin/products/components/useProductForm";

export function MediaCard({
  state,
  dispatch,
  errors,
}: {
  state: ProductFormState;
  dispatch: Dispatch<ProductFormAction>;
  errors: Partial<Record<string, string>>;
}) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  async function uploadFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploadingCount((n) => n + fileArray.length);
    await Promise.all(
      fileArray.map(async (file) => {
        try {
          const formData = new FormData();
          formData.set("file", file);
          const result = await uploadProductMedia(formData);
          if (!result.success) {
            toast({ variant: "error", title: "Upload failed", description: result.error });
            return;
          }
          dispatch({
            type: "ADD_MEDIA",
            media: {
              id: crypto.randomUUID(),
              url: result.media.url,
              providerId: result.media.providerId,
              type: result.media.type,
              thumbnailUrl: result.media.thumbnailUrl,
              altText: "",
              position: state.media.length,
            },
          });
        } catch {
          toast({ variant: "error", title: "Upload failed", description: file.name });
        } finally {
          setUploadingCount((n) => n - 1);
        }
      })
    );
  }

  async function handleRemove(id: string) {
    const item = state.media.find((m) => m.id === id);
    if (!item) return;
    dispatch({ type: "REMOVE_MEDIA", id });
    try {
      await removeProductMedia(item.providerId, item.type, item.dbId);
    } catch {
      // The item's already gone from form state either way — a failed
      // remote cleanup here just means an orphaned Cloudinary asset, not a
      // broken form. Not worth surfacing to the admin mid-edit.
    }
  }

  return (
    <FormCard
      title="Media"
      description="The first item is the featured image shown on product cards."
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          uploadFiles(e.dataTransfer.files);
        }}
        className={`rounded-md border-2 border-dashed p-6 text-center transition-colors ${
          isDraggingOver ? "border-admin-accent bg-admin-accent/5" : "border-admin-border"
        }`}
      >
        <p className="text-sm text-admin-fg mb-1">Drag and drop images or video here</p>
        <p className="text-xs text-admin-muted mb-3">JPEG, PNG, WebP, GIF, MP4, WebM — 15MB max</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-sm rounded-md border border-admin-border text-admin-fg hover:bg-admin-surface-hover transition-colors"
        >
          Browse files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
          aria-label="Upload media files"
        />
        {uploadingCount > 0 && (
          <p className="text-xs text-admin-accent mt-3">
            Uploading {uploadingCount} file{uploadingCount === 1 ? "" : "s"}…
          </p>
        )}
      </div>

      {errors.media && <p className="text-xs text-admin-danger">{errors.media}</p>}

      {state.media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {state.media.map((item, index) => (
            <div key={item.id} className="rounded-md border border-admin-border overflow-hidden">
              <div className="relative aspect-square bg-admin-surface">
                {item.type === "VIDEO" ? (
                  <video src={item.url} className="h-full w-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- Cloudinary-served, fixed-size admin thumbnail
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                )}
                {index === 0 && (
                  <span className="absolute top-1.5 left-1.5">
                    <Badge variant="accent">Featured</Badge>
                  </span>
                )}
              </div>

              <div className="p-2 space-y-1.5">
                <input
                  value={item.altText ?? ""}
                  onChange={(e) =>
                    dispatch({ type: "UPDATE_MEDIA_ALT", id: item.id, altText: e.target.value })
                  }
                  placeholder="Alt text"
                  aria-label={`Alt text for media ${index + 1}`}
                  className="w-full text-xs px-2 py-1 rounded border border-admin-border bg-admin-bg text-admin-fg outline-none focus:border-admin-accent"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => dispatch({ type: "MOVE_MEDIA", id: item.id, direction: "left" })}
                      aria-label="Move left"
                      className="text-xs px-1.5 py-0.5 rounded text-admin-muted hover:text-admin-fg hover:bg-admin-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={index === state.media.length - 1}
                      onClick={() => dispatch({ type: "MOVE_MEDIA", id: item.id, direction: "right" })}
                      aria-label="Move right"
                      className="text-xs px-1.5 py-0.5 rounded text-admin-muted hover:text-admin-fg hover:bg-admin-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      →
                    </button>
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "SET_FEATURED_MEDIA", id: item.id })}
                        className="text-xs px-1.5 py-0.5 rounded text-admin-muted hover:text-admin-fg hover:bg-admin-surface-hover transition-colors"
                      >
                        Set featured
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    aria-label="Remove"
                    className="text-xs text-admin-muted hover:text-admin-danger transition-colors px-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </FormCard>
  );
}
