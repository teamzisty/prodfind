"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUploadThing } from "@/lib/uploadthing";
import { Edit, Save, X, Trash2 } from "lucide-react";
import { ProductWithAuthor, ProductVisibilitySchema } from "@/types/product";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LinkIcon } from "@/components/link-icon";

interface ProductEditProps {
  product: ProductWithAuthor;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

export function ProductEdit({
  product,
  isEditing,
  setIsEditing,
}: ProductEditProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth();
  const [iconFile, setIconFile] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [editForm, setEditForm] = useState({
    name: product.name,
    description: product.description || "",
    shortDescription: product.shortDescription || "",
    price: product.price,
    category: (product.category as string[]) || [],
    links: product.links || [],
    images: product.images || [],
    icon: product.icon || "",
    license: product.license || "",
    visibility: product.visibility || "public",
  });

  const { startUpload: startIconUpload, isUploading: isIconUploading } =
    useUploadThing("iconUploader", {
      onClientUploadComplete: (res) => {
        if (res && res.length > 0) {
          setEditForm((prev) => ({ ...prev, icon: res[0].url }));
        }
        setIconFile([]);
      },
      onUploadError: (error: Error) => {
        toast.error(`ERROR! ${error.message}`);
      },
    });

  const { startUpload: startImageUpload, isUploading: isImageUploading } =
    useUploadThing("imageUploader", {
      onClientUploadComplete: (res) => {
        if (res) {
          const newImages = res.map((file) => ({
            id: crypto.randomUUID(),
            url: file.ufsUrl,
          }));
          setEditForm((prev) => ({
            ...prev,
            images: [...prev.images, ...newImages],
          }));
        }
        setImageFiles([]);
      },
      onUploadError: (error: Error) => {
        toast.error(`ERROR! ${error.message}`);
      },
    });

  const updateProductMutation = trpc.updateProduct.useMutation({
    onSuccess: () => {
      toast.success("Product updated successfully");
      router.push(pathname);
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to update product");
      } else {
        toast.error("Failed to update product");
      }
    },
  });

  const deleteProductMutation = trpc.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success("Product deleted successfully");
      router.push("/");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete product");
    },
  });

  const isOwner = session?.user?.id === product?.authorId;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!product) return;

    updateProductMutation.mutate({
      productId: product.id,
      ...editForm,
      links: editForm.links.map(({ __typename, ...rest }: any) => rest),
      images: editForm.images.map(({ __typename, ...rest }: any) => rest),
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (!isOwner) {
    return null;
  }

  if (!isEditing) {
    return (
      <Button onClick={handleEdit} variant="outline" size="sm">
        <Edit className="w-4 h-4 mr-1" /> Edit
      </Button>
    );
  }

  return (
    <div className="col-span-full space-y-8 py-8 max-w-6xl mx-auto">
      {/* Edit Controls in Header */}

      {/* Icon Upload & Name Input Wrapper */}
      <div className="flex items-start gap-4">
        {/* Icon Upload */}
        <div className="w-24 h-24 flex-shrink-0">
          <label className="cursor-pointer">
            <img
              src={editForm.icon || product.icon || "/placeholder.svg"}
              alt="Icon Preview"
              width={96}
              height={96}
              className="rounded-lg object-cover w-full h-full"
            />
            <Input
              type="file"
              className="hidden"
              onChange={(e) =>
                e.target.files && setIconFile(Array.from(e.target.files))
              }
            />
          </label>
          {iconFile.length > 0 && (
            <Button
              size="sm"
              className="w-full mt-1"
              onClick={() => startIconUpload(iconFile)}
              disabled={isIconUploading}
            >
              {isIconUploading ? "..." : "Upload"}
            </Button>
          )}
        </div>

        {/* Name Input */}
        <div className="flex-1">
          <Input
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="!text-3xl font-semibold border-none tracking-tight p-0 h-auto"
          />
        </div>

        <div className="flex items-center justify-end gap-2 mb-8">
          <Button
            onClick={handleSave}
            size="sm"
            disabled={updateProductMutation.isPending}
          >
            <Save className="w-4 h-4 mr-1" /> Save Changes
          </Button>
          <Button onClick={handleCancel} variant="outline" size="sm">
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
        </div>
      </div>

      {/* Image Gallery Edit */}
      <div>
        <label className="block text-2xl tracking-tight text-foreground font-semibold mb-2">
          Product Gallery
        </label>
        <div className="flex items-center gap-2 mb-4">
          <Input
            type="file"
            multiple
            onChange={(e) =>
              e.target.files && setImageFiles(Array.from(e.target.files))
            }
          />
          <Button
            onClick={() => startImageUpload(imageFiles)}
            disabled={isImageUploading || imageFiles.length === 0}
          >
            {isImageUploading
              ? "Uploading..."
              : `Upload ${imageFiles.length} file(s)`}
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {editForm.images.map((image, index) => (
            <div key={image.url} className="relative aspect-video">
              <img
                src={image.url}
                alt="Product image"
                className="rounded-md object-cover w-full h-full"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() =>
                  setEditForm((prev) => ({
                    ...prev,
                    images: prev.images.filter((_, i) => i !== index),
                  }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Category Edit */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Categories</h2>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {editForm.category.map((cat, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {cat}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => {
                    setEditForm((prev) => ({
                      ...prev,
                      category: prev.category.filter((_, i) => i !== index),
                    }));
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add category (e.g., Web App, Mobile, SaaS)"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  const newCategory = e.currentTarget.value.trim();
                  if (!editForm.category.includes(newCategory)) {
                    setEditForm((prev) => ({
                      ...prev,
                      category: [...prev.category, newCategory],
                    }));
                  }
                  e.currentTarget.value = "";
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                const input =
                  e.currentTarget.parentElement?.querySelector("input");
                if (input?.value.trim()) {
                  const newCategory = input.value.trim();
                  if (!editForm.category.includes(newCategory)) {
                    setEditForm((prev) => ({
                      ...prev,
                      category: [...prev.category, newCategory],
                    }));
                  }
                  input.value = "";
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Description Edit */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">
          About this product (Supports Markdown)
        </h2>
        <Textarea
          value={editForm.description}
          onChange={(e) =>
            setEditForm({
              ...editForm,
              description: e.target.value,
            })
          }
          className="min-h-[150px]"
        />
      </div>

      {/* Short Description Edit */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Short Description</h2>
        <Textarea
          value={editForm.shortDescription}
          onChange={(e) =>
            setEditForm({
              ...editForm,
              shortDescription: e.target.value,
            })
          }
          className="min-h-[75px]"
          maxLength={100}
          placeholder="A short summary of the product (max 100 characters)"
        />
        <p className="text-sm text-muted-foreground mt-1">
          {editForm.shortDescription.length} / 100
        </p>
      </div>

      {/* Links Edit */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Links</h2>
        <div className="space-y-4">
          {editForm.links.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 border rounded-md bg-muted/50"
            >
              <Badge variant={index === 0 ? "default" : "outline"}>
                <LinkIcon link={link} />
              </Badge>
              <Input
                value={link.title}
                placeholder="Link Title (e.g., App Store)"
                onChange={(e) => {
                  const newLinks = [...editForm.links];
                  newLinks[index].title = e.target.value;
                  setEditForm((prev) => ({
                    ...prev,
                    links: newLinks,
                  }));
                }}
              />
              <Input
                value={link.url}
                placeholder="https://..."
                onChange={(e) => {
                  const newLinks = [...editForm.links];
                  newLinks[index].url = e.target.value;
                  setEditForm((prev) => ({
                    ...prev,
                    links: newLinks,
                  }));
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditForm((prev) => ({
                    ...prev,
                    links: prev.links.filter((_, i) => i !== index),
                  }));
                }}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            setEditForm((prev) => ({
              ...prev,
              links: [
                ...prev.links,
                { id: crypto.randomUUID(), title: "", url: "" },
              ],
            }));
          }}
        >
          Add Link
        </Button>
      </div>

      {/* License Edit */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">License</h2>
        <Select
          value={editForm.license || ""}
          onValueChange={(value) =>
            setEditForm((prev) => ({ ...prev, license: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a license" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MIT">MIT</SelectItem>
            <SelectItem value="Apache-2.0">Apache 2.0</SelectItem>
            <SelectItem value="GPL-3.0">GPLv3</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Visibility Edit */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Visibility</h2>
        <Select
          value={editForm.visibility}
          onValueChange={(value) =>
            setEditForm((prev) => ({ ...prev, visibility: value as any }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="unlisted">Unlisted</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground mt-2">
          Public: Visible to everyone. <br />
          Unlisted: Only accessible via direct link. <br />
          Private: Only visible to you.
        </p>
      </div>

      {/* Delete Product */}
      <div className="mt-8 border-t pt-8">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full"
              disabled={deleteProductMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Product
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                product.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteProductMutation.mutate({ productId: product.id })
                }
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
