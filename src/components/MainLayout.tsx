"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import AuthWrapper from "./AuthWrapper";
import Footer from "./Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <AuthWrapper>
      <div className="min-h-screen flex flex-col md:flex-row">
        {!isLoginPage && <Sidebar />}
        <main className={`flex-1 flex flex-col justify-between transition-all duration-200 ${isLoginPage ? "" : "md:ml-64 p-6 md:p-8"}`}>
          <div>{children}</div>
          {!isLoginPage && <Footer />}
        </main>
      </div>
    </AuthWrapper>
  );
}
