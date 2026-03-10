import { NextRequest, NextResponse } from "next/server";

const COMFYUI_URL = process.env.COMFY_URL || "http://100.79.93.27:8188";

const HEADSHOT_STYLES: Record<string, { prompt: string; label: string; icon: string }> = {
  linkedin: {
    label: "LinkedIn Professional",
    icon: "💼",
    prompt: "professional headshot, business attire, navy blue suit, confident smile, modern office background blurred, sharp focus, photorealistic, 8k",
  },
  creative: {
    label: "Creative / Artistic",
    icon: "🎨",
    prompt: "creative portrait, artistic studio lighting, colorful bokeh background, professional photography, expressive, photorealistic, 8k",
  },
  casual: {
    label: "Casual / Friendly",
    icon: "😊",
    prompt: "casual portrait, warm friendly smile, natural daylight, outdoor park background softly blurred, approachable, photorealistic, 8k",
  },
  executive: {
    label: "Corporate Executive",
    icon: "🏢",
    prompt: "executive corporate portrait, power suit, authoritative confident pose, dark studio background, dramatic side lighting, photorealistic, 8k",
  },
  studio: {
    label: "Studio Portrait",
    icon: "📸",
    prompt: "clean studio portrait, white seamless background, professional three-point lighting, sharp detail, headshot, photorealistic, 8k",
  },
  glamour: {
    label: "Glamour",
    icon: "✨",
    prompt: "glamour portrait, dramatic makeup, beautiful golden hour lighting, fashion editorial style, photorealistic, 8k",
  },
};

function buildHeadshotWorkflow(
  uploadedFilename: string,
  style: string,
  seed: number
) {
  const s = HEADSHOT_STYLES[style] || HEADSHOT_STYLES.linkedin;
  const fullPrompt = `RAW photo, ${s.prompt}, photorealistic, detailed skin texture, subsurface scattering, professional photography, DSLR`;
  const negPrompt = "painting, cartoon, anime, deformed, extra limbs, bad anatomy, text, watermark, ugly, disfigured, low quality, blur, distorted face";

  return {
    // Checkpoint + LoRA
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "RealVisXL_V4.safetensors" } },
    "2": {
      class_type: "LoraLoader",
      inputs: {
        model: ["1", 0], clip: ["1", 1],
        lora_name: "lumen_headshots_v1.safetensors",
        strength_model: 0.7, strength_clip: 0.7,
      },
    },
    // Load CLIP Vision
    "3": {
      class_type: "CLIPVisionLoader",
      inputs: { clip_name: "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" },
    },
    // Load IPAdapter face model
    "4": {
      class_type: "IPAdapterModelLoader",
      inputs: { ipadapter_file: "ip-adapter-plus-face_sdxl_vit-h.safetensors" },
    },
    // Load uploaded reference image
    "5": {
      class_type: "LoadImage",
      inputs: { image: uploadedFilename, upload: "image" },
    },
    // Apply IPAdapter
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
    "8": { class_type: "CLIPTextEncode", inputs: { text: negPrompt, clip: ["2", 1] } },
    // Portrait latent
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

async function uploadImageToComfyUI(imageBytes: ArrayBuffer, filename: string): Promise<string | null> {
  try {
    const form = new FormData();
    const blob = new Blob([imageBytes], { type: "image/jpeg" });
    form.append("image", blob, filename);
    form.append("type", "input");
    form.append("overwrite", "true");

    const r = await fetch(`${COMFYUI_URL}/upload/image`, {
      method: "POST",
      body: form,
    });

    if (r.ok) {
      const d = await r.json();
      return d.name || filename;
    }
    console.error("Upload failed:", r.status, await r.text());
  } catch (e) {
    console.error("Upload error:", e);
  }
  return null;
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
    console.error("Queue failed:", r.status, await r.text());
  } catch (e) {
    console.error("Queue error:", e);
  }
  return null;
}

// GET — return available styles
export async function GET() {
  return NextResponse.json({
    styles: Object.entries(HEADSHOT_STYLES).map(([id, s]) => ({
      id,
      label: s.label,
      icon: s.icon,
    })),
  });
}

// POST — generate headshots
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File | null;
    const stylesRaw = formData.get("styles") as string | null;
    const styles: string[] = stylesRaw ? JSON.parse(stylesRaw) : ["linkedin", "creative", "casual"];

    if (!file) {
      return NextResponse.json({ error: "No photo uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const timestamp = Date.now();
    const uploadFilename = `headshot_ref_${timestamp}.jpg`;

    // Upload reference image to ComfyUI
    const comfyFilename = await uploadImageToComfyUI(bytes, uploadFilename);
    if (!comfyFilename) {
      return NextResponse.json({ error: "Failed to upload image to DGX" }, { status: 500 });
    }

    // Queue one job per style
    const jobs: { style: string; promptId: string; label: string; icon: string }[] = [];

    for (const style of styles.slice(0, 6)) {
      const seed = Math.floor(Math.random() * 999999999);
      const workflow = buildHeadshotWorkflow(comfyFilename, style, seed);
      const promptId = await queuePrompt(workflow);
      if (promptId) {
        jobs.push({
          style,
          promptId,
          label: HEADSHOT_STYLES[style]?.label || style,
          icon: HEADSHOT_STYLES[style]?.icon || "📸",
        });
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    if (!jobs.length) {
      return NextResponse.json({ error: "Failed to queue jobs — DGX may be busy" }, { status: 500 });
    }

    return NextResponse.json({
      jobs,
      message: `Generating ${jobs.length} headshots...`,
      refImage: comfyFilename,
    });
  } catch (e: any) {
    console.error("Headshots POST error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
