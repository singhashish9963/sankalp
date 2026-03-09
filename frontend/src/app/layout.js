import './globals.css'
export const metadata = { title: "AI Career Copilot" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}