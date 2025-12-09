// ========================================================================
// ARQUIVO DEFINITIVO: src/app/layout.tsx
// TRADUÇÃO FIEL, SEM REMOVER NADA
// ========================================================================

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans"; // Usando a importação simplificada
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers"; 

export const metadata: Metadata = {
  title: "Instituto Vigné - Gestão de Tratamentos",
  description: "Sistema de gestão de tratamentos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
            <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          GeistSans.variable, // <-- Esta linha injeta a variável --font-geist-sans
          GeistMono.variable  // <-- Esta linha injeta a variável --font-geist-mono
        )}
      >
        {/* Usamos o <Providers> para carregar TODOS os contextos do projeto original */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}