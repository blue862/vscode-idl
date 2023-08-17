import { LogManager } from '@idl/logger';
import { IDL_INDEX_OPTIONS, IDLIndex } from '@idl/parsing/index';
import { SyntaxProblems } from '@idl/parsing/problem-codes';

IDL_INDEX_OPTIONS.IS_TEST = true;

describe(`[auto generated] Detects documented keywords when there are no keywords`, () => {
  it(`[auto generated] no problems`, async () => {
    // create index
    const index = new IDLIndex(
      new LogManager({
        alert: () => {
          // do nothing
        },
      }),
      0
    );

    // test code to extract tokens from
    const code = [
      `;+`,
      `;`,
      `; :Keywords:`,
      `;   KW1: in, optional, type=boolean`,
      `;     My favorite argument`,
      `;`,
      `;-`,
      `pro myclass::mymethod, KW1=kw1`,
      `  compile_opt idl2`,
      `end`,
    ];

    // extract tokens
    const tokenized = await index.getParsedProCode('not-real', code, {
      postProcess: true,
    });

    // define expected tokens
    const expected: SyntaxProblems = [
      {
        code: 104,
        info: 'Unused variable "kw1"',
        start: [7, 27, 3],
        end: [7, 27, 3],
      },
    ];

    // verify results
    expect(
      tokenized.parseProblems.concat(tokenized.postProcessProblems)
    ).toEqual(expected);
  });

  it(`[auto generated] problem`, async () => {
    // create index
    const index = new IDLIndex(
      new LogManager({
        alert: () => {
          // do nothing
        },
      }),
      0
    );

    // test code to extract tokens from
    const code = [
      `;+`,
      `;`,
      `; :Keywords:`,
      `;   KW1: in, optional, type=boolean`,
      `;     My favorite argument`,
      `;`,
      `;-`,
      `pro myclass::mymethod`,
      `  compile_opt idl2`,
      `end`,
    ];

    // extract tokens
    const tokenized = await index.getParsedProCode('not-real', code, {
      postProcess: true,
    });

    // define expected tokens
    const expected: SyntaxProblems = [
      {
        code: 63,
        info: 'Documented argument, keyword, or property does not exist: "kw1"',
        start: [3, 0, 35],
        end: [3, 0, 35],
      },
      {
        code: 51,
        info: 'Documentation includes keywords, but none are present in routine definition',
        start: [2, 2, 11],
        end: [5, 0, 1],
      },
    ];

    // verify results
    expect(
      tokenized.parseProblems.concat(tokenized.postProcessProblems)
    ).toEqual(expected);
  });
});
