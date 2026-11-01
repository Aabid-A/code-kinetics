export type TemplateId = "button" | "toast" | "bento";
export type ViewMode = "code" | "rendered";

export type AppState = {
  activeTemplate: TemplateId;
  viewMode: ViewMode;
};

export type Command = { type: "MORPH" } | { type: "SET_VIEW"; mode: ViewMode };

export const initialState: AppState = { activeTemplate: "button", viewMode: "code" };

export function transition(state: AppState, command: Command): AppState {
  const viewMode = command.type === "MORPH"
    ? state.viewMode === "code" ? "rendered" : "code"
    : command.mode;
  return viewMode === state.viewMode ? state : { ...state, viewMode };
}
