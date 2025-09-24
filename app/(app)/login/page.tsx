"use client";


import SignIn from "@/app/components/sign-in";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <main className="flex-1 drop-shadow-lg">
        <section className="bg-white rounded-lg shadow p-8 min-h-[70vh] flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-8">MailMind</h1>

          {/* Google Login Button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-5 py-2 shadow-sm hover:bg-gray-50 transition"
          >
            {/* Google Icon (SVG) */}
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="#EA4335"
                d="M488 261.8c0-17.4-1.5-34.1-4.3-50.4H249v95.2h134.3c-5.8 31-23.4 57.3-50 74.8l81 63.1c47.3-43.6 73.7-107.9 73.7-182.7z"
              />
              <path
                fill="#34A853"
                d="M249 492c67.5 0 124-22.4 165.3-61l-81-63.1c-22.5 15.1-51.4 24-84.3 24-64.9 0-119.8-43.9-139.4-103.1l-84.6 65.4C63.1 444.3 149.5 492 249 492z"
              />
              <path
                fill="#4A90E2"
                d="M109.6 288c-4.7-14-7.4-29-7.4-44s2.7-30 7.4-44l-84.6-65.4C9 162.3 0 204.3 0 244s9 81.7 25 115.4l84.6-65.4z"
              />
              <path
                fill="#FBBC05"
                d="M249 97c35.9 0 68.2 12.4 93.6 36.5l70.2-70.2C373 21.3 316.5 0 249 0 149.5 0 63.1 47.7 25 128.6l84.6 65.4C129.2 140.9 184.1 97 249 97z"
              />
            </svg>
            <span className="text-sm font-medium">Sign in with Google</span>
          </button>

          <SignIn />

          {/* Terms and Service */}
          <p className="text-xs text-gray-500 mt-6 text-center">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-blue-600">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-blue-600">
              Privacy Policy
            </Link>.
          </p>
        </section>
      </main>
    </div>
  );
}
