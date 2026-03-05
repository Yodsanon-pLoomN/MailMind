"use client";

import * as React from "react";
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
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState({ text: "", type: "" });

  // State API Key
  const [configuredKeys, setConfiguredKeys] = React.useState<Record<string, boolean>>({});
  const [apiKeyInput, setApiKeyInput] = React.useState("");

  // State การตั้งค่าทั้งหมด
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("17:00");
  const [workDays, setWorkDays] = React.useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [timezone, setTimezone] = React.useState("asia-bangkok");
  const [title, setTitle] = React.useState("mr");
  const [aiProvider, setAiProvider] = React.useState("gemini");
  const [tone, setTone] = React.useState("formal");
  // state test api
  const [testingKey, setTestingKey] = React.useState(false);
  const [testResult, setTestResult] = React.useState({ text: "", type: "" });

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("app_token");
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const s = data.setting;
          
          if (s) {
            if (s.defaultModel) setAiProvider(s.defaultModel);
            if (s.startTime) setStartTime(s.startTime);
            if (s.endTime) setEndTime(s.endTime);
            if (s.workDays) setWorkDays(s.workDays);
            if (s.timezone) setTimezone(s.timezone);
            if (s.title) setTitle(s.title);
            if (s.tone) setTone(s.tone);
          }
          if (data.configuredKeys) {
            setConfiguredKeys(data.configuredKeys);
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [API_BASE]);

// ฟังก์ชันทดสอบ API Key
  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({ text: "กรุณากรอก API Key ก่อนทดสอบ", type: "error" });
      return;
    }

    setTestingKey(true);
    setTestResult({ text: "", type: "" });

    try {
      const token = localStorage.getItem("app_token");
      const res = await fetch(`${API_BASE}/api/settings/test-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provider: aiProvider, apiKey: apiKeyInput.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "API Key ไม่ถูกต้อง");
      }

      setTestResult({ text: "✅ API Key ใช้งานได้!", type: "success" });
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : "API Key ไม่ถูกต้อง";
      setTestResult({ text: `❌ ${errorMessage}`, type: "error" });
    } finally {
      setTestingKey(false);
    }
  };


  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: "", type: "" });
    
    try {
      const token = localStorage.getItem("app_token");

      // 1. บันทึกการตั้งค่าทั้งหมด
      const settingRes = await fetch(`${API_BASE}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          defaultModel: aiProvider,
          startTime,
          endTime,
          workDays,
          timezone,
          title,
          tone
        }),
      });

      // ✅ ดักจับ Error สำหรับการตั้งค่า
      if (!settingRes.ok) {
        throw new Error("เกิดข้อผิดพลาดในการบันทึกการตั้งค่าทั่วไป");
      }

      // 2. เซฟ API Key (ถ้ามีการพิมพ์ใหม่)
      if (apiKeyInput.trim() !== "") {
        const keyRes = await fetch(`${API_BASE}/api/settings/key`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ provider: aiProvider, apiKey: apiKeyInput.trim() }),
        });

        // ✅ ดักจับ Error สำหรับ API Key 
        if (!keyRes.ok) {
          const errorData = await keyRes.json().catch(() => ({}));
          throw new Error(errorData.error || "เกิดข้อผิดพลาดในการบันทึก API Key");
        }

        // ถ้าผ่าน ค่อยอัปเดต UI ว่าเซฟแล้ว
        setConfiguredKeys((prev) => ({ ...prev, [aiProvider]: true }));
        setApiKeyInput(""); 
      }

      // ถ้าทุกอย่างผ่านฉลุย ค่อยขึ้นข้อความสีเขียว
      setMessage({ text: "บันทึกการตั้งค่าเรียบร้อยแล้ว", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);

    } catch (error: Error | unknown) {
      console.error("Error saving:", error);
      // ✅ นำข้อความ Error ไปโชว์บนหน้าเว็บ (ข้อความสีแดง)
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึก";
      setMessage({ text: errorMessage, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkDay = (day: string) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">กำลังโหลดการตั้งค่า...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative">
      {message.text && (
        <div className={cn("p-3 rounded-md text-sm font-medium mb-4 text-center", 
          message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {message.text}
        </div>
      )}

      {/* Working hours */}
      <section className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Working hours</h3>
            <p className="text-sm text-muted-foreground">กำหนดช่วงเวลาทำงาน</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="startTime">Start time</Label>
            <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endTime">End time</Label>
            <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

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

        <div className="space-y-1">
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="timezone" className="w-full sm:max-w-xs">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asia-bangkok">Asia/Bangkok (GMT+7)</SelectItem>
              <SelectItem value="asia-tokyo">Asia/Tokyo (GMT+9)</SelectItem>
              <SelectItem value="europe-london">Europe/London (GMT+0)</SelectItem>
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
          <Select value={title} onValueChange={setTitle}>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* ส่วนรับค่า API Key (นำไปแทนที่ block เดิมใน section Generative AI) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="apiKey">API Key</Label>
              {configuredKeys[aiProvider] && (
                <span className="text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  ✅ ตั้งค่าแล้ว
                </span>
              )}
            </div>
            
            {/* ✅ เพิ่มเลย์เอาต์ช่องกรอกคู่กับปุ่ม Test */}
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type="password"
                placeholder={`กรอก API Key ของ ${aiProvider}`}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setTestResult({ text: "", type: "" }); // ล้างผลทดสอบเมื่อพิมพ์ใหม่
                }}
                className="font-mono text-sm"
              />
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleTestKey}
                disabled={testingKey || !apiKeyInput.trim() || aiProvider !== 'gemini'} // ปิดปุ่มถ้าไม่ใช่ Gemini เพราะยังไม่ได้ทำค่ายอื่น
              >
                {testingKey ? "Testing..." : "Test Key"}
              </Button>
            </div>
            
            {/* แสดงผลการทดสอบคีย์ */}
            {testResult.text && (
              <p className={cn("text-xs font-medium", testResult.type === "success" ? "text-green-600" : "text-red-600")}>
                {testResult.text}
              </p>
            )}

            {configuredKeys[aiProvider] && !testResult.text && (
              <p className="text-xs text-muted-foreground">
                *ใส่ Key ใหม่เฉพาะกรณีที่ต้องการอัปเดตหรือแก้ไข
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Reply Tone */}
      <section className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Reply tone</h3>
            <p className="text-sm text-muted-foreground">
              เลือกโทนภาษาที่ใช้ในการตอบกลับอีเมล เช่น ทางการ (Formal) หรือไม่ทางการ (Casual)
            </p>
          </div>
        </div>

        <div className="w-full sm:max-w-xs space-y-1">
          <Label htmlFor="toneSelect">Tone</Label>
          <Select value={tone} onValueChange={setTone}>
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
        <Button variant="outline" type="button" onClick={() => window.location.reload()}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "กำลังบันทึก..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}