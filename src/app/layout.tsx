import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/lib/currency/context";
import { ThemeProvider } from "@/lib/theme/context";
import { SidebarProvider } from "@/lib/sidebar/context";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Sidebar } from "@/components/layout/Sidebar";
import { PopUnderScript } from "@/components/ads/PopUnderScript";
import { SITE, webAppJsonLd, websiteJsonLd, organizationJsonLd } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    siteName: SITE.name,
    type: "website",
  },
};

/**
 * Blocking no-flash theme script. Reads the stored preference and applies
 * data-theme + accent hue to <html> before first paint.
 */
const themeInitScript = `(function(){try{var raw=localStorage.getItem("quantiva:preferences");var p=raw?JSON.parse(raw):null;var d=p&&p.data?p.data:p;var mode=(d&&d.theme)||"dark";var hue=(d&&typeof d.accentHue==="number")?d.accentHue:262;var r=mode;if(mode==="system"){r=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}else if(mode==="custom"){r="dark";}var el=document.documentElement;el.dataset.theme=r;el.style.setProperty("--accent-hue",String(hue));el.style.colorScheme=r;}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
  <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
</head>
      <body className="app-backdrop flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <ThemeProvider>
          <CurrencyProvider>
            <SidebarProvider>
              <SiteHeader />
              <div className="flex flex-1">
                <Sidebar />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex-1">{children}</div>
                  <SiteFooter />
                </div>
              </div>
              <PopUnderScript />
            </SidebarProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
