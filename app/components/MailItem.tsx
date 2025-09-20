import type { Mail } from "@/app/types/mail";

function badgeClass(status: Mail["status"]) {
  switch (status) {
    case "Draft":
      return "bg-yellow-100 text-yellow-700";
    case "Sent":
      return "bg-green-100 text-green-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

export default function MailItem({ mail }: { mail: Mail }) {
  return (
    <div className="p-4 rounded-lg hover:bg-[#E9ECEF] transition text-left cursor-pointer flex justify-between items-center shadow-sm">
      <div className="min-w-0">
        <div className="font-semibold truncate">{mail.subject}</div>
        <div className="text-sm text-gray-600 truncate">
          {mail.sender} — {mail.snippet}
        </div>
        <div className="text-xs text-gray-400">{mail.date}</div>
      </div>
      <span className={`ml-4 px-3 py-1 text-xs rounded-full ${badgeClass(mail.status)}`}>
        {mail.status}
      </span>
    </div>
  );
}
