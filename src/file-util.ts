// Async Promise-based files.
import { promises as fs } from 'fs';

export function readFile(path: string): Promise<string> {
  return fs.readFile(path, 'utf-8');
}
