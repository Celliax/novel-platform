/**
 * 이미지를 Cloudinary API를 통해 업로드합니다.
 * @param file 업로드할 파일 객체
 * @returns 업로드된 이미지의 공개 URL
 */
export async function uploadImage(file: File): Promise<string> {
  const CLOUD_NAME = "dgkarqfds";
  const UPLOAD_PRESET = "qvhyc3hj";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Cloudinary Error Detail:", result);
      // 에러 메시지를 더 명확하게 던집니다.
      const errorMsg = result.error?.message || "알 수 없는 Cloudinary 오류";
      throw new Error(`Cloudinary 업로드 실패: ${errorMsg}`);
    }

    // 업로드 성공 시 이미지의 보안 URL(https) 반환
    return result.secure_url;
  } catch (error: any) {
    console.error("Storage Upload Error:", error);
    throw new Error(error.message || "이미지 업로드 중 오류가 발생했습니다.");
  }
}

/**
 * Base64 데이터를 Cloudinary에 업로드합니다.
 */
export async function uploadBase64Image(base64: string): Promise<string> {
  const CLOUD_NAME = "dgkarqfds";
  const UPLOAD_PRESET = "qvhyc3hj";

  try {
    // Base64 문자열이 너무 길 경우 JSON으로 보내면 제한에 걸릴 수 있으므로 FormData를 권장
    const formData = new FormData();
    formData.append("file", base64);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();
    if (!response.ok) {
      console.error("Cloudinary Base64 Error:", result);
      throw new Error(result.error?.message || "Base64 업로드 실패");
    }
    return result.secure_url;
  } catch (error: any) {
    console.error("Base64 Storage Error:", error);
    throw new Error(error.message || "이미지 변환 중 오류가 발생했습니다.");
  }
}
