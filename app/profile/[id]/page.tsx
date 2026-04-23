import { notFound } from "next/navigation";
import { getUserWithNovels } from "@/lib/novel-service";
import ProfileClient from "../ProfileClient";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;
  
  // 1. Fetch profile data
  const profile = await getUserWithNovels(id);
  if (!profile) notFound();

  // 2. Check if the viewer is the owner
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === id;

  // 3. Render using the common ProfileClient
  return (
    <div className="bg-canvas min-h-screen">
      <ProfileClient 
        user={profile as any} 
        isOwnProfile={isOwnProfile} 
      />
    </div>
  );
}
