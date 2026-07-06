import type { Metadata, Viewport } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://octype.app"),
  title: {
    default: "Octype — Free Online Piano Keyboard | Play Piano Online",
    template: "%s | Octype",
  },
  description:
    "A free online piano keyboard playable with a computer keyboard, mouse, or MIDI controller. Premium Salamander grand piano sound with sustain, recording, and metronome.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Octype — Free Online Piano Keyboard | Play Piano Online",
    description:
      "Play a premium sampled grand piano directly in your browser. Supports computer keyboard, MIDI, sustain pedal, recording, and custom layouts.",
    url: "https://octype.app",
    siteName: "Octype",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Octype — Free Online Piano Keyboard | Play Piano Online",
    description:
      "Play a premium sampled grand piano directly in your browser. Supports computer keyboard, MIDI, sustain pedal, recording, and custom layouts.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f0f10",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

/** Registers the service worker on the client. */
function ServiceWorkerRegistration(): JSX.Element {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        `,
      }}
    />
  );
}
