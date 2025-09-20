export type MailStatus = "Draft" | "Sent" | "Pending";

export type Mail = {
  id: number | string;
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  status: MailStatus;
};