import path from "node:path";
import os from "node:os";
import { mkdtemp, writeFile } from "node:fs/promises";
import { generateSpriteSheet } from "../../modules/spritesheet/spritesheet";
import { type NextRequest } from "next/server";

export const config = {
  runtime: "experimental-edge",
};

type FilePath = string;

export default async (req: NextRequest): Promise<Response> => {
  let resp: FormData | null = null;

  const formData = await req.formData();
  const imageFiles = formData.getAll("images");

  if (imageFiles) {
    const imageFilePaths = await createTempFiles(imageFiles as File[]);
    const spritesheet = await generateSpriteSheet(imageFilePaths, "sprite");

    resp = new FormData();
    resp.append("css", spritesheet.css);
    resp.append("image", new Blob([spritesheet.image.buffer]));
  }

  return new Response(resp);
};

async function createTempFiles(files: File[]): Promise<FilePath[]> {
  const tempFilePaths: string[] = [];
  const tempDirPath = await mkdtemp(path.join(os.tmpdir(), "sprite-"));

  for (const file of files) {
    const fileBuffer = await file.arrayBuffer();
    const tempFilePath = path.join(tempDirPath, file.name);

    await writeFile(tempFilePath, new Uint8Array(fileBuffer));
    tempFilePaths.push(tempFilePath);
  }

  return tempFilePaths;
}
