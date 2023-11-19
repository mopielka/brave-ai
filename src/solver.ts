import { TaskPayload } from './types';
import { OpenAI } from 'openai';
import Downloader from 'nodejs-file-downloader';
import * as fs from "fs";

const DEFAULT_MODEL = 'gpt-4';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-ada-002';
const FILES_LOCATION = __dirname + '/../data';
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
  },
  inprompt: async (taskPayload: TaskPayload): Promise<string|any[]|undefined> => {
    const name = await solvers.gpt({
      code: 0,
      msg: 'Return the given name inside question',
      question: taskPayload.question,
    }) as string;

    console.info('Name in question:', name);
    const statements = (taskPayload.input as string[]).filter(v => v.toLowerCase().includes(name.toLowerCase()));
    console.info('Statements:', statements);

    const answer = await solvers.gpt({
      code: 0,
      msg: 'Answer the question basing on input',
      question: taskPayload.question,
      input: statements,
    });
    console.info('Answer:', answer);

    return answer;
  },
  embedding: async () => {
    const response = await new OpenAI().embeddings.create({
      input: 'Hawaiian pizza',
      model: DEFAULT_EMBEDDING_MODEL,
    });

    return response.data[0].embedding;
  },
  whisper: async (taskPayload: TaskPayload) => {
    const url = taskPayload.msg.match(/(https?:\/\/[A-Za-z0-9./]+)/)?.[0];
    if (!url) {
      throw new Error("Couldn't read mp3 file url.");
    }

    const downloadReport = await new Downloader({ url, directory: FILES_LOCATION }).download();

    const transcriptions = await new OpenAI().audio.transcriptions.create({
      model: 'whisper-1',
      file: fs.createReadStream(downloadReport.filePath!),
    });

    return transcriptions.text;
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
