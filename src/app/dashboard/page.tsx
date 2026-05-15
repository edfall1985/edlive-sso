import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto mt-20 p-6">
      <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
        <img
          src={session.user.image || "/avatar-placeholder.svg"}
          alt=""
          className="w-20 h-20 rounded-full mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold mb-1">
          {session.user.name}
        </h1>
        <p className="text-gray-500 mb-1">{session.user.email}</p>
        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 capitalize">
          {session.user.role}
        </span>

        <div className="mt-6 flex gap-3 justify-center">
          <a
            href={process.env.EDLIVE_URL || "http://localhost:3001"}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to edLive
          </a>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
