import type { Metadata } from "next";
import { PostForm } from "./post-form";

export const metadata: Metadata = { title: "פוסט חדש" };

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="display mb-6 text-5xl">פוסט חדש</h1>
      <PostForm />
    </div>
  );
}
