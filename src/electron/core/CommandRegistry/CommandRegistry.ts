// CommandRegistry.ts

export type CommandHandler = (...args: any[]) => void;

export class CommandRegistry {
  private static handlers: Map<string, CommandHandler> = new Map();

  /**
   * Registers a command with its associated handler.
   * @param command - The unique identifier for the command.
   * @param handler - The function to execute when the command is called.
   */
  public static register(command: string, handler: CommandHandler): void {
    if (CommandRegistry.handlers.has(command)) {
      console.warn(`[WARN] Overwriting existing command: ${command}`);
    }
    CommandRegistry.handlers.set(command, handler);
    console.log('[INFO] Registered command:', command);
  }

  /**
   * Executes a registered command with the given arguments.
   * @param command - The unique identifier for the command.
   * @param args - The arguments to pass to the command handler.
   */
  public static execute(command: string, ...args: any[]): void {
    const handler = CommandRegistry.handlers.get(command);
    if (handler) {
      try {
        handler(...args);
      } catch (error) {
        console.error(`[ERROR] Execution of command '${command}' failed:`, error);
      }
    } else {
      console.error('[ERROR] Command not found:', command);
    }
  }

  /**
   * Unregisters a command, removing its handler.
   * @param command - The unique identifier for the command to remove.
   */
  public static unregister(command: string): void {
    if (CommandRegistry.handlers.delete(command)) {
      console.log('[INFO] Unregistered command:', command);
    } else {
      console.warn('[WARN] Attempted to unregister non-existent command:', command);
    }
  }
}
