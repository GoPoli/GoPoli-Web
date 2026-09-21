"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./button";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Pie de acciones (botones Cancelar / Confirmar, etc.) */
  footer?: ReactNode;
  /** Cerrar al pulsar el fondo. Por defecto true. */
  closeOnBackdrop?: boolean;
  className?: string;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnBackdrop = true,
  className = "",
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar diálogo"
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={[
          "relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-lg",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="text-lg font-semibold text-[var(--foreground,#171717)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1 text-[var(--gopoli-text-muted,#757575)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)]"
          >
            <span aria-hidden className="block text-xl leading-none">
              ×
            </span>
          </button>
        </div>
        <div className="text-sm text-[var(--foreground,#171717)]">{children}</div>
        {footer ? <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

export type ConfirmModalProps = Omit<ModalProps, "footer" | "children"> & {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  onConfirm: () => void;
};

export function ConfirmModal({
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "primary",
  onConfirm,
  onClose,
  ...rest
}: ConfirmModalProps) {
  return (
    <Modal
      {...rest}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
