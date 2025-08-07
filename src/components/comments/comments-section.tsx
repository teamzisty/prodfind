"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Loader2 } from "lucide-react";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";
import { trpc } from "@/trpc/client";
import { useAuth } from "@/context/auth-context";
import { CommentWithAuthor } from "@/types/comment";

interface CommentsSectionProps {
  productId: string;
}

export function CommentsSection({ productId }: CommentsSectionProps) {
  const { session } = useAuth();
  const [showCommentForm, setShowCommentForm] = useState(false);

  const { data: comments, isLoading, error } = trpc.comments.getByProductId.useQuery({
    productId,
  });

  const commentCount = comments?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({commentCount})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCommentForm ? (
          <CommentForm
            productId={productId}
            onSuccess={() => setShowCommentForm(false)}
            onCancel={() => setShowCommentForm(false)}
          />
        ) : (
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
            onClick={() => session && setShowCommentForm(true)}
          >
            <MessageSquare className="h-4 w-4" />
            {session ? "Write a comment..." : "Sign in to comment"}
          </Button>
        )}

        {commentCount > 0 && <Separator />}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Failed to load comments. Please try again</p>
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment as unknown as CommentWithAuthor}
                productId={productId}
              />
            ))}
          </div>
        ) : (
          !session && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
