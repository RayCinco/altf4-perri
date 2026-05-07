// useImageDropPaste.ts
// Custom React hook for drag-and-drop and paste image handling
import { useCallback, useEffect } from "react";

export function useImageDropPaste({
  onImage,
  dropRef,
}: {
  onImage: (file: File) => void;
  dropRef: React.RefObject<HTMLElement>;
}) {
  // Handle drag-and-drop
  useEffect(() => {
    const node = dropRef.current;
    if (!node) return;

    function handleDrop(e: DragEvent) {
      e.preventDefault();
      if (e.dataTransfer?.files?.length) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/")) {
          onImage(file);
        }
      }
    }
    function handleDragOver(e: DragEvent) {
      e.preventDefault();
    }
    node.addEventListener("drop", handleDrop);
    node.addEventListener("dragover", handleDragOver);
    return () => {
      node.removeEventListener("drop", handleDrop);
      node.removeEventListener("dragover", handleDragOver);
    };
  }, [dropRef, onImage]);

  // Handle paste
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (e.clipboardData?.files?.length) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith("image/")) {
          onImage(file);
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onImage]);
}
