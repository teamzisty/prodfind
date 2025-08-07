"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import {
  ProductSchema,
  ProductLinkSchema,
  ProductImageSchema,
  ProductVisibilitySchema,
} from "@/types/product";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TrashIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { CheckCircleIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/components/ui/upload-dropzone";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ProductFormSchema = ProductSchema.omit({
  id: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, { message: "Product name is required." }),
  description: z.string().min(1, { message: "Description is required." }),
  shortDescription: z
    .string()
    .min(1, { message: "Short description is required." })
    .max(100, { message: "Short description must be 100 characters or less." }),
  price: z.string().min(1, { message: "Price is required." }),
  images: z.array(
    ProductImageSchema.extend({
      url: z.url("Image URL is required."),
    }),
  ),
  links: z.array(
    ProductLinkSchema.extend({
      url: z.url("Link URL is required."),
      title: z.string().min(1, "Link title is required."),
    }),
  ),
  license: z.string().optional(),
  visibility: ProductVisibilitySchema,
});

type ProductFormValues = z.infer<typeof ProductFormSchema>;

export default function NewProductPage() {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: "",
      description: "",
      shortDescription: "",
      price: "",
      images: [],
      icon: "",
      category: [],
      links: [],
      license: "",
      visibility: "public",
    },
    mode: "onChange",
  });

  const {
    fields: linkFields,
    append: appendLink,
    remove: removeLink,
  } = useFieldArray({
    name: "links",
    control: form.control,
  });

  const router = useRouter();
  const { mutate: createProduct, isPending } = trpc.createProduct.useMutation();
  const [error, setError] = useState<string | null>(null);
  const [isCreated, setIsCreated] = useState(false);

  async function onSubmit(data: ProductFormValues) {
    createProduct(data, {
      onSuccess: (data) => {
        console.log("Product created:", data);
        router.push(`/dashboard/products`);
        setIsCreated(true);
      },
      onError: (error) => {
        console.error("Error creating product:", error);
        setError(error.message);
      },
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Create a New Product</h1>
        <p className="text-muted-foreground">
          Fill out the form to add a new product to your store.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. My Awesome SaaS" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Supports Markdown)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your product in a few sentences."
                    className="resize-none min-h-[100px]"
                    style={{ height: "auto" }}
                    onChange={(e) => {
                      field.onChange(e);
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="A short summary of the product (max 100 characters)"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  This will be shown in product listings.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 29.99"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Enter the price in USD.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="license"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a license" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MIT">MIT</SelectItem>
                    <SelectItem value="Apache-2.0">Apache 2.0</SelectItem>
                    <SelectItem value="GPL-3.0">GPLv3</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibility</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Public: Visible to everyone. <br />
                  Unlisted: Only accessible via direct link. <br />
                  Private: Only visible to you.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel>Icon</FormLabel>
            <div className="mt-2">
              <UploadDropzone
                endpoint="iconUploader"
                onClientUploadComplete={(res) => {
                  if (res && res.length > 0) {
                    form.setValue("icon", res[0].ufsUrl);
                  }
                }}
                onUploadError={(error: Error) => {
                  toast.error(`ERROR! ${error.message}`);
                }}
              />
            </div>
            {form.watch("icon") && (
              <div className="mt-4">
                <p className="text-sm font-medium">Icon Preview:</p>
                <img
                  src={form.watch("icon")!}
                  alt="Icon preview"
                  width={100}
                  height={100}
                  className="rounded-md mt-2"
                />
              </div>
            )}
          </div>

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categories</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. SaaS, Developer Tools"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(
                        value ? value.split(",").map((c) => c.trim()) : [],
                      );
                    }}
                    value={
                      Array.isArray(field.value) ? field.value.join(", ") : ""
                    }
                  />
                </FormControl>
                <FormDescription>
                  Comma-separated list of categories.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <h3 className="text-lg font-medium">Product Gallery</h3>
            <div className="mt-2">
              <UploadDropzone
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (res) {
                    const currentImages = form.getValues("images") || [];
                    const newImages = res.map((file) => ({
                      id: crypto.randomUUID(),
                      url: file.ufsUrl,
                    }));
                    form.setValue("images", [...currentImages, ...newImages]);
                  }
                }}
                onUploadError={(error: Error) => {
                  toast.error(`ERROR! ${error.message}`);
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {form.watch("images")?.map((image, index) => (
                <div key={image.url} className="relative">
                  <img
                    src={image.url}
                    alt="Product image"
                    width={150}
                    height={150}
                    className="rounded-md object-cover"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 bg-red-500 text-white hover:bg-red-600"
                    onClick={() => {
                      const currentImages = form.getValues("images") || [];
                      form.setValue(
                        "images",
                        currentImages.filter((_, i) => i !== index),
                      );
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium">Product Links</h3>
            <div className="space-y-4 mt-2">
              {linkFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border rounded-md space-y-4 relative"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLink(index)}
                    className="absolute top-2 right-2"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                  <FormField
                    control={form.control}
                    name={`links.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Website" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`links.${index}.url`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`links.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="A short description about this link."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() =>
                appendLink({
                  id: crypto.randomUUID(),
                  title: "",
                  url: "",
                  description: "",
                })
              }
            >
              <PlusCircledIcon className="mr-2 h-4 w-4" />
              Add Link
            </Button>
          </div>

          {error && <p className="text-destructive">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || isCreated}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isCreated ? (
              <CheckCircleIcon className="w-4 h-4" />
            ) : (
              "Create Product"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
