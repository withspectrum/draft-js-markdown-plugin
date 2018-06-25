import { EditorState, RichUtils, Modifier } from "draft-js";

export default (editorState, selection = editorState.getSelection()) => {
  const styles = ["BOLD", "ITALIC", "STRIKETHROUGH", "CODE"];

  let newEditorState = EditorState.push(
    editorState,
    styles.reduce(
      (newContentState, style) =>
        Modifier.removeInlineStyle(newContentState, selection, style),
      editorState.getCurrentContent()
    ),
    "change-inline-style"
  );

  return RichUtils.toggleLink(newEditorState, selection, null);
};
