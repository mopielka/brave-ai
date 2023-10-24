import {TaskPayload} from "./types";

const solvers: {[key: string]: (taskPayload: TaskPayload) => Promise<string|any[]|undefined>} = {
  // gpt: (taskPayload: TaskPayload): Promise<string|any[]> => {
  //
  // },
  helloapi: async (taskPayload: TaskPayload): Promise<string|any[]|undefined> => {
    return taskPayload.cookie;
  }
}

export const generateSolution = async (taskName: string, taskPayload: TaskPayload): Promise<string|(any[])> => {
  let solution: string | any[] | undefined = await solvers[taskName](taskPayload);

  if (typeof solution === 'undefined') {
    solution = undefined; // await solvers.ai[taskPayload];
  }

  if (typeof solution === 'undefined') {
    throw new Error('Failed to generate solution for task ' + taskName);
  }

  return solution;
}
