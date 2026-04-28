interface AdfNode {
  type: string;
  content?: AdfNode[];
  text?: string;
}

interface AdfDocument {
  type: "doc";
  content: AdfNode[];
}

export function extractPlainText(document: AdfDocument | Record<string, unknown>): string {
  const doc = document as AdfDocument;
  if (!doc || !doc.content) return "";

  function extract(node: AdfNode): string {
    if (node.type === "text") return node.text || "";
    if (node.type === "hardBreak") return "\n";
    if (!node.content) return "";
    return node.content.map(extract).join("");
  }

  return doc.content.map((node) => extract(node as AdfNode)).join("\n").trim();
}
