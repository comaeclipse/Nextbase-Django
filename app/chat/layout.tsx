import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../styles/shadcn.css";

export const metadata: Metadata = {
  title: "Ask about cities — VetRetire",
  description:
    "Chat to find towns like a city you know, or the best-fit towns for a person — grounded in cited data, with honest caveats.",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      {children}
    </>
  );
}
