import { IDLDocsExporter } from '@idl/docs/exporter';
import { LogManager } from '@idl/logger';
import { IDLIndex } from '@idl/parsing/index';
import { GetExtensionPath } from '@idl/shared';

// create our index
const index = new IDLIndex(
  new LogManager({
    alert: () => {
      // do nothing
    },
  }),
  0
);

/** Get the folder with code in it */
const codeDir = GetExtensionPath('idl/vscode');

/** Specify the folder that we export to */
const outDir = GetExtensionPath('extension/docs');

/** Glob patterns we match against */
const matches: string[] = ['**/idl/vscode*'];

/**
 * Main routine
 */
async function main() {
  /** Index the folder */
  await index.indexWorkspace([codeDir], false);

  /** Export */
  await IDLDocsExporter(index, outDir, matches);
}

main()
  .then(
    () => {
      process.exit();
    },
    (err) => {
      console.log(err);
      process.exit(1);
    }
  )
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
