// Legacy MVP generator. Opt in explicitly to avoid overwriting Blender artwork.
if (!process.argv.includes("--legacy")) throw new Error("Use Blender scripts/blender/create_characters.py. Pass --legacy only to restore old MVP assets.");
import { mkdirSync, writeFileSync } from "node:fs";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { makeCharacter } from "../src/game/characters/model.ts";
class FileReaderShim {
  result: ArrayBuffer | string | null = null;
  onloadend: (() => void) | null = null;
  readAsArrayBuffer(blob: Blob) {
    blob.arrayBuffer().then((b) => {
      this.result = b;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob: Blob) {
    blob.arrayBuffer().then((b) => {
      this.result = `data:${blob.type};base64,${Buffer.from(b).toString("base64")}`;
      this.onloadend?.();
    });
  }
}
Object.assign(globalThis, { FileReader: FileReaderShim });
mkdirSync("public/models", { recursive: true });
for (const [name, female] of [
  ["male_lam", false],
  ["female_lam", true],
] as const) {
  const model = makeCharacter(female);
  const data = await new GLTFExporter().parseAsync(model, {
    binary: true,
    animations: model.animations,
  });
  writeFileSync(`public/models/${name}.glb`, Buffer.from(data as ArrayBuffer));
  console.log(`Generated ${name}.glb`);
}
