import "./globals.css";
import "./styles/public-nav.css";
// Self-contained, `.vr-chat-*`-scoped styles — safe to load globally without
// reaching the pixel-parity pages' own CSS.
import "./styles/floating-chat.css";
import FloatingChat from "@/components/chat/FloatingChat";

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
      <body>
        {children}
        {/* Site-wide chat launcher; hides itself on the dedicated /chat page. */}
        <FloatingChat />
      </body>
    </html>
  );
}
