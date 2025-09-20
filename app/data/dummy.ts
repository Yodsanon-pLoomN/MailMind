import type { Mail } from "@/app/types/mail";

export const mails: Mail[] = Array.from({ length: 23 }).map((_, i) => ({
  id: i + 1,
  sender: `Sender ${i + 1}`,
  subject: `Subject of email ${i + 1}`,
  snippet: `This is a short preview of email ${i + 1}.`,
  status: i % 3 === 0 ? "Draft" : i % 3 === 1 ? "Sent" : "Pending",
  date: `2025-09-${String((i % 30) + 1).padStart(2, "0")}`,
}));