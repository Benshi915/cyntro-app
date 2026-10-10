"use client";
import { useActionState, useState } from "react";
import { Guitar, Store, Ticket } from "lucide-react";
import { saveProfile } from "@/app/actions";
import { ACT_TYPE_LABEL, CITIES, VENUE_TYPE_LABEL } from "@/lib/constants";
import type { Profile, Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GenrePicker } from "./genre-picker";
import { ImageUpload } from "./image-upload";
import { LocationPicker } from "./map";
import { Button, Card, Field, FormError, Input, Select, Textarea } from "./ui";

const ROLE_CARDS: { role: Role; icon: typeof Guitar; title: string; text: string; active: string; iconClass: string }[] = [
  { role: "artist", icon: Guitar, title: "אמן/ית או להקה", text: "מופיעים, מעלים תוכן, מקבלים הצעות", active: "border-artist bg-artist/10", iconClass: "text-artist" },
  { role: "venue", icon: Store, title: "מקום", text: "בית קפה, בר, מסעדה, לופט, אולם", active: "border-venue bg-venue/10", iconClass: "text-venue" },
  { role: "fan", icon: Ticket, title: "קהל", text: "מגלים הופעות ועוקבים אחרי אמנים", active: "border-fan bg-fan/10", iconClass: "text-fan" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6">
      <h2 className="display text-3xl">{title}</h2>
      {children}
    </Card>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean | null }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-night-2 px-4 py-3">
      <span>{label}</span>
      <input type="checkbox" name={name} defaultChecked={Boolean(defaultChecked)} className="size-5 accent-[var(--color-spot)]" />
    </label>
  );
}

export function ProfileForm({ profile, initialRole }: { profile?: Profile | null; initialRole?: Role }) {
  const [state, action, pending] = useActionState(saveProfile, undefined);
  const [role, setRole] = useState<Role | undefined>(profile?.role ?? initialRole);
  const [city, setCity] = useState(profile?.city ?? "תל אביב");
  const cityCenter = CITIES.find((c) => c.name === city);
  const editing = Boolean(profile);

  return (
    <form action={action} className="flex flex-col gap-5">
      {!editing && (
        <Section title="מי את/ה ברשת?">
          <div className="grid gap-3 sm:grid-cols-3">
            {ROLE_CARDS.map((r) => (
              <button
                type="button"
                key={r.role}
                onClick={() => setRole(r.role)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-2xl border p-4 text-start transition",
                  role === r.role ? r.active : "border-line hover:border-fog",
                )}
              >
                <r.icon className={cn("size-6", r.iconClass)} />
                <span className="font-semibold">{r.title}</span>
                <span className="text-sm text-fog">{r.text}</span>
              </button>
            ))}
          </div>
        </Section>
      )}
      {role && <input type="hidden" name="role" value={role} />}

      {role && (
        <>
          <Section title="הבסיס">
            <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
              <ImageUpload name="avatar_url" label="תמונת פרופיל" shape="round" initialUrl={profile?.avatar_url} />
              {role !== "fan" && <ImageUpload name="cover_url" label="תמונת נושא" initialUrl={profile?.cover_url} />}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={role === "venue" ? "שם המקום" : role === "artist" ? "שם הבמה / הלהקה" : "שם"}>
                <Input name="display_name" required defaultValue={profile?.display_name} maxLength={80} />
              </Field>
              <Field label="שם משתמש" hint="יופיע בכתובת: livetime/p/השם">
                <Input
                  name="handle"
                  required
                  dir="ltr"
                  defaultValue={profile?.handle}
                  pattern="[a-zA-Z0-9_.]{3,30}"
                  placeholder="my.band"
                  className="text-left"
                />
              </Field>
            </div>
            {role !== "fan" && (
              <Field label="משפט אחד שמתאר אתכם">
                <Input name="tagline" defaultValue={profile?.tagline ?? ""} maxLength={120} placeholder={role === "venue" ? "בר מרתף עם במה קטנה ואוזניים גדולות" : "סול ישראלי חם עם כלי נשיפה"} />
              </Field>
            )}
            <Field label="עיר">
              <Select name="city" value={city} onChange={(e) => setCity(e.target.value)}>
                {CITIES.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label={role === "fan" ? "מה אתם אוהבים לשמוע?" : "סגנונות"} hint="עד 5">
              <GenrePicker initial={profile?.genres} />
            </Field>
            {role !== "fan" && (
              <Field label="קצת עליכם">
                <Textarea name="bio" defaultValue={profile?.bio ?? ""} maxLength={2000} />
              </Field>
            )}
          </Section>

          {role === "artist" && (
            <Section title="ההופעה">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="סוג הרכב">
                  <Select name="act_type" defaultValue={profile?.act_type ?? "solo"}>
                    {Object.entries(ACT_TYPE_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="כמה נגנים?">
                  <Input name="members_count" type="number" min={1} defaultValue={profile?.members_count ?? 1} />
                </Field>
                <Field label="מחיר הופעה מ־ (₪)">
                  <Input name="fee_min" type="number" min={0} step={50} defaultValue={profile?.fee_min ?? ""} />
                </Field>
                <Field label="עד (₪)">
                  <Input name="fee_max" type="number" min={0} step={50} defaultValue={profile?.fee_max ?? ""} />
                </Field>
                <Field label="אורך סט (דקות)">
                  <Input name="set_length_min" type="number" min={15} step={15} defaultValue={profile?.set_length_min ?? 90} />
                </Field>
              </div>
              <Toggle name="open_to_door_deals" label="פתוחים גם לדילים על כרטיסים / חלוקת קופה" defaultChecked={profile?.open_to_door_deals ?? true} />
              <Field label="דרישות טכניות">
                <Textarea name="tech_needs" defaultValue={profile?.tech_needs ?? ""} placeholder="הגברה, מוניטורים, פסנתר..." className="min-h-20" />
              </Field>
            </Section>
          )}

          {role === "venue" && (
            <Section title="המקום">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="סוג מקום">
                  <Select name="venue_type" defaultValue={profile?.venue_type ?? "bar"}>
                    {Object.entries(VENUE_TYPE_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="קיבולת (איש)">
                  <Input name="capacity" type="number" min={1} defaultValue={profile?.capacity ?? ""} />
                </Field>
                <Field label="תקציב להופעה מ־ (₪)">
                  <Input name="budget_min" type="number" min={0} step={50} defaultValue={profile?.budget_min ?? ""} />
                </Field>
                <Field label="עד (₪)">
                  <Input name="budget_max" type="number" min={0} step={50} defaultValue={profile?.budget_max ?? ""} />
                </Field>
              </div>
              <Field label="כתובת">
                <Input name="address" defaultValue={profile?.address ?? ""} placeholder="רחוב ומספר, עיר" />
              </Field>
              <Field label="מיקום על המפה">
                <LocationPicker initial={{ lat: profile?.lat ?? null, lng: profile?.lng ?? null }} center={cityCenter} />
              </Field>
              <Field label="ערבי מוזיקה" hint="למשל: רביעי–שבת">
                <Input name="music_nights" defaultValue={profile?.music_nights ?? ""} />
              </Field>
              <div className="grid gap-2 sm:grid-cols-3">
                <Toggle name="has_stage" label="יש במה" defaultChecked={profile?.has_stage} />
                <Toggle name="has_sound_system" label="יש הגברה" defaultChecked={profile?.has_sound_system} />
                <Toggle name="has_piano" label="יש פסנתר" defaultChecked={profile?.has_piano} />
              </div>
              <Field label="ציוד">
                <Textarea name="equipment" defaultValue={profile?.equipment ?? ""} className="min-h-20" />
              </Field>
            </Section>
          )}

          {role !== "fan" && (
            <Section title="קישורים">
              <div className="grid gap-4 sm:grid-cols-2">
                {(["instagram", "spotify", "youtube", "website"] as const).map((k) => (
                  <Field key={k} label={{ instagram: "Instagram", spotify: "Spotify", youtube: "YouTube", website: "אתר" }[k]}>
                    <Input name={k} dir="ltr" type="url" defaultValue={profile?.links?.[k] ?? ""} placeholder="https://" className="text-left" />
                  </Field>
                ))}
              </div>
            </Section>
          )}

          <FormError message={state?.error} />
          <Button type="submit" size="lg" disabled={pending} className="sticky bottom-24 lg:bottom-6">
            {pending ? "שומרים..." : editing ? "שמירת שינויים" : "יוצאים לדרך"}
          </Button>
        </>
      )}
    </form>
  );
}
