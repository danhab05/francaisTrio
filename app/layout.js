import "./globals.css";

export const metadata = {
  title: "La Nature Sprint",
  description: "Révision en trios pour Expériences de la nature (CPGE).",
  applicationName: "La Nature Sprint",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Nature",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
