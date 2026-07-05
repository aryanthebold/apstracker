import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import { Toaster } from "react-hot-toast";
import ConstellationBackground from "@/components/ConstellationBackground";
import SmoothScroll from "@/components/SmoothScroll";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "APS Tracker- GL Bajaj (2024-28)",
  description: "Academic Leaderboard & Result Tracker for GL Bajaj CSE/CST Batch of 2024-28. Upload your result PDFs, view analytics, and check subject toppers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} antialiased dark`}
    >
      <body className="min-h-screen flex flex-col text-text-primary font-sans selection:bg-accent-primary/30 selection:text-accent-primary relative">
        {/* Floating Iridescent Background Mesh */}
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-[#080A0F]">
          <ConstellationBackground />
          {/* Primary violet/indigo blob — top left */}
          <div className="absolute top-[-15%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-violet-700/18 via-indigo-800/15 to-blue-900/12 blur-[120px] animate-blob-float-1" />
          {/* Fuchsia/purple blob — bottom right */}
          <div className="absolute bottom-[-20%] right-[-12%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-tl from-fuchsia-700/15 via-purple-800/18 to-violet-900/12 blur-[140px] animate-blob-float-2" />
          {/* Cyan/teal accent blob — center */}
          <div className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-r from-cyan-700/10 via-sky-800/12 to-blue-700/10 blur-[110px] animate-blob-float-3" />
          {/* Extra deep pink accent — top right */}
          <div className="absolute top-[5%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-bl from-pink-700/8 via-rose-800/6 to-transparent blur-[100px] animate-blob-float-1" style={{ animationDelay: '8s' }} />

          {/* Twinkling Stars */}
          <div className="absolute inset-0 z-0">
            {[
              { top: '8%', left: '12%', size: 1.5, delay: 0.5, duration: 3.5 },
              { top: '15%', left: '80%', size: 2.0, delay: 1.2, duration: 4.2 },
              { top: '22%', left: '42%', size: 1.0, delay: 2.1, duration: 2.8 },
              { top: '34%', left: '68%', size: 2.2, delay: 0.2, duration: 5.0 },
              { top: '40%', left: '9%', size: 1.5, delay: 3.4, duration: 3.1 },
              { top: '55%', left: '92%', size: 2.0, delay: 1.8, duration: 4.5 },
              { top: '64%', left: '28%', size: 1.2, delay: 0.9, duration: 3.9 },
              { top: '70%', left: '58%', size: 2.5, delay: 2.5, duration: 4.8 },
              { top: '78%', left: '18%', size: 1.5, delay: 4.1, duration: 3.3 },
              { top: '85%', left: '74%', size: 2.0, delay: 1.5, duration: 4.1 },
              { top: '4%', left: '48%', size: 2.0, delay: 0.8, duration: 3.0 },
              { top: '18%', left: '33%', size: 1.2, delay: 2.7, duration: 4.0 },
              { top: '28%', left: '86%', size: 1.8, delay: 1.1, duration: 3.6 },
              { top: '46%', left: '24%', size: 2.2, delay: 3.9, duration: 4.9 },
              { top: '50%', left: '64%', size: 1.0, delay: 0.3, duration: 2.5 },
              { top: '62%', left: '11%', size: 1.6, delay: 2.0, duration: 3.8 },
              { top: '76%', left: '46%', size: 2.0, delay: 1.6, duration: 4.3 },
              { top: '90%', left: '36%', size: 1.4, delay: 3.1, duration: 3.2 },
              { top: '86%', left: '94%', size: 2.5, delay: 0.7, duration: 5.2 },
              { top: '94%', left: '8%', size: 1.0, delay: 2.4, duration: 2.9 }
            ].map((star, idx) => (
              <div
                key={idx}
                className="absolute rounded-full bg-white/70"
                style={{
                  top: star.top,
                  left: star.left,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  animation: `twinkle ${star.duration}s ease-in-out infinite alternate`,
                  animationDelay: `${star.delay}s`,
                  boxShadow: star.size > 2 ? '0 0 6px 1px rgba(255, 255, 255, 0.4)' : 'none'
                }}
              />
            ))}
          </div>

          {/* Slow Drifting Nebula Clouds */}
          <div className="absolute inset-0 z-0">
            {/* Cloud 1 */}
            <div className="absolute top-[12%] left-[10%] w-[38vw] h-[15vw] rounded-full bg-gradient-to-r from-blue-400/5 to-violet-500/5 blur-[70px] pointer-events-none animate-cloud-drift-1" />
            {/* Cloud 2 */}
            <div className="absolute bottom-[22%] right-[8%] w-[45vw] h-[18vw] rounded-full bg-gradient-to-r from-cyan-400/4 to-purple-500/4 blur-[80px] pointer-events-none animate-cloud-drift-2" />
          </div>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#111318",
              color: "#F0F2F5",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            },
            success: {
              iconTheme: {
                primary: "#3DDC84",
                secondary: "#111318",
              },
            },
            error: {
              iconTheme: {
                primary: "#FF5C5C",
                secondary: "#111318",
              },
            },
          }}
        />
        <Navbar />
        <main className="flex-1 flex flex-col pb-20 md:pb-0">
          <SmoothScroll>
            <PageTransition>{children}</PageTransition>
          </SmoothScroll>
        </main>
      </body>
    </html>
  );
}
