"use client";

import Link from "next/link";
import { ArrowRight, Bot, CalendarCheck, Zap } from "lucide-react";
import { useAuth } from "@/provider/AuthProvider";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="grow">
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-blue-50 to-white z-0" />
          <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              จัดการอีเมลและตารางงาน <br className="hidden md:block" />
              <span className="text-blue-600">ด้วยผู้ช่วย AI อัจฉริยะ</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              MailMind ช่วยคุณอ่านอีเมลที่ซับซ้อน ร่างข้อความตอบกลับอย่างมืออาชีพ 
              และบันทึกนัดหมายลง Google Calendar ให้คุณโดยอัตโนมัติ ประหยัดเวลาทำงานของคุณและเพิ่มประสิทธิภาพในทุกวัน
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href={user ? "/inbox" : "/login"} 
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
              >
                {user ? "ไปที่กล่องข้อความ" : "เริ่มต้นใช้งาน"} 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="#features" 
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 hover:text-blue-600 font-semibold rounded-full shadow-sm border border-slate-200 transition-all text-center"
              >
                ดูฟีเจอร์ทั้งหมด
              </Link>
            </div>
          </div>
        </section>

        {/*Features Section (ส่วนแนะนำความสามารถ)*/}
        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">ทำไมต้องเลือก MailMind?</h2>
              <p className="text-slate-500">ยกระดับประสิทธิภาพการทำงานของคุณด้วยฟีเจอร์ที่ออกแบบมาเพื่อคนวัยทำงาน</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">AI หลากหลายค่าย</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  เลือกใช้โมเดล AI ที่คุณถนัด ไม่ว่าจะเป็น Gemini, ChatGPT, Claude หรือ IntelSphere เพื่อผลลัพธ์ที่ตรงใจที่สุด
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">ลงปฏิทินอัตโนมัติ</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  สกัดข้อมูลวันที่ เวลา และสถานที่จากอีเมล พร้อมสร้าง Event ลง Google Calendar ทันทีเมื่อคุณกดอนุมัติ
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">ร่างอีเมลสุดฉลาด</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  ปรับโทนภาษา (Tone) คำลงท้าย และบริบทการตอบกลับให้เหมาะสมกับบุคคลโดยอัตโนมัติ
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-900 text-white">
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">พร้อมที่จะเปลี่ยนวิธีจัดการอีเมลหรือยัง?</h2>
            <p className="text-slate-400 mb-10 text-lg">
              เชื่อมต่อบัญชี Google ของคุณวันนี้ แล้วปล่อยให้ AI จัดการงานที่น่าเบื่อแทนคุณ
            </p>
            <Link 
              href="/login" 
              className="inline-block px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-full transition-colors shadow-lg"
            >
              เชื่อมต่อบัญชี Gmail ทันที
            </Link>
          </div>
        </section>
      </main>

      {/*Footer*/}
      <footer className="bg-slate-50 py-10 border-t border-slate-200">
        <div className="container mx-auto px-6 flex flex-col items-center justify-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-slate-600 mb-6">
            <Link href="/terms" className="hover:text-blue-600 transition-colors">
              Terms of Use
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </Link>
          </div>
          
          <div className="text-center text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} MailMind. All rights reserved.</p>
            <p className="mt-2 text-xs">A capstone project showcasing Generative AI integration.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}