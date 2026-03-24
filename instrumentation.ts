export async function register() {
  // Only run scheduler on the server side (not during build or on client)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('./lib/scheduler');
    startScheduler();
  }
}
