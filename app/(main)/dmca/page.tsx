export default function DmcaPage() {
  return (
    <div className="pt-24 px-4 md:px-14 min-h-screen text-white/80 max-w-4xl mx-auto pb-20">
      <h1 className="text-4xl font-bold text-white mb-2">DMCA Notice & Disclaimer</h1>
      <p className="text-white/50 text-sm mb-8 border-b border-white/10 pb-4">Important information about content hosting and copyright policies</p>
      
      <div className="space-y-10 text-sm md:text-base leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-white mb-3">Important Notice</h2>
          <p>
            <strong>Hapixflix</strong> does not host any movies, TV shows, or media files on its own servers. All content is provided by non-affiliated third-party public providers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">DMCA Notice</h2>
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Digital Millennium Copyright Act compliance information</p>
          <p className="mb-3">
            <strong>Hapixflix</strong> operates in accordance with the Digital Millennium Copyright Act (DMCA). We respect the intellectual property rights of others and expect our users to do the same.
          </p>
          <ul className="space-y-2 text-white/70">
            <li><strong className="text-white">Content Hosting:</strong> We do not host, store, or distribute any copyrighted material on our servers. All content is indexed from publicly available sources on the internet.</li>
            <li><strong className="text-white">Third-Party Content:</strong> All movies, TV shows, and media content are provided by non-affiliated third-party providers. We merely index and provide links to content found publicly available on the internet.</li>
            <li><strong className="text-white">Content Removal:</strong> If you believe that any content accessible through our service infringes your copyright, please contact the original content provider or hosting service directly.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">Disclaimer</h2>
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Legal disclaimer and terms of service</p>
          <ul className="space-y-2 text-white/70">
            <li><strong className="text-white">No Hosting:</strong> <strong>Hapixflix</strong> does not host any movies, TV shows, or media files on its own servers.</li>
            <li><strong className="text-white">Third-Party Sources:</strong> All content is provided by non-affiliated third-party public providers that are freely available on the internet.</li>
            <li><strong className="text-white">Content Indexing:</strong> We merely index links and content found publicly on the Internet and provide a search interface.</li>
            <li><strong className="text-white">Legal Issues:</strong> If you have any legal issues or copyright concerns, please contact the appropriate media file owners or host sites directly.</li>
            <li><strong className="text-white">User Responsibility:</strong> Users are responsible for ensuring their use of any content complies with applicable laws in their jurisdiction.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">Contact Information</h2>
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">How to reach us regarding copyright concerns</p>
          <div className="space-y-4 text-white/70">
            <div>
              <p><strong className="text-white">For Copyright Holders</strong></p>
              <p>If you are a copyright holder and believe that content accessible through our service infringes your rights, please note that we do not host the content directly.</p>
              <p className="mt-1"><strong className="text-white">Recommended Action:</strong> Contact the hosting provider or original source of the content directly for fastest resolution.</p>
            </div>
            <div>
              <p><strong className="text-white">Technical Issues</strong></p>
              <p>For technical issues with the website functionality, broken links, or other non-copyright related matters, you may contact us through our support channels.</p>
              <p className="mt-1"><strong className="text-white">Note:</strong> We cannot assist with content-related copyright issues as we do not control the source material.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">Fair Use Statement</h2>
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Information about fair use and educational purposes</p>
          <p className="mb-3">
            <strong>Hapixflix</strong> may contain copyrighted material the use of which has not always been specifically authorized by the copyright owner. We believe this constitutes a &apos;fair use&apos; of any such copyrighted material as provided for in section 107 of the US Copyright Law.
          </p>
          <ul className="space-y-2 text-white/70">
            <li><strong className="text-white">Educational Purpose:</strong> The material on this site is distributed without profit for research and educational purposes. If you wish to use copyrighted material from this site for purposes of your own that go beyond &apos;fair use&apos;, you must obtain permission from the copyright owner.</li>
            <li><strong className="text-white">Good Faith Compliance:</strong> We operate in good faith and aim to comply with all applicable copyright laws. We do not encourage or condone copyright infringement.</li>
          </ul>
        </section>

        <p className="text-white/40 text-xs border-t border-white/10 pt-6">
          This page was last updated on 7/7/2026. We reserve the right to update this notice at any time.
        </p>

      </div>
    </div>
  );
}