export type Compensation = () => Promise<unknown>;

export async function withCompensation<T>(
  operation: (defer: (compensation: Compensation) => void) => Promise<T>,
) {
  const compensations: Compensation[] = [];
  try {
    return await operation((compensation) => compensations.push(compensation));
  } catch (cause) {
    await Promise.allSettled(compensations.reverse().map((compensation) => compensation()));
    throw cause;
  }
}

