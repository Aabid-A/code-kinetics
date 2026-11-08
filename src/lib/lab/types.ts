export type TemplateId = "button" | "toast" | "bento" | "custom";
export type ViewMode = "code" | "rendered";

export type AppState = {
  activeTemplate: TemplateId;
  viewMode: ViewMode;
  soundEnabled: boolean;
};

export type Command = { type: "MORPH" } | { type: "SET_VIEW"; mode: ViewMode }
  | { type: "SELECT_TEMPLATE"; id: TemplateId } | { type: "LOAD_GENERATED" } | { type: "TOGGLE_SOUND" };

export const initialState: AppState = { activeTemplate: "button", viewMode: "code", soundEnabled: false };

export function transition(state: AppState, command: Command): AppState {
  if (command.type === "TOGGLE_SOUND") return { ...state, soundEnabled: !state.soundEnabled };
  // A fresh generation always restarts in code mode, even when replacing a generated example.
  if (command.type === "LOAD_GENERATED") return { ...state, activeTemplate: "custom", viewMode: "code" };
  if (command.type === "SELECT_TEMPLATE") {
    return command.id === state.activeTemplate ? state : { ...state, activeTemplate: command.id, viewMode: "code" };
  }
  const viewMode = command.type === "MORPH"
    ? state.viewMode === "code" ? "rendered" : "code"
    : command.mode;
  return viewMode === state.viewMode ? state : { ...state, viewMode };
}
