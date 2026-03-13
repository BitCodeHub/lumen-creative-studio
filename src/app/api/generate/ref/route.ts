import { NextRequest, NextResponse } from "next/server";

const COMFY_URL = process.env.COMFY_URL || "http://localhost:8188";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyB4EzkfKSTezcK2ZEUPWlkShTtDhTpO_Ic";
const GEMINI_IMAGE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

async function generateWithGemini(refImageBytes: ArrayBuffer, mimeType: string, prompt: string): Promise<Buffer | null> {
  const base64Image = Buffer.from(refImageBytes).toString("base64");

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64Image } },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["image", "text"],
    },
  };

  const res = await fetch(GEMINI_IMAGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("Gemini error:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inline_data?.mime_type?.startsWith("image/")) {
      return Buffer.from(part.inline_data.data, "base64");
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const refImage = form.get("refImage") as File | null;
    const prompt = (form.get("prompt") as string) || "";
    const model = (form.get("model") as string) || "realvisxl";
    const width = parseInt((form.get("width") as string) || "832");
    const height = parseInt((form.get("height") as string) || "1216");
    const mode = (form.get("mode") as string) || "reference";
    // useGemini flag: set by frontend when user uploads reference + text
    const useGemini = (form.get("useGemini") as string) === "true" || mode === "gemini";

    if (!refImage) return NextResponse.json({ error: "No reference image" }, { status: 400 });

    // === GEMINI PATH: reference image + text prompt → Nano Banana 2.0 ===
    if (useGemini) {
      const imageBytes = await refImage.arrayBuffer();
      const mimeType = refImage.type || "image/jpeg";

      const imageBuffer = await generateWithGemini(imageBytes, mimeType, prompt);
      if (!imageBuffer) {
        return NextResponse.json({ error: "Gemini generation failed" }, { status: 500 });
      }

      // Return image directly as base64 data URL for immediate display
      const base64 = imageBuffer.toString("base64");
      return NextResponse.json({
        type: "gemini",
        image: `data:image/png;base64,${base64}`,
      });
    }

    // === COMFYUI PATH: standard img2img via IP-Adapter ===
    // Upload ref image to ComfyUI
    const uploadForm = new FormData();
    uploadForm.append("image", refImage, refImage.name || "ref.jpg");
    uploadForm.append("type", "input");
    uploadForm.append("overwrite", "true");

    const uploadRes = await fetch(`${COMFY_URL}/upload/image`, {
      method: "POST",
      body: uploadForm,
      headers: { "ngrok-skip-browser-warning": "1" },
    });
    if (!uploadRes.ok) return NextResponse.json({ error: "Failed to upload reference image" }, { status: 500 });
    const { name: uploadedName } = await uploadRes.json();

    // Model selection
    const modelFile = model === "flux-schnell"
      ? "flux1-schnell-fp8.safetensors"
      : model === "flux-dev"
      ? "flux1-dev.safetensors"
      : model === "juggernaut"
      ? "juggernautXL_v9.safetensors"
      : "RealVisXL_V4.safetensors";

    const denoisingStrength = mode === "enhance" ? 0.35 : mode === "edit" ? 0.65 : 0.85;

    const workflow = {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: modelFile } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: prompt + ", masterpiece, best quality, highly detailed, photorealistic", clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: "crooked nose, asymmetric face, deformed mouth, crooked mouth, uneven eyes, misaligned eyes, bad teeth, extra fingers, missing fingers, bad hands, mutated hands, poorly drawn face, deformed, ugly, blurry, bad anatomy, watermark, text", clip: ["1", 1] } },
      "4": { class_type: "LoadImage", inputs: { image: uploadedName } },
      "5": { class_type: "ImageScale", inputs: { image: ["4", 0], width, height, upscale_method: "lanczos", crop: "center" } },
      "6": { class_type: "VAEEncode", inputs: { pixels: ["5", 0], vae: ["1", 2] } },
      "7": {
        class_type: "KSampler",
        inputs: {
          model: ["1", 0],
          positive: ["2", 0],
          negative: ["3", 0],
          latent_image: ["6", 0],
          seed: Math.floor(Math.random() * 1e10),
          steps: mode === "enhance" ? 20 : 30,
          cfg: 4.5,
          sampler_name: "dpmpp_2m_sde",
          scheduler: "karras",
          denoise: denoisingStrength,
        }
      },
      "8": { class_type: "VAEDecode", inputs: { samples: ["7", 0], vae: ["1", 2] } },
      "9": { class_type: "SaveImage", inputs: { images: ["8", 0], filename_prefix: "ref_gen" } },
    };

    const queueRes = await fetch(`${COMFY_URL}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" },
      body: JSON.stringify({ prompt: workflow }),
    });
    if (!queueRes.ok) return NextResponse.json({ error: "ComfyUI queue failed" }, { status: 500 });
    const { prompt_id } = await queueRes.json();

    return NextResponse.json({ promptId: prompt_id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
