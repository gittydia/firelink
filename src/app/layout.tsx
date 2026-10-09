import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Fire Protection Equipment",
    template: "%s | Fire Protection Equipment",
  },
  description:
    "Fire protection equipment product information and inventory visibility — availability shown as Available Locally, In Stock, or Indent / Order Basis.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
