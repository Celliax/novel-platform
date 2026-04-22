import { uploadToCloudinaryAction } from "@/app/actions/storage";

/**
 * 이미지를 서버를 통해 Cloudinary에 업로드합니다.
 * @param file 업로드할 파일 객체
 * @returns 업로드된 이미지의 공개 URL
 */
export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const result = await uploadToCloudinaryAction(base64);
        if (result.success && result.url) {
          resolve(result.url);
        } else {
          reject(new Error(result.error || "업로드 실패"));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Base64 데이터를 서버를 통해 Cloudinary에 업로드합니다.
 */
export async function uploadBase64Image(base64: string): Promise<string> {
  try {
    const result = await uploadToCloudinaryAction(base64);
    if (result.success && result.url) {
      return result.url;
    } else {
      throw new Error(result.error || "Base64 업로드 실패");
    }
  } catch (error: any) {
    console.error("Base64 Storage Error:", error);
    throw new Error(error.message || "이미지 변환 중 오류가 발생했습니다.");
  }
}
