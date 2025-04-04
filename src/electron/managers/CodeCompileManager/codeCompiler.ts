import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getCompilerFilePath } from '../../pathResolver.js';

interface CompileEvent {
  reply: (eventName: string, data: any) => void;
}

interface LanguageCommands {
  [key: string]: {
    checkVersion: string;
    compileCommand: (code: string, filePath: string | null) => string;
    extensions?: string[];
  };
}

const languages: LanguageCommands = {
  python: {
    checkVersion: 'python3 --version',
    compileCommand: (code) => `python3 -c "${code.replace(/"/g, '\\"')}"`,
  },
  javascript: {
    checkVersion: 'node -v',
    compileCommand: (code) => `node -e "${code.replace(/"/g, '\\"')}"`,
  },
  typescript: {
    checkVersion: 'tsc -v',
    compileCommand: (code, filePath) => `ts-node "${filePath}"`,
  },
  c: {
    checkVersion: 'gcc --version',
    compileCommand: (code, filePath) => {
      const tempFile = filePath ?? 'temp.c';
      fs.writeFileSync(tempFile, code);
      return `gcc "${tempFile}" -o temp && ./temp`;
    },
  },
  java: {
    checkVersion: 'java -version',
    compileCommand: (code, filePath) => {
      const tempFile = filePath ?? 'temp.java';
      fs.writeFileSync(tempFile, code);
      return `javac "${tempFile}" && java temp`;
    },
  },
  ruby: {
    checkVersion: 'ruby -v',
    compileCommand: (code) => `ruby -e "${code.replace(/"/g, '\\"')}"`,
  },
  go: {
    checkVersion: 'go version',
    compileCommand: (code, filePath) => {
      const tempFile = filePath ?? 'temp.go';
      fs.writeFileSync(tempFile, code);
      return `go run "${tempFile}"`;
    },
  },
  php: {
    checkVersion: 'php -v',
    compileCommand: (code, filePath) => {
      const tempFile = filePath ?? 'temp.php';
      fs.writeFileSync(tempFile, code);
      return `php "${tempFile}"`;
    },
  },
};

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

function getDownloadLinks(language: string) {
  const downloadLinks: { [key: string]: string } = {
    python: 'https://www.python.org/downloads/',
    javascript: 'https://nodejs.org/en/download/',
    typescript: 'https://www.typescriptlang.org/download',
    c: 'https://gcc.gnu.org/install/',
    java: 'https://www.oracle.com/java/technologies/javase-jdk11-downloads.html',
    ruby: 'https://www.ruby-lang.org/en/documentation/installation/',
    go: 'https://golang.org/doc/install',
    php: 'https://www.php.net/downloads.php',
  };
  return { mac: downloadLinks[language], windows: downloadLinks[language] };
}
