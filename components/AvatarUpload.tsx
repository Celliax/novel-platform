"use client";

import { useState, useRef } from "react";
import { User as UserIcon, Camera, Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AvatarUpload({ user }: { user: { id: string; avatar: string | null; name: string | null } }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // 이미지를 읽어서 캔버스에서 리사이징 후 Base64로 변환 (Supabase Storage 없이 DB에 직접 저장하기 위함)
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 250;
          const MAX_HEIGHT = 250;
          let width = img.width;
          let height = img.height;

          // 비율 유지하며 리사이징
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // 압축된 Base64 문자열
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

          // 1. Supabase Auth Metadata 업데이트
          const supabase = getSupabaseClient();
          await supabase.auth.updateUser({
            data: { avatar_url: dataUrl },
          });

          // 2. Prisma DB 업데이트
          const res = await fetch("/api/user/update", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar: dataUrl }),
          });

          if (!res.ok) throw new Error("프로필 사진 저장 실패");

          router.refresh();
          setUploading(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);

    } catch (error: any) {
      alert(error.message || "이미지 업로드에 실패했습니다.");
      setUploading(false);
    }
  };

  return (
    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
      {user.avatar ? (
        <img
          src={user.avatar}
          alt="avatar"
          className="w-24 h-24 rounded-full object-cover border border-border group-hover:opacity-50 transition-opacity"
        />
      ) : (
        <div className="w-24 h-24 rounded-full bg-surface border border-border flex items-center justify-center group-hover:opacity-50 transition-opacity">
          <UserIcon size={40} className="text-muted" />
        </div>
      )}

      {/* 오버레이 (마우스 올렸을 때 카메라 아이콘 표시) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/30">
        {uploading ? (
          <Loader2 className="animate-spin text-white drop-shadow-md" size={28} />
        ) : (
          <Camera className="text-white drop-shadow-md" size={28} />
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
