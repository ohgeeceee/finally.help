// GET /api/library — the starter explainer library for the browse view.

import { json } from "../../lib/http.js";
import { LIBRARY } from "../../lib/library.js";

export async function onRequestGet() {
  return json({ library: LIBRARY }, 200, { "cache-control": "public, max-age=3600" });
}
