import { Metadata } from "next";
import "../styles/globals.scss";

export const metadata: Metadata = {
  title: "kabodha",
  description: "kabodha",
};

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
