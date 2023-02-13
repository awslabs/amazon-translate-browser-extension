import { resolve } from 'path';
import fs from 'fs-extra';
import { logger } from './utils';

export async function writeProdManifest(): Promise<void> {
  try {
    // copy icon files
    await fs.copy(resolve('public'), resolve('extension/prod/assets'), {
      overwrite: true,
    });
    await fs.move(
      resolve('extension/prod/dist/background/index.global.js'),
      resolve('extension/prod/background.js'),
      { overwrite: true }
    );
    await fs.move(resolve('extension/prod/dist/content'), resolve('extension/prod/content'), {
      overwrite: true,
    });
    await fs.remove(resolve('extension/prod/dist'));
    // eslint-disable-next-line no-console
    logger('BUILD:SW', 'Moved service-worker success!');
  } catch (err) {
    console.error(err);
  }
}

void writeProdManifest();
