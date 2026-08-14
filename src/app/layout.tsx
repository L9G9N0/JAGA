import type { Metadata } from "next";
import { Lora, Cinzel } from "next/font/google";
import "./globals.css";
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/Navbar";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JAGA - Devotional Discipline & Learning",
  description: "A production-grade devotional discipline, learning, and accountability platform.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Try to retrieve user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  let fullName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();
    if (profile) {
      role = profile.role;
      fullName = profile.full_name;
    }
  }

  return (
    <html
      lang="en"
      className={`${lora.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-parchment text-primary-dark-blue selection:bg-light-devotional-blue">
        <Navbar userEmail={user?.email} userRole={role} userName={fullName} />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
