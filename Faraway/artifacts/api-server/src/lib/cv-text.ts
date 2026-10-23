import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

/** Extract plain text from a base64-encoded CV (PDF, DOCX or plain text). */
export async function extractCvText(base64: string, fileName?: string, mimeType?: string): Promise<string> {
  const clean = base64.includes(",") ? base64.slice(base64.indexOf(",") + 1) : base64;
  const buf = Buffer.from(clean, "base64");
  const name = (fileName ?? "").toLowerCase();
  const mime = (mimeType ?? "").toLowerCase();

  const isPdf = mime.includes("pdf") || name.endsWith(".pdf") || buf.subarray(0, 4).toString() === "%PDF";
  if (isPdf) {
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }

  const isDocx =
    mime.includes("wordprocessingml") || name.endsWith(".docx") || buf.subarray(0, 2).toString() === "PK";
  if (isDocx) {
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return value;
  }

  return buf.toString("utf8");
}
