import { EditorState } from "draft-js";

export const applyMDtoInlineStyleChange = editorState =>
  EditorState.set(editorState, {
    lastChangeType: "md-to-inline-style",
  });
