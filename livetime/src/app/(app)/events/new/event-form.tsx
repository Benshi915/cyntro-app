"use client";
import { useActionState } from "react";
import { createEvent } from "@/app/actions";
import { GenrePicker } from "@/components/genre-picker";
import { ImageUpload } from "@/components/image-upload";
import { Button, Card, Field, FormError, Input, Select, Textarea } from "@/components/ui";
import { CITIES } from "@/lib/constants";
import type { Role } from "@/lib/types";

export function EventForm({ role, minDate, defaultGenres }: { role: Role; minDate: string; defaultGenres: string[] }) {
  const [state, action, pending] = useActionState(createEvent, undefined);
  const isVenue = role === "venue";
  return (
    <form action={action} className="flex flex-col gap-4">
      <Card className="flex flex-col gap-5 p-5 sm:p-6">
        <ImageUpload name="cover_url" label="פוסטר / תמונה" />
        <Field label="שם האירוע">
          <Input name="title" required maxLength={120} placeholder={isVenue ? "ערב ג׳אז במרתף" : "מופע השקה"} />
        </Field>
        <Field label={isVenue ? "מי מופיע?" : "איפה?"} hint={isVenue ? "אם האמן ברשת — עדיף לשלוח לו הצעה מהפרופיל שלו" : "שם המקום"}>
          <Input name="other_name" maxLength={80} required={!isVenue} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="תאריך">
            <Input name="date" type="date" required min={minDate} />
          </Field>
          <Field label="שעה">
            <Input name="time" type="time" required defaultValue="21:00" />
          </Field>
        </div>
        {!isVenue && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="כתובת">
              <Input name="address" maxLength={200} />
            </Field>
            <Field label="עיר">
              <Select name="city" defaultValue="תל אביב">
                {CITIES.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="מחיר כרטיס (₪)" hint="ריק = כניסה חופשית">
            <Input name="ticket_price" type="number" min={0} step={5} />
          </Field>
          <Field label="מקומות">
            <Input name="capacity" type="number" min={1} />
          </Field>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="tips_enabled" className="size-5 accent-[var(--color-spot)]" /> לאפשר טיפים לאמן
        </label>
        <Field label="סגנונות">
          <GenrePicker initial={defaultGenres} />
        </Field>
        <Field label="תיאור">
          <Textarea name="description" maxLength={3000} />
        </Field>
      </Card>
      <FormError message={state?.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "מפרסמים..." : "פרסום האירוע"}
      </Button>
    </form>
  );
}
