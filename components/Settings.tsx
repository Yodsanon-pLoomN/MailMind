// components/SettingsPanel.tsx
"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const weekDays = [
  { key: "mon", label: "จันทร์" },
  { key: "tue", label: "อังคาร" },
  { key: "wed", label: "พุธ" },
  { key: "thu", label: "พฤหัสบดี" },
  { key: "fri", label: "ศุกร์" },
  { key: "sat", label: "เสาร์" },
  { key: "sun", label: "อาทิตย์" },
];

export default function SettingsPanel() {
  // mock state เฉย ๆ
  const [workdayNotify, setWorkdayNotify] = React.useState(true);
  const [calendarEnabled, setCalendarEnabled] = React.useState(true);
  const [gmailSync, setGmailSync] = React.useState(true);

  // วันทำงาน / วันหยุด
  const [workDays, setWorkDays] = React.useState<string[]>([
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
  ]);
  const [holidays, setHolidays] = React.useState<string[]>(["sat", "sun"]);

  // ศัพนาม
  const [title, setTitle] = React.useState<"mr" | "mrs" | "ms">("mr");

  // เลือก generative ai
  const [aiProvider, setAiProvider] = React.useState<
    "openai" | "gemini" | "claude"
  >("openai");

  const toggleWorkDay = (day: string) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleHoliday = (day: string) => {
    setHolidays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Working hours */}
      <section className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Working hours</h3>
            <p className="text-sm text-muted-foreground">
              กำหนดช่วงเวลาทำงาน
            </p>
          </div>
        </div>

        {/* เวลา */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="startTime">Start time</Label>
            <Input id="startTime" type="time" defaultValue="09:00" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endTime">End time</Label>
            <Input id="endTime" type="time" defaultValue="17:00" />
          </div>
        </div>

        {/* วันทำงาน */}
        <div className="space-y-2">
          <Label>Work days</Label>
          <div className="flex flex-wrap gap-2">
            {weekDays.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleWorkDay(d.key)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm border transition",
                  workDays.includes(d.key)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* เขตเวลา */}
        <div className="space-y-1">
          <Label htmlFor="timezone">Timezone</Label>
          <Select defaultValue="asia-bangkok">
            <SelectTrigger id="timezone" className="w-full sm:max-w-xs">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asia-bangkok">Asia/Bangkok (GMT+7)</SelectItem>
              <SelectItem value="asia-tokyo">Asia/Tokyo (GMT+9)</SelectItem>
              <SelectItem value="europe-london">
                Europe/London (GMT+0)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* ศัพนาม */}
      <section className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Title / ศัพนาม</h3>
          </div>
        </div>

        <div className="w-full sm:max-w-xs space-y-1">
          <Label htmlFor="titleSelect">Default title</Label>
          <Select value={title} onValueChange={(v) => setTitle(v as any)}>
            <SelectTrigger id="titleSelect">
              <SelectValue placeholder="เลือกศัพนาม" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mr">นาย</SelectItem>
              <SelectItem value="mrs">นาง</SelectItem>
              <SelectItem value="ms">นางสาว</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Generative AI */}
      <section className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Generative AI engine</h3>
            
          </div>
        </div>

        <div className="w-full sm:max-w-xs space-y-1">
          <Label htmlFor="aiProvider">Provider</Label>
          <Select
            value={aiProvider}
            onValueChange={(v) => setAiProvider(v as any)}
          >
            <SelectTrigger id="aiProvider">
              <SelectValue placeholder="เลือก AI" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI (GPT)</SelectItem>
              <SelectItem value="gemini">Google Gemini</SelectItem>
              <SelectItem value="claude">Anthropic Claude</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Reply Tone / โทนการตอบเมล */}
      <section className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Reply tone</h3>
            <p className="text-sm text-muted-foreground">
              เลือกโทนภาษาที่ใช้ในการตอบกลับอีเมล เช่น ทางการ (Formal)
              หรือไม่ทางการ (Casual)
            </p>
          </div>
        </div>

        <div className="w-full sm:max-w-xs space-y-1">
          <Label htmlFor="toneSelect">Tone</Label>
          <Select
            defaultValue="formal"
            onValueChange={(v) => console.log("selected tone:", v)}
          >
            <SelectTrigger id="toneSelect">
              <SelectValue placeholder="เลือกโทนภาษา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">Formal (ทางการ)</SelectItem>
              <SelectItem value="informal">Informal (ไม่ทางการ)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* action */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline">Reset</Button>
        <Button>Save changes</Button>
      </div>
    </div>
  );
}
