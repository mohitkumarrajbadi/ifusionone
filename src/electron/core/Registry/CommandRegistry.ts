// CommandRegistry.ts

export type CommandHandler<T = any> = (...args: any[]) => T | Promise<T>;

export interface CommandMetadata {
  description?: string;
  createdAt: Date;
  lastExecutedAt?: Date;
}

export class CommandRegistry {
  private static handlers: Map<string, CommandHandler> = new Map();
  private static metadata: Map<string, CommandMetadata> = new Map();

  /**
   * Callback for command execution events.
   */
  public static onCommandExecuted?: (command: string, result: any) => void;
  public static onCommandFailed?: (command: string, error: Error) => void;

  /**
   * Registers a command with its associated handler and optional metadata.
   * @param command - The unique identifier for the command.
   * @param handler - The function to execute when the command is called.
   * @param description - Optional description for the command.
   */
  public static register(command: string, handler: CommandHandler, description?: string): void {
    if (CommandRegistry.handlers.has(command)) {
      console.warn(`[WARN] Overwriting existing command: ${command}`);
    }

    CommandRegistry.handlers.set(command, handler);
    CommandRegistry.metadata.set(command, { description, createdAt: new Date() });
    console.log('[INFO] Registered command:', command);
  }

  /**
   * Executes a registered command with the given arguments and returns its result.
   * Supports both synchronous and asynchronous handlers.
   * @param command - The unique identifier for the command.
   * @param args - The arguments to pass to the command handler.
   * @returns The value returned by the command handler.
   */
  public static async execute<T = any>(command: string, ...args: any[]): Promise<T> {
    const handler = CommandRegistry.handlers.get(command) as CommandHandler<T> | undefined;

    if (handler) {
      try {
        CommandRegistry.metadata.get(command)!.lastExecutedAt = new Date();
        const result = await handler(...args);
        
        if (CommandRegistry.onCommandExecuted) {
          CommandRegistry.onCommandExecuted(command, result);
        }
        return result;
      } catch (error) {
        console.error(`[ERROR] Execution of command '${command}' failed:`, error);
        if (CommandRegistry.onCommandFailed) {
          CommandRegistry.onCommandFailed(command, error as Error);
        }
        throw error;
      }
    } else {
      const errMsg = `[ERROR] Command not found: ${command}`;
      console.error(errMsg);
      throw new Error(errMsg);
    }
  }

  /**
   * Unregisters a command, removing its handler and metadata.
   * @param command - The unique identifier for the command to remove.
   */
  public static unregister(command: string): void {
    if (CommandRegistry.handlers.delete(command)) {
      CommandRegistry.metadata.delete(command);
      console.log('[INFO] Unregistered command:', command);
    } else {
      console.warn('[WARN] Attempted to unregister non-existent command:', command);
    }
  }

  /**
   * Checks if a command is registered.
   * @param command - The command to check.
   * @returns True if the command exists, false otherwise.
   */
  public static hasCommand(command: string): boolean {
    return CommandRegistry.handlers.has(command);
  }

  /**
   * Gets metadata of a registered command.
   * @param command - The command whose metadata is needed.
   * @returns The metadata of the command or undefined if it doesn't exist.
   */
  public static getMetadata(command: string): CommandMetadata | undefined {
    return CommandRegistry.metadata.get(command);
  }

  /**
   * Lists all registered commands with their metadata.
   * @returns An array of registered command names with metadata.
   */
  public static listCommands(): { command: string; metadata: CommandMetadata }[] {
    return Array.from(CommandRegistry.metadata.entries()).map(([command, metadata]) => ({
      command,
      metadata,
    }));
  }
}
