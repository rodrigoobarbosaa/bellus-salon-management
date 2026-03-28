import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bellus Salon Management",
    short_name: "Bellus",
    description: "Sistema de gestão para salão de beleza",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FAFAF9",
    theme_color: "#C9A96E",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
