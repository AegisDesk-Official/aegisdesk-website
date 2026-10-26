import { getLoomEmbedUrl, siteConfig } from "@/lib/site-config";

/** Optional walkthrough video. Renders nothing until NEXT_PUBLIC_LOOM_URL is a valid Loom link. */
export function hasVideo(): boolean {
  return getLoomEmbedUrl(siteConfig.loomUrl) !== null;
}

export function VideoSlot() {
  const src = getLoomEmbedUrl(siteConfig.loomUrl);
  if (!src) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="aspect-video w-full">
        <iframe
          src={src}
          title="AegisDesk walkthrough video"
          className="h-full w-full"
          loading="lazy"
          allow="fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
