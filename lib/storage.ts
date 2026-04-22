import { getSupabaseClient } from "./supabase/client";

/**
 * 클라이언트 측에서 파일을 Supabase Storage에 업로드합니다.
 * @param file 업로드할 파일 객체
 * @param bucket 버킷 이름 (기본값: 'images')
 * @returns 업로드된 파일의 공개 URL
 */
export async function uploadImage(file: File, bucket: string = "images"): Promise<string> {
  const supabase = getSupabaseClient();
  
  // 파일 확장자 추출
  const fileExt = file.name.split('.').pop();
  // 고유한 파일 이름 생성
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  // 공개 URL 가져오기
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}
