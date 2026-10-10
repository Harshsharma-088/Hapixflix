import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

let workerPromise: Promise<{ fetch: (req: Request, env: object) => Promise<Response> }> | null = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = import("@/anixanime/index.js").then((mod) => mod.default) as Promise<any>;
  }
  return workerPromise;
}

async function runWorker(req: NextRequest) {
  const url = req.nextUrl;
  const rest = url.pathname.replace(/^\/api\/anixanime/, "") || "/";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";

  const upstream = new Request(`${proto}://${host}${rest}${url.search}`, {
    method: req.method,
    headers: req.headers,
  });

  const worker = await getWorker();
  const resp = await worker.fetch(upstream as any, {});
  const body = new Uint8Array(await resp.arrayBuffer());
  const headers = new Headers(resp.headers);
  headers.set("Access-Control-Allow-Origin", "*");

  return new NextResponse(body, { status: resp.status, headers });
}

export async function GET(req: NextRequest) {
  try {
    return await runWorker(req);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "anixanime error" }, { status: 500 });
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