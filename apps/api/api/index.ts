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
    app.server.emit("request", req, res);
  } catch (error) {
    console.error("Failed to bootstrap API handler", error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        error: "Internal server error",
        message: "Server bootstrap failed",
      }),
    );
  }
}
