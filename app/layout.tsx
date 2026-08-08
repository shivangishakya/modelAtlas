import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Model Atlas — Find the right AI model",
  description: "An independent field guide to leading AI models, real-world use cases, limitations, and access options.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
