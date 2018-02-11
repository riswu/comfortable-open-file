import os from 'os';

export const config = {
  initialDirectoryPath: {
    title: 'Initial Directory',
    description: 'If you have already opened a file, you can get the file list of the directory.',
    type: 'string',
    default: os.homedir()
  }
};
