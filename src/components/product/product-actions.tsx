"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Heart, Bookmark, Share2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ProductActionsProps {
  productId: string;
  mainLink?: { title: string; url: string } | null;
  initialBookmarkStatus?: { isBookmarked: boolean };
  initialRecommendationStatus?: { isRecommended: boolean };
}

export function ProductActions({
  productId,
  mainLink,
  initialBookmarkStatus,
  initialRecommendationStatus,
}: ProductActionsProps) {
  const router = useRouter();
  const { session } = useAuth();

  const { data: bookmarkStatus, refetch: refetchBookmarkStatus } =
    trpc.getBookmarkStatus.useQuery(
      { productId },
      { 
        enabled: !!session,
        initialData: initialBookmarkStatus,
      }
    );
    
  const { data: recommendationStatus, refetch: refetchRecommendationStatus } =
    trpc.getRecommendationStatus.useQuery(
      { productId },
      { 
        enabled: !!session,
        initialData: initialRecommendationStatus,
      }
    );

  const addBookmarkMutation = trpc.addBookmark.useMutation({
    onSuccess: () => {
      toast.success("Added to your bag!");
      refetchBookmarkStatus();
    },
  });
  
  const removeBookmarkMutation = trpc.removeBookmark.useMutation({
    onSuccess: () => {
      toast.success("Removed from your bag.");
      refetchBookmarkStatus();
    },
  });
  
  const addRecommendationMutation = trpc.addRecommendation.useMutation({
    onSuccess: () => {
      toast.success("Recommended!");
      refetchRecommendationStatus();
    },
  });
  
  const removeRecommendationMutation = trpc.removeRecommendation.useMutation({
    onSuccess: () => {
      toast.success("Recommendation removed.");
      refetchRecommendationStatus();
    },
  });

  const handleToggleBookmark = () => {
    if (!session) {
      router.push("/login");
      return;
    }
    if (bookmarkStatus?.isBookmarked) {
      removeBookmarkMutation.mutate({ productId });
    } else {
      addBookmarkMutation.mutate({ productId });
    }
  };

  const handleToggleRecommendation = () => {
    if (!session) {
      router.push("/login");
      return;
    }
    if (recommendationStatus?.isRecommended) {
      removeRecommendationMutation.mutate({ productId });
    } else {
      addRecommendationMutation.mutate({ productId });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        onClick={handleToggleRecommendation}
        disabled={
          addRecommendationMutation.isPending ||
          removeRecommendationMutation.isPending
        }
      >
        {recommendationStatus?.isRecommended ? (
          <>
            <Heart className="w-4 h-4 fill-red-500 text-red-500" />{" "}
            Recommended
          </>
        ) : (
          <>
            <Heart className="w-4 h-4" /> Recommend
          </>
        )}
      </Button>

      {mainLink && (
        <Button asChild size="lg" className="w-full">
          <Link href={mainLink.url} target="_blank">
            Visit Website <ExternalLink />
          </Link>
        </Button>
      )}

      <div className="flex items-center justify-around">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleToggleBookmark}
          disabled={
            addBookmarkMutation.isPending ||
            removeBookmarkMutation.isPending
          }
        >
          {bookmarkStatus?.isBookmarked ? (
            <>
              <Bookmark className="w-4 h-4 fill-primary" /> In Your Bag
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" /> Add to bag
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="flex-1 ml-2"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4" /> Share
        </Button>
      </div>
    </div>
  );
}
