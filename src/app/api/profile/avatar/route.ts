import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token) as { id: string };

    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { success: false, message: "No image provided" },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Upload the image to a cloud storage (e.g., AWS S3, Cloudinary)
    // 2. Get the URL of the uploaded image
    // For this example, we'll just simulate it
    const imageUrl = `/avatars/${Date.now()}-${image.name}`;

    const user = await User.findByIdAndUpdate(
      decoded.id,
      {
        $set: { "profile.avatar": imageUrl },
      },
      { new: true }
    ).select("profile.avatar");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, avatar: user.profile.avatar },
      { status: 200 }
    );
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
} 