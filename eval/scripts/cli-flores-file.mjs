import { runFloresFile } from './flores-file-run.mjs';

runFloresFile().catch((error) => { console.error(error); process.exitCode = 1; });
