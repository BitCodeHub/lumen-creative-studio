import { NextRequest, NextResponse } from "next/server";

const COMFY_URL = process.env.COMFY_URL || "http://100.79.93.27:8188";

// Upload image to ComfyUI and return filename
async function uploadToComfy(buffer: Buffer, filename: string): Promise<string> {
  const form = new FormData();
  const blob = new Blob([buffer], { type: "image/jpeg" });
  form.append("image", blob, filename);
  const res = await fetch(`${COMFY_URL}/upload/image`, {
    method: "POST",
    body: form,
    headers: { "ngrok-skip-browser-warning": "1" },
  });
  if (!res.ok) throw new Error(`ComfyUI upload failed: ${res.status}`);
  const data = await res.json();
  return data.name as string;
}

// Queue a ComfyUI workflow and return prompt_id
async function queueWorkflow(workflow: object): Promise<string> {
  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" },
    body: JSON.stringify({ prompt: workflow }),
  });
  if (!res.ok) throw new Error(`ComfyUI queue failed: ${res.status}`);
  const data = await res.json();
  return data.prompt_id as string;
}

function buildIPAdapterWorkflow(
  refFilename: string,
  prompt: string,
  model: string,
  width: number,
  height: number,
  mode: string
) {
  const modelFile =
    model === "flux-schnell" ? "flux1-schnell-fp8.safetensors"
    : model === "flux-dev" ? "flux1-dev.safetensors"
    : model === "sdxl" ? "juggernautXL_v9.safetensors"
    : "RealVisXL_V4.safetensors";

  const isFlux = model.startsWith("flux");
  const steps = mode === "enhance" ? 30 : mode === "edit" ? 25 : 35;
  const cfg = mode === "enhance" ? 3.5 : mode === "edit" ? 4.0 : 4.5;
  // IP-Adapter weight: reference = 0.7, edit = 0.4 (more freedom), enhance = 0.85 (strong)
  const ipWeight = mode === "edit" ? 0.4 : mode === "enhance" ? 0.85 : 0.7;

  const enhancePrefix = mode === "enhance"
    ? "highly detailed, sharp focus, 8k uhd, professional photography, cinematic lighting, "
    : mode === "edit"
    ? ""
    : "inspired by reference image, ";

  const fullPrompt = enhancePrefix + prompt;

  // IP-Adapter + RealVisXL workflow (img2img style reference)
  return {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "RealVisXL_V4.safetensors" } },
    "2": { class_type: "IPAdapterModelLoader", inputs: { ipadapter_file: "ip-adapter_sdxl.bin" } },
    "3": { class_type: "CLIPVisionLoader", inputs: { clip_name: "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" } },
    "4": { class_type: "LoadImage", inputs: { image: refFilename } },
    "5": { class_type: "CLIPTextEncode", inputs: { text: fullPrompt, clip: ["1", 1] } },
    "6": { class_type: "CLIPTextEncode", inputs: {
      text: "low quality, blurry, deformed, watermark, text, ugly, extra limbs, cropped, worst quality",
      clip: ["1", 1]
    }},
    "7": { class_type: "EmptyLatentImage", inputs: { width, height, batch_size: 1 } },
    "8": {
      class_type: "IPAdapter",
      inputs: {
        model: ["1", 0],
        ipadapter: ["2", 0],
        image: ["4", 0],
        clip_vision: ["3", 0],
        weight: ipWeight,
        noise: 0.0,
        weight_type: "linear",
        start_at: 0.0,
        end_at: 1.0,
        faceid_v2: false,
        weight_v2: 1.0,
        combine_embeds: "concat",
        embeds_scaling: "V only",
      }
    },
    "9": {
      class_type: "KSampler",
      inputs: {
        model: ["8", 0],
        positive: ["5", 0],
        negative: ["6", 0],
        latent_image: ["7", 0],
        sampler_name: "dpmpp_2m_sde",
        scheduler: "karras",
        steps,
        cfg,
        denoise: mode === "edit" ? 0.75 : 1.0,
        seed: Math.floor(Math.random() * 2147483647),
      }
    },
    "10": { class_type: "VAEDecode", inputs: { samples: ["9", 0], vae: ["1", 2] } },
    "11": {
      class_type: "SaveImage",
      inputs: { images: ["10", 0], filename_prefix: `ref_${mode}_` }
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const prompt = (form.get("prompt") as string) || "";
    const model = (form.get("model") as string) || "realvis";
    const width = parseInt((form.get("width") as string) || "1024");
    const height = parseInt((form.get("height") as string) || "1024");
    const mode = (form.get("mode") as string) || "reference";
    const refImageFile = form.get("refImage") as File | null;

    if (!refImageFile) return NextResponse.json({ error: "No reference image" }, { status: 400 });
    if (!prompt.trim()) return NextResponse.json({ error: "No prompt" }, { status: 400 });

    // Upload ref image to ComfyUI
    const buffer = Buffer.from(await refImageFile.arrayBuffer());
    const uploadedName = await uploadToComfy(buffer, `ref_${Date.now()}.jpg`);

    // Build and queue workflow
    const workflow = buildIPAdapterWorkflow(uploadedName, prompt, model, width, height, mode);
    const promptId = await queueWorkflow(workflow);

    return NextResponse.json({ promptId, refImage: uploadedName, mode });
  } catch (e) {
    console.error("ref generate error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
