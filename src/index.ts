import * as dotenv from 'dotenv';
import {getEnv} from "./env";
import {getApiClient} from "./api";
import {generateSolution} from "./solver";

dotenv.config();

const Commands: {[key: string]: (args: string[]) => Promise<void>} = {
  solve: async (args: string[]): Promise<void> => {
    const taskName = args[0];
    if (!taskName) {
      throw new Error('Task name not specified.');
    }

    const apiKey = getEnv('API_KEY');
    const apiUrl = getEnv('API_URL');
    const apiClient = getApiClient(apiUrl, apiKey);

    const token = await apiClient.getTaskToken(taskName);
    console.info('Token obtained successfully');

    const taskResponsePayload = await apiClient.getTaskPayload(token);

    console.info('The task is: ' + JSON.stringify(taskResponsePayload));

    const solution = await generateSolution(taskName, taskResponsePayload);
    console.info('Calculated solution: ' + JSON.stringify(solution));

    await apiClient.submitAnswer(token, solution);
    console.info('The answer is correct, task completed.');
  }
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
