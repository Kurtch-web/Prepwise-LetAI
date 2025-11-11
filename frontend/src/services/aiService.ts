const API_URL = "https://cheiken021-letai.hf.space/generate";

interface ExplanationRequest {
  question: string;
  choices: string[];
  correct_answer: string;
}

interface ExplanationResponse {
  language: string;
  correct_answer: string;
  explanation: string;
}

export async function generateExplanation(
  question: string,
  choices: string[],
  correct_answer: string
): Promise<ExplanationResponse> {
  const payload: ExplanationRequest = {
    question,
    choices,
    correct_answer
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
