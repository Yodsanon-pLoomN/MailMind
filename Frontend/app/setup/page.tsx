"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/provider/AuthProvider";
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
import {ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SetupPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  // State สำหรับด่านตรวจ
  const [checkingSetup, setCheckingSetup] = React.useState(true);

  // 🌟 State สำหรับ Provider และ Models ตามแบบที่คุณต้องการ
  const [aiProvider, setAiProvider] = React.useState("gemini");
  
  const [geminiModel, setGeminiModel] = React.useState("gemini-2.5-flash");
  const [openaiModel, setOpenaiModel] = React.useState("gpt-4o-mini");
  const [claudeModel, setClaudeModel] = React.useState("claude-3-haiku-20240307");
  const [openRouterModel, setOpenRouterModel] = React.useState("stepfun/step-3.5-flash:free");
  const [intelsphereModel, setIntelsphereModel] = React.useState("gemini-2.5-flash-lite");
  
  const [customModelName, setCustomModelName] = React.useState("");
  const [apiKeyInput, setApiKeyInput] = React.useState("");
  const [configuredKeys, setConfiguredKeys] = React.useState<Record<string, boolean>>({});

  // State สำหรับปุ่มต่างๆ
  const [testingKey, setTestingKey] = React.useState(false);
  const [deletingKey, setDeletingKey] = React.useState(false);
  const [testResult, setTestResult] = React.useState({ text: "", type: "" });
  
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState({ text: "", type: "" });

  // 🌟 Helper ดึงชื่อ Model ที่จะถูกใช้งานจริง
  const getCurrentModelName = () => {
    if (aiProvider === "gemini") return geminiModel === "custom" ? customModelName.trim() : geminiModel;
    if (aiProvider === "openai") return openaiModel === "custom" ? customModelName.trim() : openaiModel;
    if (aiProvider === "claude") return claudeModel === "custom" ? customModelName.trim() : claudeModel;
    if (aiProvider === "openrouter") return openRouterModel === "custom" ? customModelName.trim() : openRouterModel;
    if (aiProvider === "intelsphere") return intelsphereModel === "custom" ? customModelName.trim() : intelsphereModel;
    return "";
  };

  // 🌟 ด่านตรวจ: เช็คว่าถ้ามีคีย์อยู่แล้วให้ไป /inbox ทันที
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }

    const checkExistingSetup = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("app_token");
        const res = await fetch(`${API_BASE}/api/settings/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.hasSetupKey) {
            window.location.href = "/inbox"; // มีคีย์แล้ว ข้ามไป Inbox
          } else {
            setCheckingSetup(false); // ยังไม่มีคีย์ เปิดฟอร์มให้กรอก
          }
        } else {
          setCheckingSetup(false);
        }
      } catch (error) {
        console.error("Error checking setup:", error);
        setCheckingSetup(false);
      }
    };

    if (user) checkExistingSetup();
  }, [user, authLoading, router, API_BASE]);

  // ฟังก์ชันทดสอบปุ่ม Test Key ย่อย
  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({ text: "กรุณากรอก API Key ก่อนทดสอบ", type: "error" });
      return;
    }

    setTestingKey(true);
    setTestResult({ text: "", type: "" });

    try {
      const token = localStorage.getItem("app_token");
      const modelName = getCurrentModelName();

      const res = await fetch(`${API_BASE}/api/settings/test-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ provider: aiProvider, apiKey: apiKeyInput.trim(), modelName }),
      });

      if (!res.ok) throw new Error("API Key ไม่ถูกต้อง");
      setTestResult({ text: "✅ API Key ใช้งานได้!", type: "success" });
    } catch (error: Error | unknown) {
      setTestResult({ text: `❌ API Key ไม่ถูกต้อง`, type: "error" });
    } finally {
      setTestingKey(false);
    }
  };

  // ฟังก์ชันลบปุ่ม Delete Key ย่อย
  const handleDeleteKey = async () => {
    if (!confirm(`คุณต้องการลบ API Key ของ ${aiProvider.toUpperCase()} ใช่หรือไม่?`)) return;
    setDeletingKey(true);
    try {
      const token = localStorage.getItem("app_token");
      await fetch(`${API_BASE}/api/settings/key/${aiProvider}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfiguredKeys((prev) => ({ ...prev, [aiProvider]: false }));
      setApiKeyInput("");
      setTestResult({ text: "🗑️ ลบ API Key แล้ว", type: "success" });
    } catch (error) {
      setTestResult({ text: `❌ ลบไม่สำเร็จ`, type: "error" });
    } finally {
      setDeletingKey(false);
    }
  };

  // 🌟 ฟังก์ชันหลัก: บันทึกและเริ่มใช้งาน (ปุ่มใหญ่ด้านล่าง)
  const handleConnect = async () => {
    const finalModelName = getCurrentModelName();
    
    if (!finalModelName) {
      setMessage({ text: "กรุณาระบุชื่อโมเดลที่ต้องการใช้งาน", type: "error" });
      return;
    }

    if (!apiKeyInput.trim() && !configuredKeys[aiProvider]) {
      setMessage({ text: "กรุณากรอก API Key ก่อนดำเนินการต่อ", type: "error" });
      return;
    }

    setSaving(true);
    setMessage({ text: "กำลังตรวจสอบและบันทึกข้อมูล...", type: "info" });

    try {
      const token = localStorage.getItem("app_token");

      // ถ้ามีการพิมพ์ Key ใหม่ ให้เทสและบันทึก Key ก่อน
      if (apiKeyInput.trim()) {
        const testRes = await fetch(`${API_BASE}/api/settings/test-key`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ provider: aiProvider, apiKey: apiKeyInput.trim(), modelName: finalModelName }),
        });

        if (!testRes.ok) throw new Error(`API Key ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง`);

        await fetch(`${API_BASE}/api/settings/key`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ provider: aiProvider, apiKey: apiKeyInput.trim() }),
        });
      }

      // บันทึก Default Provider และ Model ลง Settings
      await fetch(`${API_BASE}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ defaultProvider: aiProvider, defaultModel: finalModelName }),
      });

      setMessage({ text: "✅ ตั้งค่าสำเร็จ! กำลังพาคุณไปที่กล่องข้อความ...", type: "success" });
      
      setTimeout(() => {
        window.location.href = "/inbox";
      }, 1000);

    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      setMessage({ text: `❌ ${errorMessage}`, type: "error" });
      setSaving(false);
    }
  };

  if (authLoading || checkingSetup || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium animate-pulse">กำลังตรวจสอบการตั้งค่าของคุณ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-8 relative overflow-hidden">
        
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="text-center space-y-3 relative z-10">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">เชื่อมต่อผู้ช่วย AI ของคุณ</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            เลือกค่าย Generative AI และตั้งค่า API Key <br/>
            เพื่อให้ MailMind เริ่มวิเคราะห์อีเมลของคุณได้อย่างแม่นยำ
          </p>
        </div>

        {/* =========================================
            UI ส่วนที่คุณให้มา นำมาปรับใช้ตรงนี้
        ========================================= */}
        <div className="space-y-6 relative z-10">
          <div className="space-y-2">
            <Label htmlFor="aiProvider" className="text-slate-700 font-semibold">AI Provider (ค่ายที่ให้บริการ)</Label>
            <Select
              value={aiProvider}
              onValueChange={(v) => {
                setAiProvider(v);
                setApiKeyInput(""); 
                setTestResult({ text: "", type: "" }); 
              }}
            >
              <SelectTrigger id="aiProvider" className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-500">
                <SelectValue placeholder="เลือก AI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                <SelectItem value="claude">Anthropic Claude</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
                <SelectItem value="intelsphere">IntelSphere (KKU)</SelectItem>
              </SelectContent>
            </Select>

            {/* แสดง Dropdown เลือกรุ่นโมเดลแบบเจาะจงตามค่ายที่เลือก */}
            <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">เลือกรุ่นของโมเดล (Model Version)</Label>
                
                {/* 1. โมเดล Gemini */}
                {aiProvider === "gemini" && (
                  <Select value={geminiModel} onValueChange={setGeminiModel}>
                    <SelectTrigger className="bg-white h-10"><SelectValue placeholder="เลือกโมเดล" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="custom">กำหนดชื่อโมเดลเอง (Custom)</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* 2. โมเดล OpenAI */}
                {aiProvider === "openai" && (
                  <Select value={openaiModel} onValueChange={setOpenaiModel}>
                    <SelectTrigger className="bg-white h-10"><SelectValue placeholder="เลือกโมเดล" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="custom">กำหนดชื่อโมเดลเอง (Custom)</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* 3. โมเดล Claude */}
                {aiProvider === "claude" && (
                  <Select value={claudeModel} onValueChange={setClaudeModel}>
                    <SelectTrigger className="bg-white h-10"><SelectValue placeholder="เลือกโมเดล" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                      <SelectItem value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                      <SelectItem value="custom">กำหนดชื่อโมเดลเอง (Custom)</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* 4. โมเดล OpenRouter */}
                {aiProvider === "openrouter" && (
                  <Select value={openRouterModel} onValueChange={setOpenRouterModel}>
                    <SelectTrigger className="bg-white h-10"><SelectValue placeholder="เลือกโมเดล" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stepfun/step-3.5-flash:free">StepFun 3.5 Flash</SelectItem>
                      <SelectItem value="custom">กำหนดชื่อโมเดลเอง (Custom)</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* 5. โมเดล IntelSphere */}
                {aiProvider === "intelsphere" && (
                  <Select value={intelsphereModel} onValueChange={setIntelsphereModel}>
                    <SelectTrigger className="bg-white h-10"><SelectValue placeholder="เลือกโมเดล" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="deepseek-v3.2">DeepSeek V3.2</SelectItem>
                      <SelectItem value="custom">กำหนดชื่อโมเดลเอง (Custom)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              {/* ช่องกรอกชื่อโมเดลแบบกำหนดเอง */}
              {((aiProvider === "gemini" && geminiModel === "custom") ||
                (aiProvider === "openai" && openaiModel === "custom") ||
                (aiProvider === "claude" && claudeModel === "custom") ||
                (aiProvider === "openrouter" && openRouterModel === "custom") ||
                (aiProvider === "intelsphere" && intelsphereModel === "custom")) && (
                <div className="space-y-1 pt-2">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">ระบุ Model ID (Custom)</Label>
                  <Input 
                    value={customModelName} 
                    onChange={(e) => setCustomModelName(e.target.value)} 
                    placeholder="เช่น my-custom-model-id" 
                    className="bg-white text-sm h-10"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="apiKey" className="text-slate-700 font-semibold">API Key ({aiProvider.toUpperCase()})</Label>
              {configuredKeys[aiProvider] && (
                <span className="text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  ตั้งค่าแล้ว
                </span>
              )}
            </div>
            
            <Input
              id="apiKey"
              type="password"
              placeholder={configuredKeys[aiProvider] ? "ตั้งค่าไว้แล้ว (พิมพ์ใหม่เพื่อเปลี่ยน)" : `กรอก API Key ของ ${aiProvider}`}
              value={apiKeyInput}
              onChange={(e) => {
                setApiKeyInput(e.target.value);
                setTestResult({ text: "", type: "" }); 
              }}
              className="font-mono text-sm h-12 bg-slate-50 border-slate-200 focus:ring-blue-500"
            />
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleTestKey}
                disabled={testingKey || !apiKeyInput.trim()} 
                className="flex-1 h-10"
              >
                {testingKey ? "Testing..." : "Test Key"}
              </Button>

              {configuredKeys[aiProvider] && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDeleteKey}
                  disabled={deletingKey}
                  className="h-10"
                >
                  {deletingKey ? "..." : "Delete Key"}
                </Button>
              )}
            </div>
            
            {testResult.text && (
              <p className={cn("text-xs font-medium", testResult.type === "success" ? "text-green-600" : "text-red-600")}>
                {testResult.text}
              </p>
            )}
          </div>

          {message.text && (
            <div className={`text-sm p-3 rounded-lg text-center font-medium transition-all ${
              message.type === "error" ? "bg-red-50 text-red-600 border border-red-100" :
              message.type === "success" ? "bg-green-50 text-green-600 border border-green-100" :
              "bg-blue-50 text-blue-600 border border-blue-100"
            }`}>
              {message.text}
            </div>
          )}

          {/* ปุ่มบันทึกหลัก */}
          <Button 
            className="w-full h-12 text-base font-semibold shadow-md shadow-blue-200 hover:shadow-lg hover:-translate-y-0.5 transition-all mt-4" 
            onClick={handleConnect}
            disabled={saving}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังดำเนินการ...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                เชื่อมต่อและเริ่มใช้งาน
                <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </Button>

        </div>
      </div>
    </div>
  );
}