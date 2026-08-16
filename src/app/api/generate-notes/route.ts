import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Ensure you have GEMINI_API_KEY set in your local .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    // Convert the incoming Blob to a Base64 string for Gemini's inlineData
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const base64Audio = buffer.toString("base64");

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `
      You are an expert technical note-taker. 
      Analyze this lecture audio chunk and generate comprehensive notes. 
      Use strict Markdown formatting. 
      Include # Headings for main topics, ## Subheadings, and bullet points. 
      Encapsulate any mentioned programming syntax inside proper markdown code blocks.
      Do not include conversational filler like "Here are the notes". Just output the raw markdown.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "audio/mp3",
          data: base64Audio,
        },
      },
    ]);

    return NextResponse.json({ notes: result.response.text() });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate notes" },
      { status: 500 },
    );
  }
}
