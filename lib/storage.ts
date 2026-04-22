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
      throw new Error(`Cloudinary 업로드 실패: ${result.error?.message || "알 수 없는 오류"}`);
    }

    // 업로드 성공 시 이미지의 보안 URL(https) 반환
    return result.secure_url;
  } catch (error) {
    console.error("Upload Error:", error);
    throw error;
  }
}
/**
 * Base64 데이터를 Cloudinary에 업로드합니다.
 */
export async function uploadBase64Image(base64: string): Promise<string> {
  const CLOUD_NAME = "dgkarqfds";
  const UPLOAD_PRESET = "qvhyc3hj";

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64,
          upload_preset: UPLOAD_PRESET,
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "업로드 실패");
    return result.secure_url;
  } catch (error) {
    console.error("Base64 Upload Error:", error);
    throw error;
  }
}
