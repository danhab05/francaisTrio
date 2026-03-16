import "./globals.css";

export const metadata = {
  title: "Trio Nature - Revision",
  description: "Revision en trios pour Experiences de la nature"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
