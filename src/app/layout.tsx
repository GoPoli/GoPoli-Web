import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { themeColors } from "@/config/theme";
import { AuthProvider } from "@/features/auth/auth-context";
import { PwaRegister } from "@/features/pwa/pwa-register";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoPoli",
  description: "Viaje compartido entre estudiantes",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
