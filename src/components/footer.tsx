import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t py-8 mt-16">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Prodfind. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Home
          </Link>
          <Link
            href="/(home)/features"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Features
          </Link>
          <Link
            href="/terms"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Privacy
          </Link>
          <Link
            href="/contact"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Contact
          </Link>
          <a
            href="https://github.com/teamzisty/prodfind"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
