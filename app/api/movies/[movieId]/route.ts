import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { mapTmdbToAnix } from "@/lib/mapTmdbToAnix";
import { validateOrigin, originBlockedResponse } from "@/lib/origin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    if (!validateOrigin(req.headers.get("origin"))) return originBlockedResponse();
    const { movieId } = await params;
    
    // Attempt to fetch as movie first
    let tmdbData = await tmdb.getDetails("movie", movieId);
    
    // If not found or error, try TV
    if (!tmdbData || tmdbData.success === false) {
      tmdbData = await tmdb.getDetails("tv", movieId);
    }

    if (!tmdbData || tmdbData.success === false) {
      return NextResponse.json(
        { error: "Movie not found" },
        { status: 404 }
      );
    }

    const movie = mapTmdbToAnix(tmdbData);

    return NextResponse.json(movie);
  } catch (error) {
    console.error("Error fetching movie from TMDB:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
