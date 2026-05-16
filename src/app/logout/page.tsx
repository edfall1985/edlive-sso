"use client";

import { signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function LogoutHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") ||
    (typeof window !== "undefined" ? window.location.origin.replace("sso.", "live.") : "https://live.digtri.com") + "/logout";

  useEffect(() => {
    // Add logout flag so EdLive clears its cookie
    const url = new URL(callbackUrl);
    url.searchParams.set("logout", "1");
    signOut({ callbackUrl: url.toString(), redirect: true });
  }, [callbackUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Logging out...</p>
      </div>
    </div>
  );
}

export default function LogoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <LogoutHandler />
    </Suspense>
  );
}
