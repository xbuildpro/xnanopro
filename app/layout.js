import "./styles.css";

export const metadata = {
  title: "XNanoPro — AI Image Studio",
  description: "Create and transform images with XNanoPro.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
