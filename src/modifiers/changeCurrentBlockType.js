import { EditorState, CharacterMetadata } from "draft-js";

const changeCurrentBlockType = (
  editorState,
  type,
  text,
  blockMetadata = {}
) => {
  const currentContent = editorState.getCurrentContent();
  let selection = editorState.getSelection();
  const startKey = selection.getStartKey();
  const endKey = selection.getEndKey();
  var blockMap = currentContent.getBlockMap();
  const startBlock = blockMap.get(startKey);
  const endBlock = blockMap.get(endKey);
  if (startKey !== endKey) {
    // blocks after the startKey should be removed
    var currentKey = startKey;
    const keysToRemove = [];
    do {
      currentKey = currentContent.getKeyAfter(currentKey);
      keysToRemove.push(currentKey);
    } while (currentKey !== endKey);
    keysToRemove.forEach(key => (blockMap = blockMap.delete(key)));
  }
  const data = startBlock.getData().merge(blockMetadata);
  const characterList = [];
  for (var i = 0; i < text.length; ++i) {
    // it seems that current API can not make me figure out the correct
    // CharacterMetadata for each character in the text
    characterList.push(CharacterMetadata.create());
  }
  const newBlock = startBlock.merge({ type, data, text, characterList });

  // It seems that there is no way to get the right selectionAfter.
  // Use the same trivial solution as the old version
  const startOffset = selection.getStartOffset();
  var afterOffset = text.length;
  if (startOffset < afterOffset) {
    afterOffset = startOffset;
  }

  selection = selection.merge({
    anchorKey: startKey,
    focusKey: startKey,
    anchorOffset: afterOffset,
    focusOffset: afterOffset,
  });

  const newContentState = currentContent.merge({
    blockMap: blockMap.set(startKey, newBlock),
    selectionAfter: selection,
  });

  return EditorState.push(editorState, newContentState, "change-block-type");
};

export default changeCurrentBlockType;
