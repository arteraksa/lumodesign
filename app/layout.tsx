import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { PointerGlow } from "@/components/effects/PointerGlow";
import { siteConfig } from "@/lib/content/site";

const satoshi = localFont({
  variable: "--font-satoshi",
  display: "swap",
  src: [
    { path: "./fonts/satoshi-light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/satoshi-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/satoshi-medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/satoshi-bold.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "LUMO — Design inteligente", template: "%s | LUMO" },
  description: siteConfig.description,
  openGraph: { title: "LUMO", description: siteConfig.description, type: "website", locale: "pt_BR" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05020d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={satoshi.variable}>
      <body>
        <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
        <PointerGlow />
        {children}
      </body>
    </html>
  );
}
