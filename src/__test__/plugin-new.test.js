import Draft, { EditorState, SelectionState, convertToRaw } from "draft-js";
import createMarkdownPlugin from "../";
import { applyMDtoInlineStyleChange } from "./utils";

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

  it("should not unstick inline styles if they were not added by md-to-inline-style change", () => {
    const { handleBeforeInput } = createMarkdownPlugin();
    const boldInlineStyleRange = {
      length: 4,
      offset: 5,
      style: "BOLD",
    };
    const editorState = EditorState.moveSelectionToEnd(
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
    expect(handleBeforeInput("a", editorState, {})).toEqual("not-handled");
  });

  it("should not have sticky inline styles", () => {
    const { handleBeforeInput } = createMarkdownPlugin();
    const setEditorState = jest.fn();
    const boldInlineStyleRange = {
      length: 4,
      offset: 5,
      style: "BOLD",
    };
    const editorState = applyMDtoInlineStyleChange(
      EditorState.moveSelectionToEnd(
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
      )
    );

    expect(handleBeforeInput("a", editorState, { setEditorState })).toEqual(
      "handled"
    );
    const raw = convertToRaw(
      setEditorState.mock.calls[0][0].getCurrentContent()
    );
    expect(raw.blocks[0].inlineStyleRanges[0]).toEqual(boldInlineStyleRange);
    expect(raw).toMatchSnapshot();
  });

  it("should not have sticky inline styles after the line ending with styles", () => {
    const { handleBeforeInput } = createMarkdownPlugin();
    const setEditorState = jest.fn();
    const boldInlineStyleRange = {
      length: 4,
      offset: 5,
      style: "BOLD",
    };
    const editorState = applyMDtoInlineStyleChange(
      EditorState.moveSelectionToEnd(
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
              {
                key: "item2",
                text: "",
                type: "unstyled",
                depth: 0,
                inlineStyleRanges: [],
                entityRanges: [],
                data: {},
              },
            ],
          })
        )
      )
    );

    expect(handleBeforeInput("a", editorState, { setEditorState })).toEqual(
      "handled"
    );
    const raw = convertToRaw(
      setEditorState.mock.calls[0][0].getCurrentContent()
    );
    expect(raw.blocks[0].inlineStyleRanges[0]).toEqual(boldInlineStyleRange);
    expect(raw).toMatchSnapshot();
  });
});
