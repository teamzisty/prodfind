"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageSquare, MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import { CommentWithAuthor } from "@/types/comment";
import { CommentForm } from "./comment-form";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CommentItemProps {
  comment: CommentWithAuthor;
  productId: string;
  level?: number;
  maxDepth?: number;
}

export function CommentItem({ comment, productId, level = 0, maxDepth = 3 }: CommentItemProps) {
  const { session } = useAuth();
  const user = session?.user;
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const utils = trpc.useUtils();

  const isAuthor = user?.id === comment.authorId;
  const isAdmin = user?.role === "admin";
  const canModify = isAuthor || isAdmin;

  const updateComment = trpc.comments.update.useMutation({
    onSuccess: () => {
      toast.success("Comment updated");
      setIsEditing(false);
      utils.comments.getByProductId.invalidate({ productId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update comment");
    },
  });

  const deleteComment = trpc.comments.delete.useMutation({
    onSuccess: () => {
      toast.success("Comment deleted");
      setShowDeleteDialog(false);
      utils.comments.getByProductId.invalidate({ productId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete comment");
    },
  });

  const handleUpdate = () => {
    if (editContent.trim() === comment.content.trim()) {
      setIsEditing(false);
      return;
    }
    updateComment.mutate({ id: comment.id, content: editContent.trim() });
  };

  const handleDelete = () => {
    deleteComment.mutate({ id: comment.id });
  };

  if (comment.deletedAt) {
    return (
      <div className={`${level > 0 ? "ml-12" : ""} p-4 text-muted-foreground italic`}>
        [Comment deleted]
      </div>
    );
  }

  return (
    <>
      <div className={`${level > 0 ? "ml-12 border-l-2 border-muted pl-4" : ""} space-y-3`}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author.image || undefined} />
            <AvatarFallback>
              {comment.author.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.author.name || "Anonymous"}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.updatedAt > comment.createdAt && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    disabled={updateComment.isPending || !editContent.trim()}
                  >
                    {updateComment.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    disabled={updateComment.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            )}
            {!isEditing && (
              <div className="flex items-center gap-2 mt-2">
                {user && level < maxDepth && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => setIsReplying(!isReplying)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
                {canModify && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>
        {isReplying && (
          <div className="ml-11">
            <CommentForm
              productId={productId}
              parentId={comment.id}
              onSuccess={() => setIsReplying(false)}
              onCancel={() => setIsReplying(false)}
            />
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4 mt-4">
            {comment.replies.map((reply: CommentWithAuthor) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                productId={productId}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteComment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}