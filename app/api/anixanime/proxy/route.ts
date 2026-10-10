import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function resolve() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
  };
}

function rewriteM3U8(text: string, target: string, base: string, origReferer: string) {
  const targetUrl = new URL(target);
  const lines = text.split("\n");

  const rewrittenLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // Handle AES-128 Encryption Keys (#EXT-X-KEY:METHOD=AES-128,URI="...")
    if (trimmed.startsWith("#EXT-X-KEY")) {
      return line.replace(/URI=["']([^"']+)["']/gi, (_, keyUri) => {
        let fullKeyUrl: string;
        try {
          fullKeyUrl = new URL(keyUri, targetUrl).toString();
        } catch {
          return `URI="${keyUri}"`;
        }
        const proxiedKey = `${base}/api/anixanime/proxy?url=${encodeURIComponent(fullKeyUrl)}&referer=${encodeURIComponent(origReferer)}`;
        return `URI="${proxiedKey}"`;
      });
    }

    if (trimmed.startsWith("#")) return line;

    let full: string;
    try {
      full = new URL(trimmed, targetUrl).toString();
    } catch {
      return line;
    }
    return `${base}/api/anixanime/proxy?url=${encodeURIComponent(full)}&referer=${encodeURIComponent(origReferer)}`;
  });

  // Ensure mandatory #EXTM3U header at line 1 for Hls.js compliance
  if (!rewrittenLines[0] || !rewrittenLines[0].trim().startsWith("#EXTM3U")) {
    rewrittenLines.unshift("#EXTM3U");
  }

  return rewrittenLines.join("\n");
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const target = url.searchParams.get("url");
  if (!target) return NextResponse.json({ error: "Missing required ?url= param" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url param" }, { status: 400 });
  }

  let referer = url.searchParams.get("referer") ?? parsed.origin + "/";
  let originHeader = "https://flixcloud.cc";
  try {
    originHeader = new URL(referer).origin;
  } catch {}

  // Override for specific streaming domains that reject the default flixcloud fallback
  if (target.includes("krussdomi.com") || target.includes("kickassanime")) {
    originHeader = "https://krussdomi.com";
    referer = "https://krussdomi.com/";
  } else if (target.includes("animeapps.top")) {
    originHeader = "https://playeng.animeapps.top";
    referer = "https://playeng.animeapps.top/";
  } else if (target.includes("allmanga") || target.includes("allanime")) {
    originHeader = "https://allmanga.to";
    referer = "https://allmanga.to/";
  } else if (target.includes("animegg")) {
    originHeader = "https://www.animegg.org";
    referer = "https://www.animegg.org/";
  }

  // Pass Range headers for media streaming
  const rangeHeader = req.headers.get("range");

  // Forward the real client IP so IP-bound JWT tokens (like flixcloud's) validate correctly
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "";

  const upstreamHeaders: Record<string, string> = {
    "User-Agent": req.headers.get("user-agent") || UA,
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: referer,
    Origin: originHeader,
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
  };
  if (rangeHeader) {
    upstreamHeaders["Range"] = rangeHeader;
  }
  if (clientIp && clientIp !== "::1" && clientIp !== "127.0.0.1") {
    upstreamHeaders["X-Forwarded-For"] = clientIp;
    upstreamHeaders["X-Real-IP"] = clientIp;
  }

  try {
    const upstream = await fetch(target, {
      headers: upstreamHeaders,
    });

    const ct = upstream.headers.get("Content-Type") ?? "";
    const isM3U8 =
      ct.includes("mpegurl") ||
      ct.includes("x-mpegurl") ||
      parsed.pathname.endsWith(".m3u8") ||
      parsed.pathname.endsWith(".m3u");

    if (!upstream.ok) {
      return new NextResponse(await upstream.text(), {
        status: upstream.status,
        headers: { "Content-Type": ct || "text/plain", ...resolve() },
      });
    }

    if (isM3U8) {
      const text = await upstream.text();

      // Detect encrypted/invalid m3u8 (no standard HLS tags = CDN-encrypted content)
      const isValidHls =
        text.includes("#EXTM3U") ||
        text.includes("#EXT-X-STREAM-INF") ||
        text.includes("#EXTINF") ||
        text.includes("#EXT-X-TARGETDURATION") ||
        text.includes("#EXT-X-MEDIA");

      if (!isValidHls) {
        console.warn(`[proxy] Non-HLS content returned for ${target} (${text.length} bytes). Possible IP-bound token mismatch.`);
        return new NextResponse(
          JSON.stringify({ error: "encrypted_stream", message: "CDN returned encrypted content. IP-bound token mismatch." }),
          { status: 502, headers: { "Content-Type": "application/json", ...resolve() } }
        );
      }

      const rewritten = rewriteM3U8(text, target, url.origin, referer);
      return new NextResponse(rewritten, {
        status: 200,
        headers: { "Content-Type": "application/vnd.apple.mpegurl", ...resolve() },
      });
    }

    // Stream MP4 / Media chunks directly without downloading entire file into memory
    const headers = new Headers(resolve());
    if (ct) headers.set("Content-Type", ct);
    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    const acceptRanges = upstream.headers.get("accept-ranges");
    if (contentLength) headers.set("Content-Length", contentLength);
    if (contentRange) headers.set("Content-Range", contentRange);
    if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);

    return new NextResponse(upstream.body as any, {
      status: upstream.status,
      headers,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Proxy failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}