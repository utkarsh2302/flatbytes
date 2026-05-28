export type ToastType = "success" | "info" | "error";

export function showToast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("flatbytes:toast", { detail: { message, type } })
  );
}
