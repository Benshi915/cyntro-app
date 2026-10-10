"use client";
import { useActionState, useState } from "react";
import { createPost } from "@/app/actions";
import { ImageUpload } from "@/components/image-upload";
import { Button, Card, Field, FormError, Input, Textarea } from "@/components/ui";

export function PostForm() {
  const [state, action, pending] = useActionState(createPost, undefined);
  const [withImage, setWithImage] = useState(false);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5">
        <Textarea name="body" placeholder="מה חדש? חזרות, שיר חדש, ערב פנוי..." maxLength={2000} className="min-h-36 text-lg" autoFocus />
        {withImage ? (
          <>
            <ImageUpload name="media_url" label="תמונה" />
            <input type="hidden" name="media_type" value="image" />
          </>
        ) : (
          <button type="button" onClick={() => setWithImage(true)} className="w-fit text-sm text-spot hover:underline">
            + הוספת תמונה
          </button>
        )}
        <Field label="קישור לשיר / וידאו" hint="YouTube, Spotify או SoundCloud — יוצג כנגן">
          <Input name="embed_url" type="url" dir="ltr" placeholder="https://" className="text-left" />
        </Field>
      </Card>
      <FormError message={state?.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "מפרסמים..." : "פרסום"}
      </Button>
    </form>
  );
}
