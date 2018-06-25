import { OrderedSet } from "immutable";
import { EditorState, SelectionState, Modifier } from "draft-js";

const changeCurrentInlineStyle = (editorState, matchArr, style) => {
  const currentContent = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  const key = selection.getStartKey();
  const { index } = matchArr;
  const blockMap = currentContent.getBlockMap();
  const block = blockMap.get(key);
  const currentInlineStyle = block.getInlineStyleAt(index).merge();
  const newStyle = currentInlineStyle.merge([style]);
  const focusOffset = index + matchArr[0].length;

  const wordSelection = SelectionState.createEmpty(key).merge({
    anchorOffset: index,
    focusOffset,
  });

  // check if match contains a terminator group at the end
  let matchTerminatorLength = 0;
  if (matchArr.length == 3) {
    matchTerminatorLength = matchArr[2].length;
  }

  const markdownCharacterLength =
    (matchArr[0].length - matchArr[1].length - matchTerminatorLength) / 2;

  const inlineStyles = [];
  let newContentState = currentContent;

  // remove markdown delimiter at end
  newContentState = Modifier.removeRange(
    newContentState,
    wordSelection.merge({
      anchorOffset:
        wordSelection.getFocusOffset() -
        markdownCharacterLength -
        matchTerminatorLength,
    })
  );

  let afterSelection = newContentState.getSelectionAfter();

  afterSelection = afterSelection.merge({
    anchorOffset: afterSelection.getFocusOffset() - markdownCharacterLength,
    focusOffset: afterSelection.getFocusOffset() - markdownCharacterLength,
  });

  // remove markdown delimiter at start
  newContentState = Modifier.removeRange(
    newContentState,
    wordSelection.merge({
      focusOffset: wordSelection.getAnchorOffset() + markdownCharacterLength,
    })
  );

  // apply style
  newContentState = Modifier.applyInlineStyle(
    newContentState,
    wordSelection.merge({
      anchorOffset: index,
      focusOffset:
        focusOffset - markdownCharacterLength * 2 - matchTerminatorLength,
    }),
    style
  );

  // Check if a terminator exists and re-add it after the styled text
  if (matchTerminatorLength > 0) {
    newContentState = Modifier.insertText(
      newContentState,
      afterSelection,
      matchArr[2]
    );
    afterSelection = newContentState.getSelectionAfter();
  }

  const newEditorState = EditorState.push(
    editorState,
    newContentState,
    "change-inline-style"
  );

  return EditorState.setInlineStyleOverride(
    EditorState.forceSelection(newEditorState, afterSelection),
    OrderedSet.of("")
  );
};

export default changeCurrentInlineStyle;
