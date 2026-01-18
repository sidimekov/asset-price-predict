export {};

declare global {
  interface Window {
    ym?: (
      counterId: string | number,
      method: 'init' | 'reachGoal',
      ...args: any[]
    ) => void;
  }
}
