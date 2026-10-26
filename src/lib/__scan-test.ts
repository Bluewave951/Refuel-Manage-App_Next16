import { readFileSync } from "node:fs";
import { scanReceipt } from "./receipt-scan";

const file = process.argv[2];
const t = Date.now();
scanReceipt(readFileSync(file).toString("base64"), "image/png")
  .then((r) => console.log(JSON.stringify(r, null, 1), `\n${Date.now() - t} ms`))
  .catch((e) => console.error("ERROR:", e.message));
