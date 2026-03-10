import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const COMFYUI_URL = process.env.COMFY_URL || "http://100.79.93.27:8188";
const GALLERY_URL = process.env.GALLERY_URL || "https://lumen-gallery.ngrok.app";

const HEADSHOT_STYLES: Record<string, { prompt: string; bg: string; label: string }> = {
  linkedin: {
    label: "LinkedIn Professional",
    prompt: "professional headshot, business attire, confident smile, office background, sharp focus, 8k",
    bg: "modern office, blurred background",
  },
  creative: {
    label: "Creative / Artistic",
    prompt: "creative portrait, artistic lighting, colorful bokeh background, professional photography, 8k",
    bg: "colorful artistic bokeh",
  },
  casual: {
    label: "Casual / Friendly",
    prompt: "casual portrait, warm smile, natural light, outdoor park background, approachable, 8k",
    bg: "outdoor natural setting",
  },
  executive: {
    label: "Corporate Executive",
    prompt: "executive portrait, power suit, authoritative pose, dark background, dramatic lighting, 8k",
    bg: "dark studio background",
  },
  studio: {
    label: "Studio Portrait",
    prompt: "studio portrait, clean white background, professional lighting, sharp detail, photorealistic, 8k",
    bg: "white studio backdrop",
  },
  glamour: {
    label: "Glamour",
    prompt: "glamour portrait, dramatic makeup, beautiful lighting, fashion editorial style, 8k",
    bg: "soft gradient background",
  },
};

function buildIPAdapterHeadshotWorkflow(
  uploadedImageB64: string,
  style: string,
  seed: number
) {
  const s = HEADSHOT_STYLES[style] || HEADSHOT_STYLES.linkedin;
  const fullPrompt = `RAW photo, ${s.prompt}, photorealistic, detailed skin, subsurface scattering, ${s.bg}, professional photography`;

  return {
    // Load checkpoint + LoRA
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "RealVisXL_V4.safetensors" } },
    "2": {
      class_type: "LoraLoader",
      inputs: {
        model: ["1", 0], clip: ["1", 1],
        lora_name: "lumen_headshots_v1.safetensors",
        strength_model: 0.75, strength_clip: 0.75,
      },
    },
    // Load CLIP Vision for IPAdapter
    "3": {
      class_type: "CLIPVisionLoader",
      inputs: { clip_name: "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" },
    },
    // Load IPAdapter face model
    "4": {
      class_type: "IPAdapterModelLoader",
      inputs: { ipadapter_file: "ip-adapter-plus-face_sdxl_vit-h.safetensors" },
    },
    // Load the reference face image
    "5": {
      class_type: "ETN_LoadImageBase64",
      inputs: { image: uploadedImageB64 },
    },
    // Apply IPAdapter face conditioning
    "6": {
      class_type: "IPAdapterAdvanced",
      inputs: {
        model: ["2", 0],
        ipadapter: ["4", 0],
        image: ["5", 0],
        clip_vision: ["3", 0],
        weight: 0.85,
        weight_type: "linear",
        combine_embeds: "concat",
        start_at: 0.0,
        end_at: 1.0,
        embeds_scaling: "V only",
      },
    },
    // Text conditioning
    "7": { class_type: "CLIPTextEncode", inputs: { text: fullPrompt, clip: ["2", 1] } },
    "8": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: "painting, cartoon, anime, deformed, extra limbs, bad anatomy, text, watermark, ugly, disfigured, low quality, blur",
        clip: ["2", 1],
      },
    },
    // Empty latent (portrait 832x1216)
    "9": { class_type: "EmptyLatentImage", inputs: { width: 832, height: 1216, batch_size: 1 } },
    // Sample
    "10": {
      class_type: "KSampler",
      inputs: {
        model: ["6", 0],
        positive: ["7", 0],
        negative: ["8", 0],
        latent_image: ["9", 0],
        seed, steps: 35, cfg: 4.5,
        sampler_name: "dpmpp_2m_sde",
        scheduler: "karras",
        denoise: 1.0,
      },
    },
    "11": { class_type: "VAEDecode", inputs: { samples: ["10", 0], vae: ["1", 2] } },
    "12": { class_type: "SaveImage", inputs: { images: ["11", 0], filename_prefix: "headshot" } },
  } as Record<string, any>;
}

async function queuePrompt(workflow: Record<string, any>): Promise<string | null> {
  try {
    const r = await fetch(`${COMFYUI_URL}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: workflow }),
    });
    if (r.ok) {
      const d = await r.json();
      return d.prompt_id || null;
    }
  } catch {}
  return null;
}

async function pollResult(promptId: string, timeoutMs = 120000): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${COMFYUI_URL}/history/${promptId}`);
      if (r.ok) {
        const hist = await r.json();
        if (hist[promptId]) {
          const outputs = hist[promptId].outputs || {};
          for (const node of Object.values(outputs) as any[]) {
            if (node.images?.length) return node.images[0].filename;
          }
        }
      }
    } catch {}
    await new Promise((res) => setTimeout(res, 2000));
  }
  return null;
}

// GET — return available styles
export async function GET() {
  return NextResponse.json({
    styles: Object.entries(HEADSHOT_STYLES).map(([id, s]) => ({ id, label: s.label })),
  });
}

// POST — generate headshots
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File | null;
    const stylesRaw = formData.get("styles") as string | null;
    const styles = stylesRaw ? JSON.parse(stylesRaw) : ["linkedin", "creative", "casual"];

    if (!file) return NextResponse.json({ error: "No photo uploaded" }, { status: 400 });

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const b64 = Buffer.from(bytes).toString("base64");

    // Check if ETN_LoadImageBase64 node exists — if not, fall back to URL-based workflow
    // For now use the standard IPAdapter workflow queuing multiple jobs
    const jobs: { style: string; promptId: string }[] = [];

    for (const style of styles.slice(0, 6)) {
      const seed = Math.floor(Math.random() * 999999999);
      const workflow = buildIPAdapterHeadshotWorkflow(b64, style, seed);
      const promptId = await queuePrompt(workflow);
      if (promptId) jobs.push({ style, promptId });
      await new Promise((r) => setTimeout(r, 200));
    }

    if (!jobs.length) {
      return NextResponse.json({ error: "Failed to queue jobs" }, { status: 500 });
    }

    // Return job IDs for client-side polling
    return NextResponse.json({
      jobs: jobs.map((j) => ({ style: j.style, promptId: j.promptId, label: HEADSHOT_STYLES[j.style]?.label })),
      message: `Generating ${jobs.length} headshots...`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
