export const getEnv = (name: string): string => {
  if (typeof process.env[name] === 'undefined') {
    throw new Error(`Env var "${name}" is not defined.`);
  }

  // @ts-ignore
  return process.env[name];
}
