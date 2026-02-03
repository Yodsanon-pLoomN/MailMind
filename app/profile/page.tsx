import { SideNavbar }  from "@/components/SideNavbar";
import Navbar from "@/components/Navbar";
import { redirect } from "next/navigation";
import GmailProfileCard from "@/components/Profile";
import {mockUser} from "@/lib/mock";

export default  function Home() {
  return (<>
    <Navbar user={mockUser} />
    <div className="mx-auto max-w-7xl px-4 py-6">
      
      <div className="md:flex md:gap-6 items-start space-y-6">
        <SideNavbar />

        <main className="flex-1 drop-shadow-lg">
          <section className="bg-white rounded-lg shadow p-6 min-h-[70vh]">
            <h1 className="text-3xl font-bold mb-6">Profile</h1>
            <GmailProfileCard user={mockUser}/>
          </section>
        </main>
      </div>
    </div>
    </>
  );
}
