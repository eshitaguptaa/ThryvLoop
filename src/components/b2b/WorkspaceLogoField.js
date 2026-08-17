'use client';

import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import {
  WORKSPACE_DEFAULT_LOGO_SRC,
  WORKSPACE_LOGO_ACCEPT,
  WORKSPACE_LOGO_MAX_BYTES,
  parseWorkspaceLogoFile,
} from '@/lib/workspaceLogo';

/**
 * Logo field with optional immediate callbacks for auto-save flows.
 */
export default function WorkspaceLogoField({
  nameHint = '',
  currentImageUrl = null,
  inputName = 'logo',
  size = 'md',
  allowRemove = false,
  /** When set, file selection is reported instead of only living in form input */
  onLogoFile,
  /** When set, delete is reported to parent for auto-save */
  onLogoRemove,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [removeLogo, setRemoveLogo] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Server image arrived after save — drop local preview
  useEffect(() => {
    if (currentImageUrl && preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }, [currentImageUrl]); // eslint-disable-line react-hooks/exhaustive-deps -- only react to server url

  const dim = size === 'lg' ? 'h-16 w-16' : 'h-14 w-14';
  const customUrl = removeLogo ? null : preview || currentImageUrl;
  const usingDefault = !customUrl;

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    setError('');
    setRemoveLogo(false);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (!file) return;
    const { error: err } = parseWorkspaceLogoFile(file);
    if (err) {
      setError(err);
      e.target.value = '';
      return;
    }
    setPreview(URL.createObjectURL(file));
    onLogoFile?.(file);
  };

  const clearSelection = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    if (onLogoFile || onLogoRemove) {
      // Discarding an unsaved pick — if there was a current logo, no change to server
      if (preview && currentImageUrl) return;
      if (preview && !currentImageUrl) return;
    }
  };

  const clearExisting = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    setRemoveLogo(true);
    if (onLogoRemove) {
      onLogoRemove();
      return;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={`relative shrink-0 overflow-hidden rounded-xl border border-border shadow-sm ${dim} flex items-center justify-center ${
            usingDefault ? 'bg-black border-border' : 'bg-muted'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={usingDefault ? WORKSPACE_DEFAULT_LOGO_SRC : customUrl}
            alt={nameHint ? `${nameHint} logo preview` : 'Workspace logo preview'}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Team logo{' '}
            <span className="font-medium normal-case tracking-normal opacity-80">(optional)</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={inputId}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <ImagePlus className="h-3.5 w-3.5" aria-hidden />
              {customUrl && !removeLogo ? 'Change' : 'Upload'}
            </label>
            <input
              ref={inputRef}
              id={inputId}
              name={onLogoFile ? undefined : inputName}
              type="file"
              accept={WORKSPACE_LOGO_ACCEPT}
              className="sr-only"
              onChange={onFileChange}
            />
            {preview && !onLogoFile ? (
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
              >
                <Trash2 className="h-3 w-3" aria-hidden />
                Delete
              </button>
            ) : null}
            {allowRemove && currentImageUrl && !preview && !removeLogo ? (
              <button
                type="button"
                onClick={clearExisting}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
              >
                <Trash2 className="h-3 w-3" aria-hidden />
                Delete
              </button>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            PNG, JPG, WebP, or GIF · max {Math.round(WORKSPACE_LOGO_MAX_BYTES / (1024 * 1024))} MB
          </p>
          {error ? (
            <p className="text-xs text-rose-600 font-medium" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
      {allowRemove && removeLogo && !onLogoRemove ? (
        <input type="hidden" name="remove_logo" value="1" />
      ) : null}
    </div>
  );
}
