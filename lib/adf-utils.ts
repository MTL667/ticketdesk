interface AdfNode {
  type: string;
  content?: AdfNode[];
  text?: string;
  attrs?: Record<string, unknown>;
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

export function adfContainsMention(
  document: AdfDocument | Record<string, unknown>,
  accountId: string
): boolean {
  if (!accountId) return false;
  const doc = document as AdfDocument;
  if (!doc || !doc.content) return false;

  function hasMention(node: AdfNode): boolean {
    if (node.type === "mention") {
      if (node.attrs?.id === accountId || node.attrs?.accountId === accountId) return true;
    }
    if (!node.content) return false;
    return node.content.some(hasMention);
  }

  return doc.content.some((node) => hasMention(node as AdfNode));
}

export function textContainsMention(
  document: AdfDocument | Record<string, unknown>,
  mentionName: string
): boolean {
  if (!mentionName) return false;
  const text = extractPlainText(document).toLowerCase();
  return text.includes(`@${mentionName.toLowerCase()}`);
}

export function rawBodyContainsMention(
  body: unknown,
  accountId: string
): boolean {
  if (!accountId) return false;
  if (typeof body === "string") {
    return body.includes(`[~accountid:${accountId}]`) || body.includes(accountId);
  }
  const str = JSON.stringify(body);
  return str.includes(accountId);
}
