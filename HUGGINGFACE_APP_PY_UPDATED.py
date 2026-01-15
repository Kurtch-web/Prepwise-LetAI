# app.py - Multilingual Educational AI (English + Filipino)
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import os

app = FastAPI(title="Multilingual Educational AI")

# Global variables
model = None
tokenizer = None

class QuestionRequest(BaseModel):
    question: str
    choices: List[str]
    correct_answer: str
    max_new_tokens: Optional[int] = 400
    temperature: Optional[float] = 0.7
    language: Optional[str] = None  # NEW: explicit language parameter

class ExplanationResponse(BaseModel):
    question: str
    correct_answer: str
    explanation: str
    model_used: str
    language: str

def load_model():
    """Load model on startup - Float32 for CPU"""
    global model, tokenizer

    print("🔧 Loading multilingual model...")

    # Get token from Space secrets
    hf_token = os.environ.get("HF_TOKEN")
    if hf_token is None:
        raise ValueError("HF_TOKEN not set in Space secrets!")

    base_model_path = "meta-llama/Llama-3.2-3B-Instruct"
    adapter_path = "./trained_let_ai_multilingual"

    try:
        print(f"✅ Using base model: {base_model_path}")
        print(f"✅ Using LoRA adapter: {adapter_path}")

        # Load base model WITHOUT quantization (float32 for CPU)
        print("⬇️ Downloading and loading base model from Hugging Face...")
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_path,
            torch_dtype=torch.float32,  # Float32 for CPU
            device_map="cpu",
            low_cpu_mem_usage=True,
            token=hf_token
        )

        print("📝 Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(base_model_path, token=hf_token)
        tokenizer.pad_token = tokenizer.eos_token

        print("🔌 Loading LoRA adapter...")
        model = PeftModel.from_pretrained(base_model, adapter_path)

        model.eval()
        print("✅ Model loaded successfully!")
        print("   Model: Llama 3.2 3B (Fine-tuned Multilingual)")
        print("   Languages: English & Filipino")
        print("   Mode: Float32 (CPU)")
        print("   Expected response time: 20-40 seconds")

    except Exception as e:
        print(f"❌ Error loading model: {e}")
        raise

@app.on_event("startup")
async def startup_event():
    """Load model when app starts"""
    load_model()

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Multilingual Educational AI (English + Filipino)",
        "model": "Llama 3.2 3B Instruct (Fine-tuned)",
        "languages": ["English", "Filipino (Tagalog)"],
        "mode": "Float32 CPU",
        "note": "Response time: ~20-40 seconds per question",
        "endpoints": {
            "generate": "/generate (POST)",
            "health": "/health (GET)",
            "docs": "/docs (interactive API documentation)"
        }
    }

@app.get("/health")
async def health_check():
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {
        "status": "healthy",
        "model_loaded": True,
        "model": "Llama-3.2-3B-Multilingual",
        "languages": ["en", "fil"]
    }

@app.post("/generate", response_model=ExplanationResponse)
async def generate_explanation(request: QuestionRequest):
    """
    Generate multilingual explanations for a multiple choice question
    
    Supports English and Filipino (Tagalog) - automatically detects language or accepts explicit language!
    
    Optional parameter:
    - language: "english" or "tagalog" (explicit language override)
    
    Example request (English):
    {
        "question": "What is the capital of France?",
        "choices": ["A. London", "B. Paris", "C. Berlin", "D. Madrid"],
        "correct_answer": "B",
        "language": "english"
    }
    
    Filipino example:
    {
        "question": "Ano ang kabisera ng Pilipinas?",
        "choices": ["A. Cebu", "B. Davao", "C. Manila", "D. Baguio"],
        "correct_answer": "C",
        "language": "tagalog"
    }
    """
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # EXACT SAME SYSTEM PROMPT AS COLAB
        system_prompt = (
            "You are a multilingual educational AI assistant that generates detailed "
            "explanations for multiple choice questions in both English and Filipino. "
            "Given a question with choices and the correct answer, you provide explanations "
            "for why each choice is correct or incorrect. Respond in the same language as the question."
        )
        
        choices_text = "\n".join(request.choices)
        
        # Use explicit language if provided, otherwise detect from question
        if request.language and request.language.lower() in ["english", "tagalog", "english", "tagalog", "en", "fil", "tl"]:
            # Normalize language parameter
            if request.language.lower() in ["tagalog", "fil", "tl", "philippine", "pilipino"]:
                language = "Filipino"
                is_filipino = True
            else:
                language = "English"
                is_filipino = False
        else:
            # Fallback to automatic detection
            is_filipino = any(word in request.question.lower() for word in ['ano', 'ang', 'sa', 'ng', 'mga', 'ba', 'kung'])
            language = "Filipino" if is_filipino else "English"
        
        # CREATE LANGUAGE-SPECIFIC PROMPTS
        if is_filipino:
            # Filipino prompt - instructions in Tagalog
            user_message = (
                f"Binigyan ng multiple choice question kung saan ang tamang sagot ay {request.correct_answer}, "
                "magbigay ng paliwanag kung bakit tama o mali ang bawat pagpipilian:\n\n"
                f"Tanong: {request.question}\n\n"
                f"{choices_text}\n\n"
                f"Tamang Sagot: {request.correct_answer}\n\n"
                "Magbigay ng paliwanag para sa lahat ng pagpipilian sa TAGALOG."
            )
        else:
            # English prompt - instructions in English
            user_message = (
                f"Given this multiple choice question where the correct answer is {request.correct_answer}, "
                "provide explanations for why each choice is correct or incorrect:\n\n"
                f"Question: {request.question}\n\n"
                f"{choices_text}\n\n"
                f"Correct Answer: {request.correct_answer}\n\n"
                "Provide explanations for all choices."
            )
        
        # Llama 3 Instruct format - SAME AS COLAB
        prompt = (
            "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n"
            f"{system_prompt}<|eot_id|>"
            "<|start_header_id|>user<|end_header_id|>\n"
            f"{user_message}<|eot_id|>"
            "<|start_header_id|>assistant<|end_header_id|>\n"
        )
        
        # Tokenize
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=512
        )
        # inputs already on CPU by default
        
        # Generate - SAME PARAMETERS AS COLAB
        print(f"⏳ Generating {language} explanation...")
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=request.max_new_tokens,
                temperature=request.temperature,
                do_sample=True,
                top_p=0.9,
                pad_token_id=tokenizer.eos_token_id,
                repetition_penalty=1.1
            )
        
        # Decode
        full_text = tokenizer.decode(outputs[0], skip_special_tokens=False)
        
        # Extract assistant response - SAME AS COLAB
        if "<|start_header_id|>assistant<|end_header_id|>" in full_text:
            explanation = full_text.split("<|start_header_id|>assistant<|end_header_id|>")[-1].strip()
        else:
            explanation = full_text
        
        # Clean up any remaining tokens
        explanation = explanation.replace("<|eot_id|>", "").strip()
        
        print(f"✅ Generation complete ({language})")
        
        return ExplanationResponse(
            question=request.question,
            correct_answer=request.correct_answer,
            explanation=explanation,
            model_used="Llama-3.2-3B-Multilingual-Float32",
            language=language
        )
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
