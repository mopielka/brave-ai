import * as dotenv from 'dotenv';

dotenv.config();

import {api} from "./api";
import {generateSolution} from "./solver";
import {OpenAI} from "openai";

const Commands: {[key: string]: (args: string[]) => Promise<void>} = {
  solve: async (args: string[]): Promise<void> => {
    const taskName = args[0];
    if (!taskName) {
      throw new Error('Task name not specified.');
    }

    const token = await api.getTaskToken(taskName);
    console.info('Token obtained successfully');

    const taskResponsePayload = await api.getTaskPayload(token);

    console.info('The task is: ' + JSON.stringify(taskResponsePayload));

    const solution = await generateSolution(taskName, taskResponsePayload);
    console.info('Calculated solution: ' + JSON.stringify(solution));

    await api.submitAnswer(token, solution);
    console.info('The answer is correct, task completed.');
  },

  fetchTask: async (args: string[]): Promise<void> => {
    const taskName = args[0];
    if (!taskName) {
      throw new Error('Task name not specified.');
    }

    const token = await api.getTaskToken(taskName);
    console.info('Token obtained successfully');

    const taskResponsePayload = await api.getTaskPayload(token);

    console.info('The task is: ' + JSON.stringify(taskResponsePayload));
  },

  solveLiar: async (): Promise<void> => {
    const name = 'liar'
    const token = await api.getTaskToken(name)

    const question = 'Describe what is chess game about'

    const { answer: apiAnswer } = await api.request('/task/' + token, { question })

    const completion = await new OpenAI().chat.completions.create({
      messages: [
        { role: "system", content: 'You will receive a pair of question and answer. Your only role is to let user know if answer is actually related to the question. Say YES or NO and that is the end.' },
        { role: "user", content: `Question: ${question}; answer: ${apiAnswer}` },
      ],
      model: 'gpt-4',
    })

    const solution = completion.choices[0].message.content

    await api.submitAnswer(token, solution!)
    console.info('The answer is correct, task completed.')
  },


}

const main = async () => {
  const [,, command, ...args] = process.argv;

  if (!command) {
    throw new Error('Command not specified.')
  }

  if (!Commands[command]) {
    throw new Error(`Command "${command}" is not defined.`);
  }

  await Commands[command](args);
};

main().then(() => console.log());
