import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(req: any): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get("filename") || "file"

    if (!req.body) {
      return NextResponse.json({ error: "Request body is missing" }, { status: 400 })
    }

    const blobResult = await put(filename, req.body, {
      access: "public",
    })

    return NextResponse.json(blobResult)
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
