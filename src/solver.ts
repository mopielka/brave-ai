import { TaskPayload } from './types';
import { OpenAI } from 'openai';
import {ChatCompletionMessageParam} from "openai/resources";

const DEFAULT_MODEL = 'gpt-4';
const GPT_SYSTEM_INSTRUCTIONS = `
  Act as a system for automated solving tasks specified in JSON format.
  User sends a JSON with potential error code (if any), task description and other payload data, for example:
  {"code":0,"msg":"Name 3 similar fruits to the one in this payload","fruit":"orange"}
  
  Please respond exclusively with what was requested in the task, for example:
  lemon, lime, tangerine
  
  Never include any intro text, your verbal explanation, apologizes or anything.
  Your answer must only include what was requested for an answer and nothing else.

  Your answers should NOT have a format like {"code": 123, "msg": "your answer"}.
  Instead, it should be only the answer as a valid JSON, either of type string (double-quoted text) or an Array.

  If your answer turns out to be incorrect, the user will provide you a feedback, then please try to generate
  just an answer again, respecting the provided feedback. Don't include any apologize phrases or anything.
  Any of your attempts will always be exclusively the new answer.
  `;

export const gpt = async (
  taskPayload: TaskPayload,
  additionalInstructions?: string,
  previousAnswers?: string[],
  errorMessages?: string[],
): Promise<string|null> => {
  let userContent = `The input JSON is: ${JSON.stringify(taskPayload)}`;
  if (additionalInstructions) {
    userContent += `\n\nPlease also respect following additional instructions:\n${additionalInstructions}`;
  }
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: GPT_SYSTEM_INSTRUCTIONS },
    { role: 'user', content: userContent },
  ];
  for (let i = 0; i < (previousAnswers ?? []).length; i++) {
    messages.push({ role: 'assistant', content: previousAnswers![i] });
    if (errorMessages?.[i]) {
      messages.push({ role: 'user', content: errorMessages[i] });
    }
  }

  const completion = await new OpenAI().chat.completions.create({
    messages,
    model: DEFAULT_MODEL,
  });

  return completion.choices[0].message.content;
};
