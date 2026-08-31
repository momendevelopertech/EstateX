import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder = "estatex",
): Promise<CloudinaryUploadResult> {
  const dataUri = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
    transformation: [{ width: 1200, crop: "limit", quality: "auto" }],
  });
  return { secure_url: result.secure_url, public_id: result.public_id };
}