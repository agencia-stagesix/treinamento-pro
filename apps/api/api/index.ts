import { buildApp } from "../src/app.js";

let appPromise: ReturnType<typeof buildApp> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = buildApp();
  }
  const app = await appPromise;
  await app.ready();
  return app;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();

    // Collect request body
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const response = await app.inject({
      method: req.method,
      url: req.url,
      headers: req.headers,
      payload: Buffer.concat(chunks),
    });

    res.statusCode = response.statusCode;
    for (const [key, value] of Object.entries(response.headers)) {
      res.setHeader(key, value as string | string[]);
    }
    res.end(response.rawPayload);
  } catch (error) {
    console.error("Handler error:", error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        error: "Internal server error",
        message: String(error),
      }),
    );
  }
}
