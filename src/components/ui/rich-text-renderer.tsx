import React from 'react';

// Define the types for the Rich Text JSON structure
interface RichTextNode {
  type: string;
  children: RichTextNode[];
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  url?: string;
  format?: string;
  level?: number;
}

const renderNode = (node: RichTextNode, index: number): React.ReactNode => {
  switch (node.type) {
    case 'paragraph':
      return <p key={index} className="mb-4">{node.children.map(renderNode)}</p>;
    
    case 'heading':
      const Tag = `h${node.level}` as keyof JSX.IntrinsicElements;
      let headingClass = '';
      switch (node.level) {
        case 1:
          headingClass = 'text-4xl font-bold mb-8 mt-12';
          break;
        case 2:
          headingClass = 'text-3xl font-bold mb-6 mt-10';
          break;
        case 3:
          headingClass = 'text-2xl font-bold mb-4 mt-8';
          break;
        case 4:
          headingClass = 'text-xl font-bold mb-4 mt-6';
          break;
        default:
          headingClass = 'text-lg font-bold mb-4 mt-6';
      }
      return <Tag key={index} className={headingClass}>{node.children.map(renderNode)}</Tag>;

    case 'list':
      const ListTag = node.format === 'ordered' ? 'ol' : 'ul';
      return <ListTag key={index} className="list-disc pl-6 mb-8 space-y-2">{node.children.map(renderNode)}</ListTag>;
    
    case 'list-item':
      return <li key={index}>{node.children.map(renderNode)}</li>;
      
    case 'quote':
      return <blockquote key={index} className="border-l-4 border-green-600 pl-4 mb-8">{node.children.map(renderNode)}</blockquote>;

    case 'link':
      return (
        <a key={index} href={node.url} className="text-green-600 hover:underline">
          {node.children.map(renderNode)}
        </a>
      );
      
    case 'text':
      let element: React.ReactNode = node.text;
      if (node.bold) element = <strong>{element}</strong>;
      if (node.italic) element = <em>{element}</em>;
      if (node.underline) element = <u>{element}</u>;
      if (node.strikethrough) element = <s>{element}</s>;
      if (node.code) element = <code className="bg-gray-100 p-1 rounded-sm">{element}</code>;
      return <React.Fragment key={index}>{element}</React.Fragment>;
      
    default:
      return node.text || null;
  }
};

const RichTextRenderer = ({ content }: { content: RichTextNode[] }) => {
  if (!content) return null;
  
  return (
    <div className="prose prose-lg max-w-none prose-green">
      {content.map(renderNode)}
    </div>
  );
};

export default RichTextRenderer; 