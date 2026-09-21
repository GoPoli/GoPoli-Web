import type { MetadataRoute } from "next";

/** Manifest PWA — colores alineados con Flutter `AppColors.verdePrimario`. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GoPoli",
    short_name: "GoPoli",
    description:
      "Viaje compartido entre estudiantes del Politécnico (@elpoli.edu.co).",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1B5E20",
    orientation: "portrait-primary",
    lang: "es",
    icons: [
      {
        src: "/icons/Icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/Icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/Icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/Icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
