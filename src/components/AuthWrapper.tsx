"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("holicindo_token");
    
    if (!token && pathname !== "/login") {
      router.push("/login");
    } else if (token && pathname === "/login") {
      router.push("/");
    } else {
      setLoading(false);
    }
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-height-screen bg-[#090d16] text-slate-100 flex-col space-y-4">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-400 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-medium">Memuat sistem...</p>
      </div>
    );
  }

  return <>{children}</>;
}
