import { NextRequest, NextResponse } from "next/server";

const COMFYUI_URL = "http://100.79.93.27:8188";

// FLUX.1-dev workflow for text-to-image
function createFluxWorkflow(prompt: string, seed?: number) {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  
  return {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": "FLUX.1-dev-fp8.safetensors"
      }
    },
    "2": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": prompt,
        "clip": ["1", 1]
      }
    },
    "3": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": 1024,
        "height": 1024,
        "batch_size": 1
      }
    },
    "4": {
      "class_type": "KSampler",
      "inputs": {
        "model": ["1", 0],
        "positive": ["2", 0],
        "negative": ["5", 0],
        "latent_image": ["3", 0],
        "seed": actualSeed,
        "steps": 20,
        "cfg": 3.5,
        "sampler_name": "euler",
        "scheduler": "simple",
        "denoise": 1.0
      }
    },
    "5": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": "",
        "clip": ["1", 1]
      }
    },
    "6": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["4", 0],
        "vae": ["1", 2]
      }
    },
    "7": {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["6", 0],
        "filename_prefix": "lumen_creative"
      }
    }
  };
}

// RealVisXL workflow for photorealistic images
function createRealVisWorkflow(prompt: string, seed?: number) {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  const enhancedPrompt = `RAW photo, ${prompt}, extremely detailed, photorealistic, 8k uhd, professional photography`;
  
  return {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": "RealVisXL_V4.0.safetensors"
      }
    },
    "2": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": enhancedPrompt,
        "clip": ["1", 1]
      }
    },
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": "ugly, blurry, low quality, distorted, deformed",
        "clip": ["1", 1]
      }
    },
    "4": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": 1024,
        "height": 1024,
        "batch_size": 1
      }
    },
    "5": {
      "class_type": "KSampler",
      "inputs": {
        "model": ["1", 0],
        "positive": ["2", 0],
        "negative": ["3", 0],
        "latent_image": ["4", 0],
        "seed": actualSeed,
        "steps": 30,
        "cfg": 4.5,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0
      }
    },
    "6": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["5", 0],
        "vae": ["1", 2]
      }
    },
    "7": {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["6", 0],
        "filename_prefix": "lumen_realvis"
      }
    }
  };
}

async function queuePrompt(workflow: object): Promise<string> {
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow }),
  });
  
  if (!response.ok) {
    throw new Error(`ComfyUI error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.prompt_id;
}

async function waitForImage(promptId: string, maxWaitMs = 120000): Promise<string> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`${COMFYUI_URL}/history/${promptId}`);
    const history = await response.json();
    
    if (history[promptId]?.outputs) {
      const outputs = history[promptId].outputs;
      for (const nodeId in outputs) {
        if (outputs[nodeId].images?.[0]) {
          const image = outputs[nodeId].images[0];
          return `${COMFYUI_URL}/view?filename=${image.filename}&subfolder=${image.subfolder || ""}&type=${image.type}`;
        }
      }
    }
    
    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error("Timeout waiting for image generation");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model = "flux-pro" } = body;
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    
    // Select workflow based on model
    let workflow;
    switch (model) {
      case "realvis":
        workflow = createRealVisWorkflow(prompt);
        break;
      case "flux-schnell":
      case "flux-pro":
      default:
        workflow = createFluxWorkflow(prompt);
        break;
    }
    
    // Queue the generation
    const promptId = await queuePrompt(workflow);
    
    // Wait for result
    const imageUrl = await waitForImage(promptId);
    
    return NextResponse.json({ 
      success: true,
      imageUrl,
      promptId,
      model
    });
    
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check - verify ComfyUI connection
  try {
    const response = await fetch(`${COMFYUI_URL}/system_stats`);
    if (response.ok) {
      return NextResponse.json({ status: "ok", comfyui: "connected" });
    }
    return NextResponse.json({ status: "error", comfyui: "unreachable" }, { status: 503 });
  } catch {
    return NextResponse.json({ status: "error", comfyui: "unreachable" }, { status: 503 });
  }
}
