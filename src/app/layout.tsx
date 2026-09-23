import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";

import { themeColors } from "@/config/theme";
import { AuthProvider } from "@/features/auth/auth-context";
import { PwaRegister } from "@/features/pwa/pwa-register";

import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoPoli",
  description: "Viaje compartido entre estudiantes del Politécnico",
  applicationName: "GoPoli",
  appleWebApp: {
    capable: true,
    title: "GoPoli",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/gopoli-mark.svg" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: themeColors.primary,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(!('serviceWorker'in navigator))return;var k='gopoli-sw-reset';if(sessionStorage.getItem(k)==='1')return;navigator.serviceWorker.getRegistrations().then(function(regs){if(!regs.length)return false;sessionStorage.setItem(k,'1');return Promise.all(regs.map(function(r){return r.unregister()})).then(function(){if(!window.caches)return true;return caches.keys().then(function(keys){return Promise.all(keys.map(function(key){return caches.delete(key)}))})}).then(function(){return true})}).then(function(did){if(did)location.reload()})})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
