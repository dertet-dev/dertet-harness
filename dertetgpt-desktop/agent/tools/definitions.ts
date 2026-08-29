import { ToolDefinition } from "../types";

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "read_file",
    description: "Read a text file's contents. Optionally a line range for large files.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute or project-relative file path" },
        startLine: { type: "number", description: "1-based start line (optional)" },
        endLine: { type: "number", description: "1-based end line, inclusive (optional)" }
      },
      required: ["path"]
    },
    requiresApproval: false
  },
  {
    name: "list_dir",
    description: "List files and subfolders in a directory (non-recursive).",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute or project-relative directory path" }
      },
      required: ["path"]
    },
    requiresApproval: false
  },
  {
    name: "write_file",
    description: "Create a file or overwrite it completely with new content.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute or project-relative file path" },
        content: { type: "string", description: "Full new file content" }
      },
      required: ["path", "content"]
    },
    requiresApproval: true
  },
  {
    name: "edit_file",
    description:
      "Replace one exact occurrence of oldText with newText inside an existing file. " +
      "oldText must match the file content exactly (including whitespace) and appear exactly once — " +
      "use enough surrounding context to make it unique. Prefer this over write_file for small changes.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute or project-relative file path" },
        oldText: { type: "string", description: "Exact existing text to replace (must be unique in the file)" },
        newText: { type: "string", description: "Replacement text" }
      },
      required: ["path", "oldText", "newText"]
    },
    requiresApproval: true
  },
  {
    name: "run_command",
    description:
      "Run a shell command (cmd.exe on Windows) and return stdout/stderr/exit code. " +
      "Has a hard timeout — long-running or interactive commands will be killed and reported as timed out.",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "The command line to execute" },
        cwd: { type: "string", description: "Working directory (optional, defaults to the session folder)" },
        timeoutSeconds: { type: "number", description: "Timeout in seconds, max 300 (optional, default 180)" }
      },
      required: ["command"]
    },
    requiresApproval: true
  },
  {
    name: "web_search",
    description: "Search the web and get a short list of results (titles + snippets + URLs) for a query.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" }
      },
      required: ["query"]
    },
    requiresApproval: false
  },
  {
    name: "web_fetch",
    description: "Fetch a specific URL and return its readable text content (for deeper research after a search).",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "Full URL to fetch" }
      },
      required: ["url"]
    },
    requiresApproval: false
  },
  {
    name: "update_dertetcode_md",
    description:
      "Update the DertetCode.md file in the project folder with the current project concept, architecture, " +
      "and a short summary of what happened in this session. Keep it concise — this is a memory aid for " +
      "future sessions, not a full log. Call this near the end of meaningful work, not after every message.",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "Full new content for DertetCode.md (Markdown)" }
      },
      required: ["content"]
    },
    requiresApproval: false
  },
  {
    name: "ask_user_choice",
    description:
      "Ask the user to pick from a short list of options instead of typing a full answer. Renders as a " +
      "small numbered menu (1-5) above the input box, plus an optional free-text field. Use only when a " +
      "menu genuinely helps — not for every question.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string", description: "Short question shown as the menu title" },
        options: { type: "array", description: "1 to 5 short option strings", items: { type: "string" } },
        allowCustom: { type: "string", description: "\"true\" or \"false\" — offer a free-text field too (default true)" }
      },
      required: ["question", "options"]
    },
    requiresApproval: false
  },
  {
    name: "computer_screenshot",
    description:
      "Take a screenshot of the user's screen so you can see what's currently displayed. " +
      "Requires the user's explicit permission the first time.",
    parameters: { type: "object", properties: {}, required: [] },
    requiresApproval: true,
    isComputerUse: true
  },
  {
    name: "computer_mouse_move",
    description: "Move the mouse cursor to specific screen coordinates.",
    parameters: {
      type: "object",
      properties: {
        x: { type: "number", description: "X coordinate in pixels" },
        y: { type: "number", description: "Y coordinate in pixels" }
      },
      required: ["x", "y"]
    },
    requiresApproval: true,
    isComputerUse: true
  },
  {
    name: "computer_mouse_click",
    description: "Move the mouse to coordinates and click there.",
    parameters: {
      type: "object",
      properties: {
        x: { type: "number", description: "X coordinate in pixels" },
        y: { type: "number", description: "Y coordinate in pixels" },
        button: { type: "string", description: "\"left\", \"right\", or \"double\" (default left)" }
      },
      required: ["x", "y"]
    },
    requiresApproval: true,
    isComputerUse: true
  },
  {
    name: "computer_key_type",
    description: "Type a string of text at the current focus, as if typed on the keyboard.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to type" }
      },
      required: ["text"]
    },
    requiresApproval: true,
    isComputerUse: true
  },
  {
    name: "computer_key_press",
    description:
      "Press a single key or key combination, e.g. \"Enter\", \"Escape\", \"Tab\", \"Ctrl+C\", \"Alt+F4\".",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string", description: "Key or combination, e.g. \"Enter\" or \"Ctrl+S\"" }
      },
      required: ["key"]
    },
    requiresApproval: true,
    isComputerUse: true
  }
];

export function toolByName(name: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.name === name);
}

export const READ_ONLY_TOOLS = new Set([
  "read_file",
  "list_dir",
  "web_search",
  "web_fetch",
  "update_dertetcode_md",
  "ask_user_choice"
]);

export const COMPUTER_USE_TOOLS = new Set(
  TOOL_DEFINITIONS.filter((t) => t.isComputerUse).map((t) => t.name)
);
