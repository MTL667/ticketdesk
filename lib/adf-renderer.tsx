"use client";

import React, { type ReactNode } from "react";

interface AdfNode {
  type: string;
  content?: AdfNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
}

interface AdfDocument {
  version?: number;
  type: "doc";
  content: AdfNode[];
}

function renderMarks(text: string, marks?: AdfNode["marks"]): ReactNode {
  if (!marks || marks.length === 0) return text;

  let node: ReactNode = text;
  for (const mark of marks) {
    switch (mark.type) {
      case "strong":
        node = <strong>{node}</strong>;
        break;
      case "em":
        node = <em>{node}</em>;
        break;
      case "underline":
        node = <u>{node}</u>;
        break;
      case "strike":
        node = <s>{node}</s>;
        break;
      case "code":
        node = (
          <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-xs font-mono">
            {node}
          </code>
        );
        break;
      case "link": {
        const href = (mark.attrs?.href as string) || "#";
        node = (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            {node}
          </a>
        );
        break;
      }
      default:
        break;
    }
  }
  return node;
}

function renderNode(node: AdfNode, key: number): ReactNode {
  switch (node.type) {
    case "doc":
      return <>{(node.content || []).map((child, i) => renderNode(child, i))}</>;

    case "paragraph":
      return (
        <p key={key} className="mb-1 last:mb-0">
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </p>
      );

    case "text":
      return (
        <React.Fragment key={key}>
          {renderMarks(node.text || "", node.marks)}
        </React.Fragment>
      );

    case "heading": {
      const level = (node.attrs?.level as number) || 1;
      const Tag = `h${Math.min(level, 6)}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return (
        <Tag key={key} className="font-bold mb-1">
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </Tag>
      );
    }

    case "bulletList":
      return (
        <ul key={key} className="list-disc pl-4 mb-1">
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key} className="list-decimal pl-4 mb-1">
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </ol>
      );

    case "listItem":
      return (
        <li key={key}>
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </li>
      );

    case "codeBlock":
      return (
        <pre key={key} className="bg-gray-100 rounded p-2 text-xs font-mono overflow-x-auto mb-1">
          <code>
            {(node.content || []).map((child) => child.text || "").join("")}
          </code>
        </pre>
      );

    case "hardBreak":
      return <br key={key} />;

    case "blockquote":
      return (
        <blockquote key={key} className="border-l-2 border-gray-300 pl-3 italic mb-1">
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </blockquote>
      );

    case "mediaSingle":
    case "mediaGroup":
      return (
        <div key={key} className="my-1">
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </div>
      );

    case "media": {
      const alt = (node.attrs?.alt as string) || "attachment";
      return (
        <span key={key} className="text-blue-600 text-xs">
          [📎 {alt}]
        </span>
      );
    }

    case "table":
      return (
        <div key={key} className="overflow-x-auto mb-1">
          <table className="border-collapse text-xs">
            <tbody>
              {(node.content || []).map((child, i) => renderNode(child, i))}
            </tbody>
          </table>
        </div>
      );

    case "tableRow":
      return (
        <tr key={key}>
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </tr>
      );

    case "tableCell":
    case "tableHeader":
      return (
        <td key={key} className="border border-gray-200 px-2 py-1">
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </td>
      );

    default:
      console.warn("adf.unknown_type", { type: node.type });
      if (node.content) {
        return <>{(node.content).map((child, i) => renderNode(child, i))}</>;
      }
      return null;
  }
}

export function AdfRenderer({ document }: { document: AdfDocument | Record<string, unknown> }) {
  const doc = document as AdfDocument;
  if (!doc || !doc.content || !Array.isArray(doc.content)) {
    return null;
  }
  return <div className="adf-content text-sm">{renderNode(doc as AdfNode, 0)}</div>;
}

export { extractPlainText } from "./adf-utils";
