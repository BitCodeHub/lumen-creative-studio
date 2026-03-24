import { NextRequest, NextResponse } from "next/server";

// In-memory map of promptId -> prompt text (survives within the same process instance)
const promptStore = new Map<string, string>();

// Use env var for ngrok URL, fallback to Tailscale for local dev
const COMFYUI_URL = process.env.COMFY_URL || "http://100.79.93.27:8188";
// Nano Banana 2.0 = Gemini 3.1 Flash Image
const GEMINI_API_KEY_GEN = process.env.GEMINI_API_KEY || "AIzaSyAEx5gQBzTi9lUMNXoqWSGuPfqEnYPXq4I";
const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image-preview";
const GEMINI_IMAGE_URL_GEN = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY_GEN}`;

// Keywords that indicate text should appear in the generated image
const TEXT_IN_IMAGE_KEYWORDS = [
  "text:", "write ", "written", "label", "caption", "title:", "headline",
  "logo", "sign", "banner", "poster", "typography", "font", "words",
  "quote", "saying", "reads", "that says", "with text", "with the text",
  "social media post", "instagram post", "tweet", "ad copy", "tagline",
  "infographic", "overlay text", "subtitle", "watermark text",
];

function promptHasTextRequest(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return TEXT_IN_IMAGE_KEYWORDS.some(kw => lower.includes(kw));
}

// NSFW/explicit content keywords — block these prompts entirely
const NSFW_KEYWORDS = [
  "nude", "naked", "nudity", "nsfw", "explicit", "pornographic", "porn",
  "topless", "bottomless", "genitals", "penis", "vagina", "breasts exposed",
  "nipples", "sex", "sexual", "erotic", "hentai", "xxx", "adult content",
  "no clothes", "without clothes", "undressed", "undressing", "lingerie only",
  "no underwear", "barely dressed", "strip", "stripping", "aroused",
];

function promptIsNSFW(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return NSFW_KEYWORDS.some(kw => lower.includes(kw));
}

async function generateWithGeminiText(prompt: string): Promise<{ image: string } | null> {
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["image", "text"] },
  };

  const res = await fetch(GEMINI_IMAGE_URL_GEN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) { console.error("Gemini text-image error:", res.status); return null; }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inline_data?.mime_type?.startsWith("image/")) {
      return { image: `data:image/png;base64,${part.inline_data.data}` };
    }
  }
  return null;
}



// FLUX.1-dev workflow
function createFluxDevWorkflow(prompt: string, seed?: number) {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  return {
    "1": { "class_type": "UNETLoader", "inputs": { "unet_name": "flux1-dev.safetensors", "weight_dtype": "default" } },
    "2": { "class_type": "DualCLIPLoader", "inputs": { "clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp16.safetensors", "type": "flux" } },
    "3": { "class_type": "VAELoader", "inputs": { "vae_name": "flux_ae.safetensors" } },
    "4": { "class_type": "CLIPTextEncode", "inputs": { "text": prompt, "clip": ["2", 0] } },
    "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 1 } },
    "6": { "class_type": "KSampler", "inputs": { "model": ["1", 0], "positive": ["4", 0], "negative": ["7", 0], "latent_image": ["5", 0], "seed": actualSeed, "steps": 25, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0 } },
    "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "nude, naked, nudity, nsfw, explicit, pornographic, exposed genitals, exposed breasts, exposed nipples, topless, sexual content, erotic, adult content", "clip": ["2", 0] } },
    "8": { "class_type": "VAEDecode", "inputs": { "samples": ["6", 0], "vae": ["3", 0] } },
    "9": { "class_type": "SaveImage", "inputs": { "images": ["8", 0], "filename_prefix": "lumen_flux_dev" } },
  } as Record<string, any>;
}

// FLUX Schnell (fast, 4 steps)
function createFluxSchnellWorkflow(prompt: string, seed?: number) {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  return {
    "1": { "class_type": "UNETLoader", "inputs": { "unet_name": "flux1-schnell-fp8.safetensors", "weight_dtype": "default" } },
    "2": { "class_type": "DualCLIPLoader", "inputs": { "clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp16.safetensors", "type": "flux" } },
    "3": { "class_type": "VAELoader", "inputs": { "vae_name": "flux_ae.safetensors" } },
    "4": { "class_type": "CLIPTextEncode", "inputs": { "text": prompt, "clip": ["2", 0] } },
    "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 1 } },
    "6": { "class_type": "KSampler", "inputs": { "model": ["1", 0], "positive": ["4", 0], "negative": ["7", 0], "latent_image": ["5", 0], "seed": actualSeed, "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0 } },
    "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "nude, naked, nudity, nsfw, explicit, pornographic, exposed genitals, exposed breasts, exposed nipples, topless, sexual content, erotic, adult content", "clip": ["2", 0] } },
    "8": { "class_type": "VAEDecode", "inputs": { "samples": ["6", 0], "vae": ["3", 0] } },
    "9": { "class_type": "SaveImage", "inputs": { "images": ["8", 0], "filename_prefix": "lumen_schnell" } },
  } as Record<string, any>;
}

// RealVisXL V4 — photorealistic (45 steps, DPM++ 2M SDE Karras)
function createRealVisWorkflow(prompt: string, seed?: number) {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  const enhancedPrompt = `RAW photo, ${prompt}, extremely detailed face, photorealistic, 8k uhd, professional photography, dslr, bokeh background, cinematic lighting`;
  return {
    "1": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "RealVisXL_V4.safetensors" } },
    "2": { "class_type": "CLIPTextEncode", "inputs": { "text": enhancedPrompt, "clip": ["1", 1] } },
    "3": { "class_type": "CLIPTextEncode", "inputs": { "text": "nude, naked, nudity, nsfw, explicit, pornographic, exposed genitals, exposed breasts, exposed nipples, topless, sexual content, erotic, adult content, crooked nose, asymmetric face, deformed mouth, crooked mouth, uneven eyes, misaligned eyes, deformed eyes, bad teeth, extra teeth, fused fingers, extra fingers, missing fingers, bad hands, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, ugly, blurry, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, out of frame, watermark, signature, text, jpeg artifacts, low quality, worst quality, painting, illustration, cartoon, anime, drawing, sketch, 3d render, cgi", "clip": ["1", 1] } },
    "4": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 1 } },
    "5": { "class_type": "KSampler", "inputs": { "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0], "seed": actualSeed, "steps": 12, "cfg": 4.5, "sampler_name": "dpmpp_2m_sde", "scheduler": "karras", "denoise": 1.0 } },
    "6": { "class_type": "VAEDecode", "inputs": { "samples": ["5", 0], "vae": ["1", 2] } },
    "7": { "class_type": "SaveImage", "inputs": { "images": ["6", 0], "filename_prefix": "lumen_realvis" } },
  } as Record<string, any>;
}

// SDXL (JuggernautXL v9 — best photorealistic SDXL checkpoint)
function createSDXLWorkflow(prompt: string, seed?: number) {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  return {
    "1": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "juggernautXL_v9.safetensors" } },
    "2": { "class_type": "CLIPTextEncode", "inputs": { "text": prompt, "clip": ["1", 1] } },
    "3": { "class_type": "CLIPTextEncode", "inputs": { "text": "nude, naked, nudity, nsfw, explicit, pornographic, exposed genitals, exposed breasts, exposed nipples, topless, sexual content, erotic, adult content, crooked nose, asymmetric face, deformed mouth, crooked mouth, uneven eyes, misaligned eyes, deformed eyes, bad teeth, extra teeth, fused fingers, extra fingers, missing fingers, bad hands, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, ugly, blurry, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, out of frame, watermark, signature, text, jpeg artifacts, low quality, worst quality", "clip": ["1", 1] } },
    "4": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 1 } },
    "5": { "class_type": "KSampler", "inputs": { "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0], "seed": actualSeed, "steps": 12, "cfg": 4.5, "sampler_name": "dpmpp_2m_sde", "scheduler": "karras", "denoise": 1.0 } },
    "6": { "class_type": "VAEDecode", "inputs": { "samples": ["5", 0], "vae": ["1", 2] } },
    "7": { "class_type": "SaveImage", "inputs": { "images": ["6", 0], "filename_prefix": "lumen_sdxl" } },
  } as Record<string, any>;
}

// Patch EmptyLatentImage dimensions + optionally append 4x upscale node
function patchDimensions(workflow: Record<string, any>, w: number, h: number, upscale4k: boolean) {
  // Find highest node id
  const nodeIds = Object.keys(workflow).map(Number).sort((a, b) => a - b);
  const lastId = nodeIds[nodeIds.length - 1];
  const saveNodeId = String(lastId); // last node should be SaveImage

  for (const node of Object.values(workflow)) {
    if ((node as any).class_type === "EmptyLatentImage") {
      (node as any).inputs.width = w;
      (node as any).inputs.height = h;
    }
  }

  if (upscale4k) {
    // Get the image output node (SaveImage) and redirect through upscaler
    const saveNode = workflow[saveNodeId];
    if (saveNode?.class_type === "SaveImage") {
      const imageSource = saveNode.inputs.images; // e.g. ["6", 0]
      const upscalerId = String(lastId + 1);
      const newSaveId = String(lastId + 2);

      workflow[upscalerId] = {
        "class_type": "UpscaleModelLoader",
        "inputs": { "model_name": "4x-UltraSharp.pth" }
      };
      // Insert ImageUpscaleWithModel between decode and save
      const upscaleNodeId = String(lastId + 3);
      workflow[upscaleNodeId] = {
        "class_type": "ImageUpscaleWithModel",
        "inputs": { "upscale_model": [upscalerId, 0], "image": imageSource }
      };
      // Redirect SaveImage to use upscaled output
      workflow[newSaveId] = {
        "class_type": "SaveImage",
        "inputs": { "images": [upscaleNodeId, 0], "filename_prefix": saveNode.inputs.filename_prefix + "_4k" }
      };
      // Remove old SaveImage node
      delete workflow[saveNodeId];
    }
  }

  return workflow;
}

async function queuePrompt(workflow: object): Promise<string> {
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ComfyUI error: ${response.status} - ${text}`);
  }
  const data = await response.json();
  return data.prompt_id;
}

// POST — queue generation, return promptId immediately (no waiting)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      model = "realvis",
      upscale4k = false,
      seed,
      width = 1024,
      height = 1024,
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Block NSFW/explicit content
    if (promptIsNSFW(prompt)) {
      console.log(`[Generate] BLOCKED NSFW prompt: ${prompt.slice(0, 60)}`);
      return NextResponse.json({ error: "This content is not allowed. Please keep prompts appropriate and safe for work." }, { status: 400 });
    }

    console.log(`[Generate] Model: ${model}, Size: ${width}x${height}, 4K: ${upscale4k}, Prompt: ${prompt.slice(0, 60)}...`);

    // === NANO BANANA 2.0 (Gemini 3.1): use when prompt requests text in image ===
    if (promptHasTextRequest(prompt)) {
      console.log(`[Generate] Routing to Nano Banana 2.0 (Gemini 3.1) — text-in-image detected`);
      const result = await generateWithGeminiText(prompt);
      if (result) {
        return NextResponse.json({ type: "gemini", image: result.image, status: "done" });
      }
      // Fallback to ComfyUI if Gemini fails
      console.log("[Generate] Gemini failed, falling back to ComfyUI");
    }

    // Select workflow based on model
    let workflow: Record<string, any>;
    switch (model) {
      case "flux-dev":
        workflow = createFluxDevWorkflow(prompt, seed);
        break;
      case "flux-schnell":
        workflow = createFluxSchnellWorkflow(prompt, seed);
        break;
      case "sdxl":
        workflow = createSDXLWorkflow(prompt, seed);
        break;
      case "realvis":
      default:
        workflow = createRealVisWorkflow(prompt, seed);
        break;
    }

    // Apply user-selected dimensions (and optional 4K upscale node)
    patchDimensions(workflow, width, height, upscale4k);

    // Clear queue if backed up (>5 pending) so user isn't stuck behind auto-gen
    try {
      const queueRes = await fetch(`${COMFYUI_URL}/queue`, { signal: AbortSignal.timeout(3000) });
      const queueData = await queueRes.json();
      const pendingCount = Array.isArray(queueData.queue_pending) ? queueData.queue_pending.length : 0;
      if (pendingCount > 5) {
        console.log(`[Generate] Clearing ${pendingCount} pending jobs to prioritize user request`);
        await fetch(`${COMFYUI_URL}/queue`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clear: true }),
        });
        await new Promise(r => setTimeout(r, 300));
      }
    } catch { /* non-fatal */ }

    // Queue and return promptId immediately — frontend polls GET
    const promptId = await queuePrompt(workflow);
    console.log(`[Generate] Queued: ${promptId}`);


    // Store prompt for saving to prompts.json on completion
    promptStore.set(promptId, prompt);
    setTimeout(() => promptStore.delete(promptId), 1800000);
    return NextResponse.json({ promptId, model });

  } catch (error) {
    console.error("[Generate] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}


// QC check using Gemini Vision — returns { pass, reason }
async function runQCCheck(imageUrl: string): Promise<{ pass: boolean; reason: string }> {
  const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyB4EzkfKSTezcK2ZEUPWlkShTtDhTpO_Ic";
  const QC_PROMPT = `You are a strict image quality and content safety inspector for a professional AI art gallery.

Analyze this image and REJECT it if it has ANY of these issues:

CONTENT SAFETY (HIGHEST PRIORITY — reject immediately):
- Nudity: exposed genitals, exposed female nipples/breasts, exposed buttocks
- Sexually explicit or suggestive content
- Pornographic imagery of any kind
- Partial nudity that would not be appropriate in a professional workplace

FACIAL DEFECTS (be very strict):
- Crooked, asymmetric, or misaligned mouth or lips
- Crooked, bent, or deformed nose
- Eyes that are different sizes, misaligned, or pointing different directions
- Deformed teeth, extra teeth, or fused facial features
- Uncanny or unsettling face quality that looks clearly AI-generated

TEXT DEFECTS:
- Garbled, misspelled, or unreadable text anywhere in the image
- License plates with fake/random letters

ANATOMY DEFECTS:
- Extra or missing limbs, wrong number of fingers (should be 5)
- Fused or deformed body parts

TECHNICAL DEFECTS:
- Watermarks from other AI services
- Blank areas, glitch artifacts, incomplete generation
- Extremely blurry or corrupted image

NON-DEFECTS: artistic style, dark lighting, swimwear in appropriate context, no faces (landscapes/products/food are fine unless technically broken).

Respond with ONLY valid JSON, nothing else:
{"pass": true, "reason": ""}
or
{"pass": false, "reason": "brief defect description"}`;

  try {
    // Fetch image as base64
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    if (!imgRes.ok) return { pass: true, reason: "" }; // non-fatal
    const imgBuf = await imgRes.arrayBuffer();
    const b64 = Buffer.from(imgBuf).toString("base64");
    const mimeType = "image/jpeg";

    const body = {
      contents: [{
        parts: [
          { text: QC_PROMPT },
          { inline_data: { mime_type: mimeType, data: b64 } }
        ]
      }]
    };

    const gemRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (!gemRes.ok) return { pass: true, reason: "" };
    const gemData = await gemRes.json();
    const text = gemData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);
    return { pass: result.pass !== false, reason: result.reason || "" };
  } catch {
    return { pass: true, reason: "" }; // non-fatal: if QC fails, show image
  }
}

// GET — poll status by promptId, or health check
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const promptId = searchParams.get("promptId");

  // Poll mode
  if (promptId) {
    try {
      const response = await fetch(`${COMFYUI_URL}/history/${promptId}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        return NextResponse.json({ status: "pending" });
      }
      const history = await response.json();
      if (history[promptId]?.outputs) {
        const outputs = history[promptId].outputs;
        for (const nodeId in outputs) {
          if (outputs[nodeId].images?.[0]) {
            const image = outputs[nodeId].images[0];
            // Return direct comfyui URL — proxied via /api/generate/image on client
            const rawUrl = `${COMFYUI_URL}/view?filename=${encodeURIComponent(image.filename)}&subfolder=${encodeURIComponent(image.subfolder || "")}&type=${image.type}`;
            const imageUrl = `/api/generate/image?src=${encodeURIComponent(rawUrl)}`;
            const savedPrompt = promptStore.get(promptId) || "";
            if (savedPrompt) {
              const stemName = image.filename.replace(/\.\w+$/, "");
              fetch("https://lumen-gallery.ngrok.app/save_prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" },
                body: JSON.stringify({ filename: stemName, prompt: savedPrompt }),
              }).catch(() => {});
              promptStore.delete(promptId);
            }
            // Run QC check before returning result
            const qcResult = await runQCCheck(imageUrl);
            if (!qcResult.pass) {
              console.log(`[QC] REJECTED: ${image.filename} — ${qcResult.reason}`);
              return NextResponse.json({ status: "rejected", reason: qcResult.reason, imageUrl, filename: image.filename });
            }
            return NextResponse.json({ status: "done", imageUrl, filename: image.filename, prompt: savedPrompt });
          }
        }
      }
      // Check for error in history
      if (history[promptId]?.status?.status_str === "error") {
        return NextResponse.json({ status: "error" });
      }
      return NextResponse.json({ status: "pending" });
    } catch {
      return NextResponse.json({ status: "pending" });
    }
  }

  // Health check mode
  try {
    const response = await fetch(`${COMFYUI_URL}/system_stats`, {
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const stats = await response.json();
      return NextResponse.json({
        status: "ok",
        comfyui: "connected",
        url: COMFYUI_URL,
        gpu: stats.devices?.[0]?.name || "unknown",
      });
    }
    return NextResponse.json({ status: "error", comfyui: "unreachable" }, { status: 503 });
  } catch {
    return NextResponse.json({ status: "error", comfyui: "unreachable" }, { status: 503 });
  }
}
