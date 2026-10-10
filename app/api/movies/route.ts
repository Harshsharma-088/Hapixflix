import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { mapTmdbToAnix } from "@/lib/mapTmdbToAnix";
import { validateOrigin, originBlockedResponse } from "@/lib/origin";

export async function GET(req: NextRequest) {
  try {
    if (!validateOrigin(req.headers.get("origin"))) return originBlockedResponse();
    const featured = req.nextUrl.searchParams.get("featured");
    const trending = req.nextUrl.searchParams.get("trending");

    let tmdbMovies: any[] = [];

    if (featured === "true" || trending === "true") {
      tmdbMovies = await tmdb.getTrending("all");
    } else {
      tmdbMovies = await tmdb.getPopular("movie");
    }

    // Map TMDB movies to the internal Hapixflix format
    const movies = tmdbMovies.map((m) => 
      mapTmdbToAnix(m, featured === "true", trending === "true")
    );

    // If featured, just grab top 5
    if (featured === "true") {
      return NextResponse.json(movies.slice(0, 5));
    }

    return NextResponse.json(movies);
  } catch (error) {
    console.error("There was an issue getting movies from TMDB:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching movies" },
      { status: 500 },
    );
  }
}
