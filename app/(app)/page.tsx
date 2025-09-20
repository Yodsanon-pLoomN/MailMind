import { Navbar } from "@/app/components/Navbar";
import MailList from "@/app/components/MailList";
import { mails } from "@/app/data/dummy";

export default function Home() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <div className="md:flex md:gap-6 items-start space-y-6">
        <Navbar />

        <main className="flex-1 drop-shadow-lg">
          <section className="bg-white rounded-lg shadow p-6 min-h-[70vh]">
            <h1 className="text-3xl font-bold mb-6">Inbox</h1>
            <MailList items={mails} perPage={10} />
          </section>
        </main>
      </div>
    </div>
  );
}
