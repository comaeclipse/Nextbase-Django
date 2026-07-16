import "./globals.css";
import "./styles/public-nav.css";

/*
 * Minimal root layout. No font application here — each ported page sets its
 * own font-family via copied VetRetire CSS to preserve pixel parity.
 * Per-route page titles are defined via each segment's `metadata`.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
