import Draft, {
  ContentState,
  EditorState,
  SelectionState,
  ContentBlock,
  convertToRaw,
} from "draft-js";
import createMarkdownPlugin from "../";

const predictableKeys = editorState => {
  const content = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  let newSelection = selection;
  const blocks = content.getBlockMap();
  const newBlocks = blocks.mapEntries(([key, block], index) => {
    const newKey = `block-${index.toString(32)}`;
    if (newSelection.anchorKey === key) {
      newSelection = newSelection.set("anchorKey", newKey);
    }
    if (newSelection.focusKey === key) {
      newSelection = newSelection.set("focusKey", newKey);
    }
    return [newKey, block.set("key", newKey)];
  });
  return EditorState.create({
    allowUndo: editorState.allowUndo,
    currentContent: ContentState.createFromBlockArray(newBlocks.toArray()),
    selection: newSelection,
    decorator: editorState.decorator,
  });
};

const textToEditorState = (strings, ...interpolations) => {
  const contentState = ContentState.createFromText(strings.join(""));
  const randomKeysEditorState = EditorState.createWithContent(contentState);
  const editorState = predictableKeys(randomKeysEditorState);
  return EditorState.moveSelectionToEnd(editorState);
};

describe("textToEditorState", () => {
  it("should return DraftJS EditorState", () => {
    expect(textToEditorState`some text`).toBeInstanceOf(EditorState);
  });

  it("should have the text passed to textToEditorState", () => {
    expect(
      textToEditorState`some text`.getCurrentContent().getPlainText()
    ).toEqual("some text");
  });

  it("should have predictable block keys", () => {
    expect(
      convertToRaw(textToEditorState`some text`.getCurrentContent())
    ).toMatchSnapshot();
  });

  it("should have the selection at the end by default", () => {
    expect(textToEditorState`some text`.getSelection().serialize()).toEqual(
      "Anchor: block-0:9, Focus: block-0:9, Is Backward: false, Has Focus: false"
    );
  });
});

describe("markdown", () => {
  it("should convert asteriks to bold text", () => {
    const { handleBeforeInput } = createMarkdownPlugin();
    const setEditorState = jest.fn();
    const before = EditorState.moveSelectionToEnd(
      EditorState.createWithContent(
        Draft.convertFromRaw({
          entityMap: {},
          blocks: [
            {
              key: "item1",
              text: "Some *text",
              type: "unstyled",
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {},
            },
          ],
        })
      )
    );
    expect(handleBeforeInput("*", before, { setEditorState })).toEqual(
      "handled"
    );
    const raw = convertToRaw(
      setEditorState.mock.calls[0][0].getCurrentContent()
    );
    expect(raw).toMatchSnapshot();
  });

  it("should not do anything to existing inline styles when within them", () => {
    const { handleBeforeInput } = createMarkdownPlugin();
    const setEditorState = jest.fn();
    const boldInlineStyleRange = {
      length: 4,
      offset: 5,
      style: "BOLD",
    };
    const before = EditorState.forceSelection(
      EditorState.createWithContent(
        Draft.convertFromRaw({
          entityMap: {},
          blocks: [
            {
              key: "item1",
              text: "Some text",
              type: "unstyled",
              depth: 0,
              inlineStyleRanges: [boldInlineStyleRange],
              entityRanges: [],
              data: {},
            },
          ],
        })
      ),
      new SelectionState({
        anchorKey: "item1",
        anchorOffset: 6,
        focusKey: "item1",
        focusOffset: 6,
        isBackward: false,
        hasFocus: true,
      })
    );
    expect(handleBeforeInput("a", before, { setEditorState })).toEqual(
      "not-handled"
    );
  });

  it("should not have sticky inline styles", () => {
    const { handleBeforeInput } = createMarkdownPlugin();
    const setEditorState = jest.fn();
    const boldInlineStyleRange = {
      length: 4,
      offset: 5,
      style: "BOLD",
    };
    const before = EditorState.moveSelectionToEnd(
      EditorState.createWithContent(
        Draft.convertFromRaw({
          entityMap: {},
          blocks: [
            {
              key: "item1",
              text: "Some text",
              type: "unstyled",
              depth: 0,
              inlineStyleRanges: [boldInlineStyleRange],
              entityRanges: [],
              data: {},
            },
          ],
        })
      )
    );
    expect(handleBeforeInput("a", before, { setEditorState })).toEqual(
      "handled"
    );
    const raw = convertToRaw(
      setEditorState.mock.calls[0][0].getCurrentContent()
    );
    expect(raw.blocks[0].inlineStyleRanges[0]).toEqual(boldInlineStyleRange);
    expect(raw).toMatchSnapshot();
  });
});
