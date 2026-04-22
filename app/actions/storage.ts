"use server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 서버 사이드에서 이미지를 Cloudinary에 업로드합니다.
 * @param base64 이미지의 Base64 데이터
 */
export async function uploadToCloudinaryAction(base64: string) {
  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder: "novel_platform",
      resource_type: "auto",
    });
    return { success: true, url: result.secure_url };
  } catch (error: any) {
    console.error("Cloudinary Server Upload Error:", error);
    return { success: false, error: error.message || "이미지 업로드 중 서버 오류 발생" };
  }
}
