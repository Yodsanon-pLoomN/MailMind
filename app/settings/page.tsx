import { SideNavbar }  from "@/components/SideNavbar";
import EmailList from "@/components/EmailList";
import Navbar from "@/components/Navbar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsPanel from "@/components/Settings";

export default async function Home() {
  const session = await auth();

    if (!session?.user) {
      redirect('/login');
    }
    
  return (<>
    <Navbar user={session.user} />
    <div className="mx-auto max-w-7xl px-4 py-6">
      
      <div className="md:flex md:gap-6 items-start space-y-6">
        <SideNavbar />

        <main className="flex-1 drop-shadow-lg">
          <section className="bg-white rounded-lg shadow p-6 min-h-[70vh]">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>
            <SettingsPanel />
          </section>
        </main>
      </div>
    </div>
    </>
  );
}
