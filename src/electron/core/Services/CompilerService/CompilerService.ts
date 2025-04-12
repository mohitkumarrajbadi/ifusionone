// CompilerService.ts
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { getCompilerFilePath } from '../../../pathResolver.js';
import { CompileEvent, languages, getDownloadLinks } from './CompilerManager.js';

async function executeCommand(cmd: string): Promise<{ stdout: string; stderr: string }> {
  console.log(`Executing command: ${cmd}`);
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error occurred while executing command: ${cmd}`);
        console.error(`stderr: ${stderr}`);
        reject({ stdout, stderr: stderr || error.message });
      } else {
        console.log(`Command executed successfully: ${cmd}`);
        console.log(`stdout: ${stdout}`);
        resolve({ stdout, stderr });
      }
    });
  });
}

export default async function codeCompiler(
  event: CompileEvent,
  { code, language }: { code: string; language: string }
): Promise<void> {
  try {
    const languageLower = language.toLowerCase();
    const __dirname = getCompilerFilePath();
    console.log(`Compiler file path resolved: ${__dirname}`);

    if (!languages[languageLower]) {
      console.log(`Unsupported language: ${language}`);
      event.reply('compile-result', { error: 'Unsupported language' });
      return;
    }

    const { checkVersion, compileCommand } = languages[languageLower];

    try {
      console.log(`Checking version of ${language}...`);
      await executeCommand(checkVersion);

      const filePath = path.join(__dirname, `temp.${languageLower}`);
      const command = compileCommand(code, filePath);

      console.log(`Compiling code for ${language}...`);
      const { stdout, stderr } = await executeCommand(command);

      event.reply('compile-result', {
        output: stdout,
        error: stderr || null,
      });

      console.log(`Compilation successful for ${language}.`);

      // Clean up temporary files after execution
      if (fs.existsSync(filePath)) {
        console.log(`Deleting temporary file: ${filePath}`);
        fs.unlinkSync(filePath);
      }

      const tempFileName = `temp.${languageLower}`;
      if (fs.existsSync(tempFileName)) {
        console.log(`Deleting temporary file: ${tempFileName}`);
        fs.unlinkSync(tempFileName);
      }
    } catch (err) {
      console.error(`Error during ${language} execution: ${err}`);
      event.reply('compile-result', {
        error: `${language} is not installed. Please install ${language} to compile ${language} code.`,
        downloadLinks: getDownloadLinks(languageLower),
      });
    }
  } catch (err) {
    console.error('Error in compile code:', err);
    event.reply('compile-result', { error: 'An error occurred during compilation.' });
  }
}
