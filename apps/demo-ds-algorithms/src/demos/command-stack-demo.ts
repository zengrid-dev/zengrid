import { CommandStack, type ICommand } from '@zengrid/shared';

export function initCommandStackDemo() {
  const cmdMaxsizeInput = document.getElementById('cmd-maxsize') as HTMLInputElement;
  const cmdInitBtn = document.getElementById('cmd-init-btn') as HTMLButtonElement;
  const cmdAddBtn = document.getElementById('cmd-add-btn') as HTMLButtonElement;
  const cmdDeleteBtn = document.getElementById('cmd-delete-btn') as HTMLButtonElement;
  const cmdUndoBtn = document.getElementById('cmd-undo-btn') as HTMLButtonElement;
  const cmdRedoBtn = document.getElementById('cmd-redo-btn') as HTMLButtonElement;
  const cmdClearBtn = document.getElementById('cmd-clear-btn') as HTMLButtonElement;
  const cmdDocument = document.getElementById('cmd-document') as HTMLDivElement;
  const cmdHistory = document.getElementById('cmd-history') as HTMLDivElement;
  const cmdUndoCount = document.getElementById('cmd-undo-count') as HTMLDivElement;
  const cmdRedoCount = document.getElementById('cmd-redo-count') as HTMLDivElement;
  const cmdTotalCount = document.getElementById('cmd-total-count') as HTMLDivElement;

  let commandStack: CommandStack | null = null;
  let documentText = '';
  let commandCounter = 0;

  function updateCommandStats() {
    if (!commandStack) return;

    cmdUndoCount.textContent = commandStack.getUndoCount().toString();
    cmdRedoCount.textContent = commandStack.getRedoCount().toString();
    cmdTotalCount.textContent = (commandStack.getUndoCount() + commandStack.getRedoCount()).toString();

    cmdUndoBtn.disabled = !commandStack.canUndo();
    cmdRedoBtn.disabled = !commandStack.canRedo();

    const undoHistory = commandStack.getUndoHistory();
    const redoHistory = commandStack.getRedoHistory();

    let historyText = '';

    if (undoHistory.length > 0) {
      historyText += 'Undo Stack (most recent first):\n';
      undoHistory.reverse().forEach((desc, idx) => {
        historyText += `  ${undoHistory.length - idx}. ${desc}\n`;
      });
      undoHistory.reverse();
    }

    if (redoHistory.length > 0) {
      historyText += '\nRedo Stack:\n';
      redoHistory.reverse().forEach((desc, idx) => {
        historyText += `  ${redoHistory.length - idx}. ${desc}\n`;
      });
    }

    if (undoHistory.length === 0 && redoHistory.length === 0) {
      historyText = 'No commands in history. Perform some actions to see the command history!';
    }

    cmdHistory.textContent = historyText;
  }

  function updateDocument() {
    cmdDocument.textContent = documentText || '(Empty document)';
  }

  cmdInitBtn.addEventListener('click', () => {
    const maxSize = parseInt(cmdMaxsizeInput.value);

    if (maxSize < 1 || maxSize > 1000) {
      cmdHistory.textContent = '❌ Max size must be between 1 and 1000';
      return;
    }

    commandStack = new CommandStack({ maxSize });
    documentText = 'Welcome to the Command Stack demo!\n';
    commandCounter = 0;

    updateDocument();
    updateCommandStats();

    cmdAddBtn.disabled = false;
    cmdDeleteBtn.disabled = false;
    cmdClearBtn.disabled = false;
    cmdInitBtn.textContent = '✓ Stack Initialized';
    cmdInitBtn.disabled = true;

    cmdHistory.textContent = `✅ Command Stack initialized with max size ${maxSize}\n\nReady to execute commands! Try adding and deleting text, then use undo/redo.`;
  });

  cmdAddBtn.addEventListener('click', () => {
    if (!commandStack) return;

    commandCounter++;
    const textToAdd = `Line ${commandCounter}: Added at ${new Date().toLocaleTimeString()}\n`;
    const previousText = documentText;
    const newText = previousText + textToAdd;

    const addCommand: ICommand = {
      description: `Add Line ${commandCounter}`,
      execute: () => {
        documentText = newText;
        updateDocument();
      },
      undo: () => {
        documentText = previousText;
        updateDocument();
      },
    };

    commandStack.execute(addCommand);
    updateCommandStats();
  });

  cmdDeleteBtn.addEventListener('click', () => {
    if (!commandStack) return;

    if (!documentText || documentText === 'Welcome to the Command Stack demo!\n') {
      cmdHistory.textContent = '⚠️ Document is empty or only contains welcome message. Add some text first!';
      return;
    }

    const previousText = documentText;
    const lines = documentText.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      cmdHistory.textContent = '⚠️ No lines to delete!';
      return;
    }

    const deletedLine = lines[lines.length - 1];

    const linesAfterDelete = [...lines];
    linesAfterDelete.pop();
    const newText = linesAfterDelete.join('\n') + (linesAfterDelete.length > 0 ? '\n' : '');

    const deleteCommand: ICommand = {
      description: `Delete "${deletedLine.substring(0, 30)}${deletedLine.length > 30 ? '...' : ''}"`,
      execute: () => {
        documentText = newText;
        updateDocument();
      },
      undo: () => {
        documentText = previousText;
        updateDocument();
      },
    };

    commandStack.execute(deleteCommand);
    updateCommandStats();
  });

  cmdUndoBtn.addEventListener('click', () => {
    if (!commandStack) return;

    const result = commandStack.undo();

    if (result) {
      updateCommandStats();
    }
  });

  cmdRedoBtn.addEventListener('click', () => {
    if (!commandStack) return;

    const result = commandStack.redo();

    if (result) {
      updateCommandStats();
    }
  });

  cmdClearBtn.addEventListener('click', () => {
    if (!commandStack) return;

    commandStack.clear();
    updateCommandStats();

    cmdHistory.textContent = '✅ Command stack cleared! The document state remains unchanged, but all undo/redo history is gone.';
  });
}
