import React, { useRef, useEffect, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const COMMANDS = {
  help: {
    execute: () => 'Verfügbare Befehle: help, clear, echo, dir, exit',
  },
  clear: {
    execute: (terminal, setHistory) => {
      terminal.clear();
      setHistory([]);
      return null; // Don't show output for clear
    },
  },
  echo: {
    execute: (terminal, setHistory, args) => args.join(' '),
  },
  dir: {
    execute: () => 
      'Volume in Laufwerk C: GOV-ARCHIVE\nVerzeichnis von C:/GOV-ARCHIVE\n\n[public]\n[src]\nREADME.md\nindex.html',
  },
  exit: {
    execute: null, // Special handling needed
  },
};

const TERMINAL_STYLES = {
  window: {
    position: 'fixed',
    left: '20vw',
    top: '10vh',
    width: 600,
    height: 400,
    zIndex: 1000,
  },
  body: {
    padding: 0,
    height: '100%',
    background: '#181c1f',
  },
};

export default function GovTerminalWindow({ onClose, initialHistory = [] }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const [currentInput, setCurrentInput] = useState('');
  const [history, setHistory] = useState(initialHistory);
  const PROMPT = 'C:/GOV-ARCHIVE> ';

  const showPrompt = (xterm) => {
    if (xterm) {
      xterm.write(`\r\n${PROMPT}`);
      setCurrentInput('');
    }
  };

  const handleCommand = (xterm, cmd) => {
    if (!xterm || !cmd.trim()) return;

    // Add to history
    setHistory(prev => [...prev, PROMPT + cmd]);

    const [commandName, ...args] = cmd.split(' ');
    const command = COMMANDS[commandName];

    if (commandName === 'exit') {
      xterm.write('\r\nTerminal geschlossen.');
      setTimeout(() => onClose?.(), 500);
      return;
    }

    if (command) {
      const output = command.execute(xterm, setHistory, args);
      if (output) {
        xterm.write(`\r\n${output}`);
        setHistory(prev => [...prev, output]);
      }
    } else {
      const errorMsg = 'Unbekannter Befehl. Tippe "help".';
      xterm.write(`\r\n${errorMsg}`);
      setHistory(prev => [...prev, errorMsg]);
    }
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new Terminal({
      cursorBlink: true,
      fontFamily: 'Fira Mono, Consolas, monospace',
      fontSize: 16,
      theme: {
        background: '#181c1f',
        foreground: '#e0e0e0',
        cursor: '#6cf',
        selection: '#333',
      },
      windowsMode: true,
      disableStdin: false,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = xterm;

    // Display history
    if (history.length > 0) {
      history.forEach(line => xterm.write(`\r\n${line}`));
    } else {
      xterm.write('\x1b[1;36mWillkommen im GOV-ARCHIVE Terminal\x1b[0m\r\n');
    }
    showPrompt(xterm);

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    const handleKeyPress = (e) => {
      const { domEvent, key } = e;
      
      if (domEvent.key === 'Enter') {
        handleCommand(xterm, currentInput);
        showPrompt(xterm);
      } else if (domEvent.key === 'Backspace') {
        if (currentInput.length > 0) {
          setCurrentInput(prev => prev.slice(0, -1));
          xterm.write('\b \b');
        }
      } else if (key.length === 1 && !domEvent.ctrlKey && !domEvent.altKey && !domEvent.metaKey) {
        setCurrentInput(prev => prev + key);
        xterm.write(key);
      }
    };

    xterm.onKey(handleKeyPress);
    setTimeout(() => xterm.focus(), 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      xterm.dispose();
    };
  }, [history, currentInput, onClose]);

  return (
    <div className="gov-terminal-window" style={TERMINAL_STYLES.window}>
      <div className="gov-terminal-header">
        <span>GOV-Terminal</span>
        <button className="gov-terminal-close" onClick={onClose}>×</button>
      </div>
      <div className="gov-terminal-body" style={TERMINAL_STYLES.body}>
        <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
