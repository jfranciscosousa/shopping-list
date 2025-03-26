import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Shopping list",
    short_name: "AI Shopping list",
    description:
      "A very simple shopping list app that categorizes items with AI",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        form_factor: "wide",
        sizes: "5088x3694",
        src: "/wide-screenshot.jpeg",
        type: "image/jpeg",
      },
      {
        form_factor: "narrow",
        sizes: "2744x4844",
        src: "/narrow-screenshot.jpeg",
        type: "image/jpeg",
      },
    ],
  };
}
