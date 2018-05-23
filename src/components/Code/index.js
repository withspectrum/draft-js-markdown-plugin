import React, { PureComponent } from "react";
import { Map } from "immutable";
import { EditorState, EditorBlock, Modifier } from "draft-js";

const alias = {
  javascript: "js",
  jsx: "js",
};

class CodeSwitchContainer extends PureComponent {
  render() {
    return (
      <div contentEditable={false} onClick={this.props.onClick}>
        {this.props.children}
      </div>
    );
  }
}

class CodeBlock extends PureComponent {
  onChange = ev => {
    ev.preventDefault();
    ev.stopPropagation();
    const blockKey = this.props.block.getKey();
    const {
      getEditorState,
      setReadOnly,
      setEditorState,
    } = this.props.blockProps;

    const editorState = getEditorState();
    const selection = editorState.getSelection();
    const language = ev.currentTarget.value;
    const blockSelection = selection.merge({
      anchorKey: blockKey,
      focusKey: blockKey,
    });

    let content = editorState.getCurrentContent();
    content = Modifier.mergeBlockData(
      content,
      blockSelection,
      Map({ language })
    );
    setReadOnly(false);

    const newEditorState = EditorState.push(
      editorState,
      content,
      "change-block-data"
    );

    setEditorState(EditorState.forceSelection(newEditorState, selection));
  };

  onSelectClick = event => {
    event.stopPropagation();
  };

  render() {
    const {
      languages,
      renderLanguageSelect,
      language: _language,
    } = this.props.blockProps;

    const language = alias[_language] || _language;
    const selectedLabel = languages[language];
    const selectedValue = language;

    const options = Object.keys(languages).reduce(
      (acc, val) => [
        ...acc,
        {
          label: languages[val],
          value: val,
        },
      ],
      []
    );

    return (
      <div>
        <EditorBlock {...this.props} />
        <CodeSwitchContainer onClick={this.onSelectClick}>
          {renderLanguageSelect({
            selectedLabel,
            selectedValue,
            onChange: this.onChange,
            options,
          })}
        </CodeSwitchContainer>
      </div>
    );
  }
}

export default CodeBlock;
