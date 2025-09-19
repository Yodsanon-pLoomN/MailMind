import { Navbar } from "@/app/components/Navbar";

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row  min-h-screen bg-gray-100 md:gap-6 gap-0">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <div className="mx-auto max-w-screen-xl w-full flex flex-col p-6 bg-white min-h-[90vh] my-6 rounded-lg shadow-md">
        {/* Header */}
        <h1 className="text-4xl font-bold mb-6">Inbox</h1>

        {/* List Section */}
        <div className="space-y-4">
          <div className="p-4 bg-amber-200 rounded">Mail item 1</div>
          <div className="p-4 bg-amber-200 rounded">Mail item 2</div>
          <div className="p-4 bg-amber-200 rounded">Mail item 3</div>
        </div>
      </div>
    </div>
  );
}
