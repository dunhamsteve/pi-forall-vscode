# pi4all README

pi4all adds code highlighting for the pi-forall language found at https://github.com/sweirich/pi-forall

## Features

This plugin does syntax highlighting for `.pi` files runs pi-forall for files on load and save. It will highlight warnings (`PRINTME`) and errors in the editor with details in the "Problems" pane.

The default command for running pi-forall is:
```sh
cabal v2-run pi-forall -- filename.pi
```
which should work if vscode is run on the `version1`, `version2`, etc directories for Stephanie Weirich's repository. You can also specify an arbitrary command in settings. If you use stack, you might want `stack run pi-forall` there.

If you're looking for a project, it might be fun to write an LSP server for pi-forall.
