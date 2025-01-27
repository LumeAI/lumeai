import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, requestType } = body;

        // Ensure the requestType is valid
        if (!requestType || !["text", "image"].includes(requestType)) {
            return NextResponse.json(
                { error: 'Invalid requestType. Use "text" or "image".' },
                { status: 400 }
            );
        }

        if (requestType === "text") {
            // Handle text-based chat completions
            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                return NextResponse.json(
                    { error: "Valid messages array is required" },
                    { status: 400 }
                );
            }

            const validMessages = messages.every(
                (msg) =>
                    msg &&
                    typeof msg === "object" &&
                    "role" in msg &&
                    "content" in msg &&
                    typeof msg.content === "string" &&
                    msg.content.trim() !== ""
            );

            if (!validMessages) {
                return NextResponse.json(
                    { error: "All messages must have valid role and content" },
                    { status: 400 }
                );
            }

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000,
            });

            if (!completion.choices[0].message) {
                throw new Error("No response from OpenAI");
            }

            return NextResponse.json(completion.choices[0].message);
        } else if (requestType === "image") {
            // Handle image generation
            const { prompt } = body;

            if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
                return NextResponse.json(
                    { error: "A valid prompt is required for image generation." },
                    { status: 400 }
                );
            }

            const imageResponse = await openai.images.generate({
                prompt: prompt,
                n: 1, // Number of images to generate
                size: "512x512", // Image dimensions
            });

            if (!imageResponse.data || imageResponse.data.length === 0) {
                throw new Error("No image generated by OpenAI.");
            }

            return NextResponse.json({
                image_url: imageResponse.data[0].url,
            });
        }

        throw new Error("Invalid request type");

    } catch (error) {
        console.error("API Error:", error);
        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
