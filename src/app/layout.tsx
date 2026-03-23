import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "StudyHub - Học tập cộng đồng",
    template: "%s | StudyHub",
  },
  description:
    "Nền tảng học tập cộng đồng cho sinh viên: tạo hồ sơ học tập, tham gia nhóm theo môn, thảo luận trên diễn đàn, dùng Pomodoro và đăng ký mentor.",
  keywords: [
    "học tập",
    "nhóm học",
    "diễn đàn học tập",
    "pomodoro",
    "mentor",
    "sinh viên",
    "StudyHub",
  ],
  authors: [{ name: "StudyHub Team" }],
  creator: "StudyHub",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://studyhub.vn",
    siteName: "StudyHub",
    title: "StudyHub - Học tập cộng đồng",
    description:
      "Kết nối sinh viên cùng học: nhóm học theo môn, diễn đàn thảo luận, Pomodoro tập trung và mentor đồng hành.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StudyHub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyHub - Học tập cộng đồng",
    description:
      "Kết nối sinh viên cùng học: nhóm học theo môn, diễn đàn thảo luận, Pomodoro tập trung và mentor đồng hành.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
