"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment is too long"),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormProps {
  productId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CommentForm({
  productId,
  parentId,
  onSuccess,
  onCancel,
}: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);
  const COOLDOWN_MS = 30000;
  const utils = trpc.useUtils();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      form.reset();
      toast.success(parentId ? "Reply posted!" : "Comment posted!");
      utils.comments.getByProductId.invalidate({ productId });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to post comment");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: CommentFormData) => {
    const now = Date.now();
    if (now - lastSubmissionTime < COOLDOWN_MS) {
      toast.error("Please wait before submitting another comment");
      return;
    }
    setLastSubmissionTime(now);
    setIsSubmitting(true);
    createComment.mutate({
      productId,
      parentId: parentId || null,
      content: data.content,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder={
                    parentId ? "Write a reply..." : "Write a comment..."
                  }
                  className="min-h-[100px] resize-none"
                  {...field}
                />
              </FormControl>
              <div className="text-xs text-muted-foreground text-right">
                {field.value?.length || 0}/1000 characters
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {parentId ? "Reply" : "Comment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
