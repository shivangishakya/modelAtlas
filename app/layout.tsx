import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "model-atlas-field-guide.shivangi-shakya.chatgpt.site";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    ("localhost" === host.split(":")[0] ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  const title = "Model Atlas — Find the right AI model";
  const description =
    "Describe your use case, get an evidence-led AI model recommendation, and compare leading models with clickable proof sources.";
  return {
    title,
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: "Model Atlas — Find the right AI model for the real work",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
