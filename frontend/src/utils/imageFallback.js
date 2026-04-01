export const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=900";

export function handleProductImageError(event) {
  if (!event.currentTarget.dataset.fallbackApplied) {
    event.currentTarget.dataset.fallbackApplied = "1";
    event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
  }
}
