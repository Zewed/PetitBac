import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Shantell_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], axes: ["opsz", "wdth"] });
const shantell = Shantell_Sans({ variable: "--font-shantell", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Petit Bac",
  description: "Le petit bac en ligne : plus ta réponse est rare, plus elle rapporte.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${shantell.variable}`}>
      <body>{children}</body>
    </html>
  );
}
