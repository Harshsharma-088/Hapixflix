export default function PrivacyPage() {
  return (
    <div className="pt-24 px-4 md:px-14 min-h-screen text-white/80 max-w-4xl mx-auto pb-20">
      <h1 className="text-4xl font-bold text-white mb-8 border-b border-white/10 pb-4">Privacy Policy & Legal Disclaimer</h1>
      
      <div className="space-y-6 text-sm md:text-base leading-relaxed">
        <p>
          At <strong>Hapixflix</strong>, we strongly believe in digital privacy. This policy outlines our practices regarding data collection and how we operate as a pure search engine and directory indexer.
        </p>

        <h2 className="text-2xl font-bold text-white mt-8 mb-4">No Media Hosting or Logging</h2>
        <p>
          Hapixflix acts strictly as an automated indexer of links found publicly on the internet. <strong>We do not host, store, or stream any media files from our own servers.</strong> Because all media is routed through third-party CDNs and video hosts, we do not log, track, or record your viewing history of any specific video files.
        </p>

        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Local Storage & Watchlist Data</h2>
        <p>
          Any features relating to "Watchlists," "History," or "Favorites" are handled entirely via client-side Web Storage (Local Storage). This means your data remains locally on your own device and is never transmitted to, stored on, or analyzed by our backend servers. You have full control to clear this data at any time via your browser settings.
        </p>
        
        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Third-Party Links & Services</h2>
        <p>
          Since Hapixflix is an indexer, you may click on links or embedded video players that direct you to third-party domains. We do not control these external sites, and they are governed by their own privacy policies. We encourage you to review the privacy policies of any third-party hosts before interacting with them.
        </p>

        <h2 className="text-2xl font-bold text-white mt-8 mb-4">No Analytics Tracking</h2>
        <p>
          We do not use invasive third-party analytics trackers (such as Google Analytics) to monitor your browsing behavior on our platform. Your presence here is not monetized through targeted data aggregation.
        </p>
      </div>
    </div>
  );
}