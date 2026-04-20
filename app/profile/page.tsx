import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/prisma";
import Link from "next/link";
import { Settings, BookOpen } from "lucide-react";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await getSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { 
      novels: {
        orderBy: { updatedAt: 'desc' }
      } 
    },
  });

  if (!user || !user.isProfileComplete) {
    redirect("/profile/setup");
  }

  return <ProfileClient user={user} />;
}
