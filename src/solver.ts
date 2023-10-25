import { TaskPayload } from './types';
import { OpenAI } from 'openai';

const DEFAULT_MODEL = 'gpt-3.5-turbo';
const GPT_SYSTEM_INSTRUCTIONS = `
  Act as a system for automated solving tasks specified in JSON format.
  User sends a JSON with potential error code (if any), task description and other payload data, for example:
  {"code":0,"msg":"Name 3 similar fruits to the one in this payload","fruit":"orange"}
  
  Please respond exclusively with what was requested in the task, for example:
  lemon, lime, tangerine`;

const solvers: {[key: string]: (taskPayload: TaskPayload) => Promise<string|any[]|undefined>} = {
  gpt: async (taskPayload: TaskPayload): Promise<string|any[]|undefined> => {
    const completion = await new OpenAI().chat.completions.create({
      messages: [
        { role: "system", content: GPT_SYSTEM_INSTRUCTIONS },
        { role: "user", content: JSON.stringify(taskPayload) },
      ],
      model: DEFAULT_MODEL,
    });

    return completion.choices[0].message.content ?? undefined;
  },
  helloapi: async (taskPayload: TaskPayload): Promise<string|any[]|undefined> => {
    return taskPayload.cookie;
  }
}

export const generateSolution = async (taskName: string, taskPayload: TaskPayload): Promise<string|(any[])> => {
  let solution: string | any[] | undefined = await solvers[taskName]?.(taskPayload);

  if (typeof solution === 'undefined') {
    solution = await solvers.gpt(taskPayload);
  }

  if (typeof solution === 'undefined') {
    throw new Error('Failed to generate solution for task ' + taskName);
  }

  return solution;
}
