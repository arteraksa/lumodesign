import { Header } from "@/sections/Header";
import { Footer } from "@/sections/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <><Header />{children}<Footer /></>;
}
