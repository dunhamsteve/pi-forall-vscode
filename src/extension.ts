import * as vscode from "vscode";
import { exec } from "child_process";
import path from "path";

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("pi4all");

  function checkDocument(document: vscode.TextDocument) {
    const fileName = document.fileName;
    // Is there a better way to do this? It will get fussy with quoting and all plus it's not visible to the user.
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const cwd = workspaceFolder
      ? workspaceFolder.uri.fsPath
      : path.dirname(fileName);
    const config = vscode.workspace.getConfiguration("pi4all");
    const cmd = config.get<string>("path", "cabal v2-run pi-forall --");
    const command = `${cmd} ${fileName}`;
    exec(command, { cwd }, (err, stdout, _stderr) => {
      // pi-forall returns a code of 1 for an error in the file
      // I see 127 if the executable doesn't exist
      if (err && err.code !== 1) {
        vscode.window.showErrorMessage(`pi-forall error: ${err}`);
      }

      // extract errors and messages from stdout
      const lines = stdout.split("\n");
      const diagnostics: vscode.Diagnostic[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/(warning: )?([^:]+):(\d+):(\d+):/);
        if (match) {
          const [_full, warn, _file, line, column] = match;
          let message = lines[++i].trim();
          let lnum = Number(line);
          let cnum = Number(column);
          let start = new vscode.Position(lnum - 1, cnum - 1);
          // we don't have the full range, so grab the surrounding word
          let end = new vscode.Position(lnum - 1, cnum);
          let range =
            document.getWordRangeAtPosition(start) ??
            new vscode.Range(start, end);
          // anything indented, Context:, or Goal: are part of the message
          while (lines[i + 1]?.match(/^(  |Context:|Goal:)/)) {
            message += "\n" + lines[++i];
          }
          const severity = warn
            ? vscode.DiagnosticSeverity.Warning
            : vscode.DiagnosticSeverity.Error;
          const diag = new vscode.Diagnostic(range, message, severity);
          diagnostics.push(diag);
        }
      }
      diagnosticCollection.set(vscode.Uri.file(fileName), diagnostics);
    });
  }

  const runPiForall = vscode.commands.registerCommand(
    "pi-forall-vscode.check",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        if (document.fileName.endsWith(".pi")) {
          checkDocument(document);
        }
      }
    }
  );
  context.subscriptions.push(runPiForall);

  vscode.workspace.onDidSaveTextDocument((document) => {
    if (document.fileName.endsWith(".pi")) {
      vscode.commands.executeCommand("pi-forall-vscode.check");
    }
  });
  vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.fileName.endsWith(".pi")) {
      vscode.commands.executeCommand("pi-forall-vscode.check");
    }
  });
  for (let document of vscode.workspace.textDocuments) {
    if (document.fileName.endsWith(".pi")) {
      checkDocument(document);
    }
  }
  context.subscriptions.push(diagnosticCollection);
}

export function deactivate() {}
