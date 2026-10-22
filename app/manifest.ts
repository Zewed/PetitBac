import type { MetadataRoute } from "next";

/** Petit Bac s'installe sur l'écran d'accueil du téléphone et s'ouvre en plein écran, comme une app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Petit Bac",
    short_name: "Petit Bac",
    description: "Le petit bac en ligne : plus ta réponse est rare, plus elle rapporte.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
