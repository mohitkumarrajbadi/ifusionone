// CompilerManager.ts
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { getCompilerFilePath } from '../../../pathResolver.js';

export interface CompileEvent {
  reply: (eventName: string, data: any) => void;
}

interface LanguageCommands {
  [key: string]: {
    checkVersion: string;
    compileCommand: (code: string, filePath: string | null) => string;
    extensions?: string[];
  };
}

export const languages: LanguageCommands = {
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

export function getDownloadLinks(language: string) {
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