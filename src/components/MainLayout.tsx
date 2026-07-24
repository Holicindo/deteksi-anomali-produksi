"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import AuthWrapper from "./AuthWrapper";
import Footer from "./Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <AuthWrapper>{children}</AuthWrapper>;
  }

  return (
    <AuthWrapper>
      {/* Outer scroll container — kalau di-zoom, konten tidak mengecil, keluar scrollbar */}
      <div className="overflow-auto" style={{ width: "100vw", height: "100vh", background: "var(--sidebar-bg)" }}>
        {/* Inner fixed minimum size — komposisi dipertahankan */}
        <div className="flex" style={{ minWidth: "1280px", minHeight: "720px", width: "100%", height: "100%" }}>

          <Sidebar />

          {/* Main content — rounded hanya di kiri */}
          <main
            className="flex-1 flex flex-col overflow-hidden relative"
            style={{
              background: "var(--app-bg)",
              borderRadius: "1.5rem 0 0 1.5rem",
            }}
          >
            {/* Subtle glow orb */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 w-[800px] h-[400px] bg-sky-500/8 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10">
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
              <div className="max-w-7xl mx-auto w-full mt-auto">
                <Footer />
              </div>
            </div>
          </main>

        </div>
      </div>
    </AuthWrapper>
  );
}
