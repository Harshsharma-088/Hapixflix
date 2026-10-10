import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { validateOrigin, originBlockedResponse } from "@/lib/origin";

export const revalidate = 3600; // Cache these redirects for 1 hour locally if Next supports it

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    if (!validateOrigin(req.headers.get("origin"))) return originBlockedResponse();
    const { type, id } = await params;
    
    // Fallback provided by the client in case we can't find an English image
    const fallbackUrl = req.nextUrl.searchParams.get("fallback") || "";
    
    // Only fetch for 'movie' or 'tv'
    if (type !== "movie" && type !== "tv") {
      return fallbackUrl 
        ? NextResponse.redirect(fallbackUrl, { status: 302 })
        : NextResponse.json({ error: "Invalid media type" }, { status: 400 });
    }

    const details = await tmdb.getDetails(type, id);
    
    if (details && details.images && details.images.backdrops) {
      const backdrops = details.images.backdrops;
      
      // Titled english backdrop sorting logic (en language)
      const bestBackdrop = backdrops
        .filter((b: any) => b.iso_639_1 === "en")
        .sort((a: any, b: any) => b.vote_average - a.vote_average)[0]
        ?? backdrops[0];
        
      if (bestBackdrop && bestBackdrop.file_path) {
        const finalUrl = `https://image.tmdb.org/t/p/w780${bestBackdrop.file_path}`;
        // Cache the redirect aggressively on Vercel Edge Cache (1 year)
        return NextResponse.redirect(finalUrl, { 
          status: 302,
          headers: {
            "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=86400"
          }
        });
      }
    }

    // If no backdrops found, redirect to fallback generic image
    if (fallbackUrl) {
      return NextResponse.redirect(fallbackUrl, { 
        status: 302,
        headers: {
          "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=86400"
        }
      });
    }

    return NextResponse.json({ error: "No image found" }, { status: 404 });

  } catch (error) {
    console.error("Error generating image proxy redirect:", error);
    const fallbackUrl = req.nextUrl.searchParams.get("fallback") || "";
    if (fallbackUrl) {
      return NextResponse.redirect(fallbackUrl, { status: 302 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
