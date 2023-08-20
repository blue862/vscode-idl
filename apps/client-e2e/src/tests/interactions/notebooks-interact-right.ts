import { GetExtensionPath, Sleep } from '@idl/shared';
import { OpenNotebookInVSCode, VSCODE_COMMANDS } from '@idl/vscode/shared';
import expect from 'expect';
import * as vscode from 'vscode';
import {
  SemanticTokensParams,
  TextDocumentPositionParams,
} from 'vscode-languageserver';

import { RunnerFunction } from '../runner.interface';

/**
 * Verifies working with notebooks does the right thing with changes and doesnt trigger
 * PRO code parsing in the language server
 */
export const NotebooksInteractRight: RunnerFunction = async (init) => {
  const doc = await OpenNotebookInVSCode(
    GetExtensionPath(
      'idl/test/client-e2e/notebooks/test-user-interaction.idlnb'
    )
  );

  /**
   * Get first cell which is code
   */
  const first = doc.cellAt(0);

  /**
   * Get URi for the notebook
   */
  const uri = first.document.uri.toString();

  /**
   * Event params for LSP user interaction
   */
  const hoverParams: TextDocumentPositionParams = {
    textDocument: {
      uri,
    },
    position: {
      line: 6,
      character: 5,
    },
  };

  // verify hover has return
  expect(
    await init.client.client.sendRequest('textDocument/hover', hoverParams)
  ).toBeTruthy();

  // verify definition has return
  expect(
    await init.client.client.sendRequest('textDocument/definition', hoverParams)
  ).toBeTruthy();

  /**
   * Event params for LSP user interaction
   */
  const completionParams: TextDocumentPositionParams = {
    textDocument: {
      uri,
    },
    position: {
      line: 6,
      character: 11,
    },
  };

  // verify definition has return
  expect(
    await init.client.client.sendRequest(
      'textDocument/completion',
      completionParams
    )
  ).toBeTruthy();

  /**
   * Event params for LSP semantic token request
   */
  const tokenParams: SemanticTokensParams = {
    textDocument: {
      uri: uri,
    },
  };

  // verify semantic tokens (have none in NB, so get none)
  expect(
    await init.client.client.sendRequest(
      'textDocument/semanticTokens/full',
      tokenParams
    )
  ).toBeNull();

  // short pause
  await Sleep(250);

  // clear any existing outputs
  await vscode.commands.executeCommand(VSCODE_COMMANDS.CLOSE_EDITOR);
};
