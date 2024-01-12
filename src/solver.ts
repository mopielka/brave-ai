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

const solvers: {[key: string]: (taskPayload: TaskPayload) => Promise<any>} = {
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
  },
  functions: async (taskPayload: TaskPayload) => {
    return {
      "name": "addUser",
      "description": "adds a user",
      "parameters": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "the name"
          },
          "surname": {
            "type": "string",
            "description": "the last name"
          },
          "year": {
            "type": "number",
            "description": "the year of birth"
          },
        }
      }
    };
  },
  google: async () => {
    return process.env.MY_API_BASE_URL + '/google';
  },
  ownapi: async () => {
    return process.env.MY_API_BASE_URL + '/ownapi';
  },
  ownapipro: async () => {
    return process.env.MY_API_BASE_URL + '/ownapipro';
  },
  md2html: async () => {
    return process.env.MY_API_BASE_URL + '/md2html';
  },
  gnome: async (taskPayload: TaskPayload) => {
    const completion = await new OpenAI().chat.completions.create({
      messages: [
        { role: "system", content: GPT_SYSTEM_INSTRUCTIONS },
        {
          role: "user",
          content: [
            {
              type: 'text',
              'text': 'Tell me the color of attached gnome hat. This must be just one word for a color in Polish language. If the image doesnt seem to be what expected, say: ERROR'
            },
            { type: 'image_url', image_url: taskPayload.url },
          ]
        }
      ],
      model: 'gpt-4-vision-preview',
    })

    return completion.choices[0].message.content ?? undefined
  },
  people: async (taskPayload: TaskPayload) => {
    const dataset = await fetch(taskPayload.data).then(res => res.json())
    const completionName = await new OpenAI().chat.completions.create({
      messages: [
        { role: 'system', content: 'Your only job is to output first and last name found in the prompt' },
        { role: 'user', content: taskPayload.question },
      ],
      model: DEFAULT_MODEL,
    })

    const [first, last] = (completionName.choices[0].message.content ?? '').split(' ');

    const personData = (dataset as Record<string, string>[]).filter(v => v.imie === first && v.nazwisko === last);

    const completion = await new OpenAI().chat.completions.create({
      messages: [
        { role: 'system', content: 'Answer question based on provided JSON data' },
        { role: 'user', content: `Question: ${taskPayload.question}; JSON data: ${JSON.stringify(personData)}` },
      ],
      model: DEFAULT_MODEL,
    })

    return completion.choices[0].message.content ?? undefined;
  },
  meme: async (taskPayload: TaskPayload) => {
    const imageResult = await fetch('https://get.renderform.io/api/v2/render', {
      method: 'POST',
      body: JSON.stringify({
        template: 'old-donkeys-arise-smoothly-1277',
        data: {
          'text.text': taskPayload.text,
          'image.src': taskPayload.image,
        }
      }),
      headers: {
        'X-API-KEY': process.env.RENDERFORM_API_KEY!,
        'Content-Type': 'application/json'
      }
    }).then(r => r.json())

    console.log(imageResult);
    return imageResult.href
  },
  toolsx: async (taskPayload: TaskPayload) => {
    const theTools =  [
      {
        "type": "function",
        "function": {
          "name": "ToDo",
          "description": "Add a task to the to do list",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA",
              },
              "format": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"],
                "description": "The temperature unit to use. Infer this from the users location.",
              },
            },
            "required": ["location", "format"],
          },
        }
      },
      {
        "type": "function",
        "function": {
          "name": "get_n_day_weather_forecast",
          "description": "Get an N-day weather forecast",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA",
              },
              "format": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"],
                "description": "The temperature unit to use. Infer this from the users location.",
              },
              "num_days": {
                "type": "integer",
                "description": "The number of days to forecast",
              }
            },
            "required": ["location", "format", "num_days"]
          },
        }
      },
    ];

    const completionName = await new OpenAI().chat.completions.create({
      messages: [
        { role: 'system', content: 'Your only job is to output first and last name found in the prompt' },
        { role: 'user', content: taskPayload.question },
      ],
      model: DEFAULT_MODEL,
    })
  }
}

export const generateSolution = async (taskName: string, taskPayload: TaskPayload): Promise<any> => {
  let solution: string | any[] | undefined = await solvers[taskName]?.(taskPayload);

  if (typeof solution === 'undefined') {
    solution = await solvers.gpt(taskPayload);
  }

  if (typeof solution === 'undefined') {
    throw new Error('Failed to generate solution for task ' + taskName);
  }

  return solution;
}
