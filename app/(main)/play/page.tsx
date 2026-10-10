import { Suspense } from "react";
import PlayClient from "@/components/player/PlayClient";

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-[#09090b] items-center justify-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <PlayClient />
    </Suspense>
  );
}
