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
    name: "browser_open",
    description:
      "Open a URL in a real rendered browser tab (runs JavaScript, keeps cookies for this session — " +
      "unlike web_fetch). Use this instead of web_fetch when the page needs JavaScript to render, is " +
      "paginated/interactive, or when web_fetch returned little/nothing useful. Reuses the tab named " +
      "tabId across calls (default \"main\") so navigation state and cookies persist.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "Full URL to open" },
        tabId: { type: "string", description: "Tab name to reuse (optional, default \"main\")" }
      },
      required: ["url"]
    },
    requiresApproval: false
  },
  {
    name: "browser_read",
    description:
      "Read the currently open page in a browser tab. mode \"text\" returns the readable article/body " +
      "text (paginate long pages with startChar); mode \"links\" returns the page's links; mode " +
      "\"elements\" returns a numbered list of clickable/typeable elements for use with browser_click " +
      "and browser_type.",
    parameters: {
      type: "object",
      properties: {
        tabId: { type: "string", description: "Tab name (optional, default \"main\")" },
        mode: { type: "string", description: "\"text\", \"links\", or \"elements\" (default \"text\")" },
        startChar: { type: "number", description: "Start offset for text mode pagination (optional)" },
        maxChars: { type: "number", description: "Max characters to return for text mode, capped at 6000 (optional)" }
      },
      required: []
    },
    requiresApproval: false
  },
  {
    name: "browser_find",
    description: "Search the currently open page for text or a matching element, returning surrounding context.",
    parameters: {
      type: "object",
      properties: {
        tabId: { type: "string", description: "Tab name (optional, default \"main\")" },
        query: { type: "string", description: "Text to search for on the page" }
      },
      required: ["query"]
    },
    requiresApproval: false
  },
  {
    name: "browser_click",
    description:
      "Click an element on the currently open page by its index from browser_read(mode=\"elements\"). " +
      "State-changing (can submit forms, follow links, trigger purchases etc.) — requires approval.",
    parameters: {
      type: "object",
      properties: {
        tabId: { type: "string", description: "Tab name (optional, default \"main\")" },
        elementIndex: { type: "number", description: "Element index from browser_read(mode=\"elements\")" }
      },
      required: ["elementIndex"]
    },
    requiresApproval: true
  },
  {
    name: "browser_type",
    description:
      "Type text into an input/textarea on the currently open page by its index from " +
      "browser_read(mode=\"elements\"). State-changing — requires approval.",
    parameters: {
      type: "object",
      properties: {
        tabId: { type: "string", description: "Tab name (optional, default \"main\")" },
        elementIndex: { type: "number", description: "Element index from browser_read(mode=\"elements\")" },
        text: { type: "string", description: "Text to type" },
        submit: { type: "string", description: "\"true\" to submit the enclosing form / press Enter after typing (optional)" }
      },
      required: ["elementIndex", "text"]
    },
    requiresApproval: true
  },
  {
    name: "browser_screenshot",
    description: "Take a screenshot of the currently open page in a browser tab (visual check, not the user's desktop).",
    parameters: {
      type: "object",
      properties: {
        tabId: { type: "string", description: "Tab name (optional, default \"main\")" }
      },
      required: []
    },
    requiresApproval: false
  },
  {
    name: "browser_close",
    description: "Close a browser tab and free its resources.",
    parameters: {
      type: "object",
      properties: {
        tabId: { type: "string", description: "Tab name (optional, default \"main\")" }
      },
      required: []
    },
    requiresApproval: false
  },
  {
    name: "video_probe",
    description: "Inspect a video/audio/image file (codec, resolution, duration, framerate) before editing it.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute or project-relative path to the media file" }
      },
      required: ["path"]
    },
    requiresApproval: false
  },
  {
    name: "video_add_audio",
    description: "Add an audio track to a video: replace its audio entirely, mix in on top, or keep both as separate tracks.",
    parameters: {
      type: "object",
      properties: {
        videoPath: { type: "string", description: "Absolute or project-relative path to the source video" },
        audioPath: { type: "string", description: "Absolute or project-relative path to the audio file" },
        outputPath: { type: "string", description: "Absolute or project-relative path for the output video" },
        mode: { type: "string", description: "\"replace\", \"mix\", or \"keep_both\" (default \"replace\")" }
      },
      required: ["videoPath", "audioPath", "outputPath"]
    },
    requiresApproval: true
  },
  {
    name: "video_trim",
    description: "Cut a video down to the [startSeconds, endSeconds] range.",
    parameters: {
      type: "object",
      properties: {
        videoPath: { type: "string", description: "Absolute or project-relative path to the source video" },
        startSeconds: { type: "number", description: "Start time in seconds" },
        endSeconds: { type: "number", description: "End time in seconds" },
        outputPath: { type: "string", description: "Absolute or project-relative path for the output video" }
      },
      required: ["videoPath", "startSeconds", "endSeconds", "outputPath"]
    },
    requiresApproval: true
  },
  {
    name: "video_concat",
    description:
      "Splice/concatenate multiple video clips into one, in the given order. Clips from different " +
      "sources are re-encoded and normalized to the first clip's resolution automatically, since raw " +
      "concatenation silently breaks on mismatched codecs/resolutions.",
    parameters: {
      type: "object",
      properties: {
        videoPaths: { type: "array", description: "Ordered list of video file paths to concatenate", items: { type: "string" } },
        outputPath: { type: "string", description: "Absolute or project-relative path for the output video" }
      },
      required: ["videoPaths", "outputPath"]
    },
    requiresApproval: true
  },
  {
    name: "video_from_images",
    description: "Assemble a slideshow-style video from a sequence of images, optionally with a background audio track.",
    parameters: {
      type: "object",
      properties: {
        imagePaths: { type: "array", description: "Ordered list of image file paths", items: { type: "string" } },
        outputPath: { type: "string", description: "Absolute or project-relative path for the output video" },
        secondsPerImage: { type: "number", description: "How many seconds each image is shown for" },
        audioPath: { type: "string", description: "Optional background audio file path" }
      },
      required: ["imagePaths", "outputPath", "secondsPerImage"]
    },
    requiresApproval: true
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
  "browser_open",
  "browser_read",
  "browser_find",
  "browser_screenshot",
  "browser_close",
  "video_probe",
  "update_dertetcode_md",
  "ask_user_choice"
]);

export const COMPUTER_USE_TOOLS = new Set(
  TOOL_DEFINITIONS.filter((t) => t.isComputerUse).map((t) => t.name)
);
