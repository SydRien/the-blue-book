import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Blue Book",
    short_name: "Blue Book",
    description:
      "A personal cloud-based structured writing environment for screenplays, stage plays, and interactive narratives.",
    start_url: "/",
    display: "standalone",
    background_color: "#efebe5",
    theme_color: "#34507e",
    icons: [
      { src: "/brand/blue-book-icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/brand/blue-book-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/blue-book-icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/brand/blue-book-app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
