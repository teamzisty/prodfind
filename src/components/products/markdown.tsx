import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ShikiHighlighter } from 'react-shiki';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn("prose dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4" {...props} />,
          h2: ({ ...props }) => <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 mt-6" {...props} />,
          h3: ({ ...props }) => <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-4" {...props} />,
          h4: ({ ...props }) => <h4 className="text-base md:text-lg lg:text-xl font-bold mb-4" {...props} />,
          h5: ({ ...props }) => <h5 className="text-sm font-bold" {...props} />,
          h6: ({ ...props }) => <h6 className="text-xs font-bold" {...props} />,
          p: ({ ...props }) => <p className="mb-4 mt-0" {...props} />,
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <ShikiHighlighter
                language={match[1]}
                theme="dark-plus"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </ShikiHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a: ({ ...props }) => (
            <Link
              {...props}
              href={props.href || ''}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground/80 underline transition-colors hover:text-foreground"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
