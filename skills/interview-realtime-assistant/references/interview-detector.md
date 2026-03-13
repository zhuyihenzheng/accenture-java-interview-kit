# Interview Detector

## Purpose
Detect whether the latest utterance is a question, normalize the question, and classify the question type.

## Task 1: Question Detection
Return:
- `is_question` (boolean)
- `question_confidence` (0.0 to 1.0)

Treat as question:
- self-introduction requests
- technical or behavioral interview prompts
- clarification prompts
- communication checks such as "聞こえていますか"

Treat as non-question:
- greetings only
- transitions like "では次に"
- interviewer monologue
- repeated ASR fragments without intent

## Task 2: Normalization
Return:
- `normalized_question`
- `suspected_term_corrections` (array)
- `needs_term_confirmation` (boolean)

Normalize ASR noise for:
- technology names (Spring Boot, Kubernetes, CI/CD)
- cloud service names
- interview vocabulary

Mark `needs_term_confirmation = true` when the normalized intent is plausible but uncertain.

## Task 3: Question Classification
Return one label:
- `self_intro`
- `motivation`
- `career`
- `technical`
- `behavioral`
- `leadership`
- `strength_weakness`
- `communication`
- `salary_condition`
- `other`

## Detector Output Shape
```json
{
  "is_question": true,
  "question_confidence": 0.94,
  "normalized_question": "Spring Boot と Spring MVC の違いを説明してください",
  "suspected_term_corrections": ["スプリングボート -> Spring Boot"],
  "needs_term_confirmation": false,
  "question_type": "technical"
}
```
