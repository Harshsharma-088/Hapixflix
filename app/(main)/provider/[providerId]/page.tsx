import ProviderClient from "@/components/provider/ProviderClient";
import { getProviderFeed } from "@/app/actions/provider";
import { PROVIDER_IDS } from "@/lib/providers";
import { notFound } from "next/navigation";

// Same hourly refresh as the home feed.
export const revalidate = 3600;

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const entry = PROVIDER_IDS[providerId];
  if (!entry) notFound();

  const [movieFeed, tvFeed] = await Promise.all([
    getProviderFeed(providerId, "movie", 1),
    getProviderFeed(providerId, "tv", 1),
  ]);

  return (
    <div className="bg-[#09090b] min-h-screen">
      <ProviderClient
        slug={providerId}
        name={entry.name}
        initialMovies={movieFeed.movies}
        initialSeries={tvFeed.movies}
        moviesTotalPages={movieFeed.totalPages}
        seriesTotalPages={tvFeed.totalPages}
      />
    </div>
  );
}
