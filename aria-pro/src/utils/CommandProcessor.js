export class CommandProcessor {
  constructor() {
    this.commands = {
      'youtube': () => window.open('https://youtube.com', '_blank'),
      'google': () => window.open('https://google.com', '_blank'),
      'gmail': () => window.open('https://gmail.com', '_blank'),
      'github': () => window.open('https://github.com', '_blank'),
      'twitter': () => window.open('https://twitter.com', '_blank'),
      'linkedin': () => window.open('https://linkedin.com', '_blank'),
    };

    this.infoCommands = {
      'time': () => new Date().toLocaleTimeString(),
      'date': () => new Date().toLocaleDateString(),
      'hello': () => 'Hi there! How can I help you?',
    };
  }

  processCommand(input) {
    const cleanInput = input.toLowerCase().trim();

    // Check for "open" commands
    for (const [cmd, action] of Object.entries(this.commands)) {
      if (
        cleanInput.includes(`open ${cmd}`) ||
        cleanInput.includes(`${cmd}`) ||
        cleanInput.includes(`खोलें ${cmd}`) ||
        cleanInput.includes(cmd)
      ) {
        try {
          action();
          return { executed: true, command: cmd, message: `Opening ${cmd}...` };
        } catch (error) {
          return { executed: false, message: 'Unable to execute command' };
        }
      }
    }

    // Check for info commands
    for (const [cmd, action] of Object.entries(this.infoCommands)) {
      if (
        cleanInput.includes(cmd) ||
        (cmd === 'time' && cleanInput.includes('समय')) ||
        (cmd === 'date' && cleanInput.includes('तारीख'))
      ) {
        const response = action();
        return { executed: true, command: cmd, message: response, isInfo: true };
      }
    }

    return { executed: false, message: null };
  }

  getAvailableCommands() {
    return {
      open: Object.keys(this.commands),
      info: Object.keys(this.infoCommands)
    };
  }
}

export const commandProcessor = new CommandProcessor();
