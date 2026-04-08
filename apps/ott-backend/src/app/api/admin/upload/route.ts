import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest): Promise<NextResponse> {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 5 MB limit" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const dest = join(process.cwd(), "public", "uploads", filename);

  const bytes = await file.arrayBuffer();
  await writeFile(dest, Buffer.from(bytes));

  return NextResponse.json({ url: `/uploads/${filename}` });
}
