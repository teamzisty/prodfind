import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <div className="bg-primary py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-primary-foreground sm:text-4xl">
            Ready to discover products?
          </h2>
          <p className="mt-4 text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Join Prodfind today and start exploring the best products recommended by real users.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild variant="secondary" size="lg">
              <Link href="/register">Register</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/ranking">Ranking</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
