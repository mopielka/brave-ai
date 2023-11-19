import * as dotenv from 'dotenv';
import {getEnv} from "./env";
import {getApiClient} from "./api";
import {gpt} from "./solver";

dotenv.config();

const SOLVE_MAX_RETRIES = 3;

const Commands: {[key: string]: (args: string[]) => Promise<void>} = {
  solve: async (args: string[]): Promise<void> => {
    const taskName = args[0];
    if (!taskName) {
      throw new Error('Task name not specified.');
    }

    const additionalInstructions = args[1];

    const apiKey = getEnv('API_KEY');
    const apiUrl = getEnv('API_URL');
    const apiClient = getApiClient(apiUrl, apiKey);

    const token = await apiClient.getTaskToken(taskName);
    console.info('Token obtained successfully');

    const taskResponsePayload = await apiClient.getTaskPayload(token);

    console.info('The task is: ' + JSON.stringify(taskResponsePayload));

    const answers: string[] = [];
    const errors = [];
    for (let i = 0; i <= SOLVE_MAX_RETRIES; i++) {
      const solution = await gpt(
        taskResponsePayload,
        additionalInstructions,
        answers,
        errors,
      );
      console.info('Calculated solution: ' + solution);
      if (!solution) {
        throw new Error('Failed to generate solution');
      }
      answers.push(solution);

      try {
        await apiClient.submitAnswer(token, solution);
        console.info('The answer is correct, task completed.');

        return;
      } catch (error) {
        console.error(`Answer error: ${(error as Error).message}`);
        errors.push((error as Error).message);
      }
    }

    console.error(`Failed to generate correct solution after ${SOLVE_MAX_RETRIES + 1} attempts.`)
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
