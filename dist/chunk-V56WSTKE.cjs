'use strict';

var chunkWOKNPWRC_cjs = require('./chunk-WOKNPWRC.cjs');
var chunkP2NLJLNZ_cjs = require('./chunk-P2NLJLNZ.cjs');
var chunkOBFBUWOR_cjs = require('./chunk-OBFBUWOR.cjs');
var child_process = require('child_process');
var piTui = require('@mariozechner/pi-tui');
var chalk8 = require('chalk');
var fs2 = require('fs');
var path6 = require('path');
var url = require('url');
var yaml = require('yaml');
var harness = require('@mastra/core/harness');
var llm = require('@mastra/core/llm');
var process2 = require('process');
var stripAnsi = require('strip-ansi');
var os = require('os');
var cliHighlight = require('cli-highlight');
var utils = require('@mastra/core/utils');
var fs5 = require('fs/promises');
var partialJson = require('partial-json');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var chalk8__default = /*#__PURE__*/_interopDefault(chalk8);
var fs2__default = /*#__PURE__*/_interopDefault(fs2);
var path6__namespace = /*#__PURE__*/_interopNamespace(path6);
var process2__default = /*#__PURE__*/_interopDefault(process2);
var stripAnsi__default = /*#__PURE__*/_interopDefault(stripAnsi);
var os__namespace = /*#__PURE__*/_interopNamespace(os);
var fs5__default = /*#__PURE__*/_interopDefault(fs5);

var AskQuestionBorderedBox = class {
  questionLines;
  selectList;
  input;
  hintText;
  items;
  answered = false;
  cancelled = false;
  selectedValue;
  answerIsNegative = false;
  /** True when created during streaming, before activate() is called */
  streaming = false;
  constructor(questionLines, hintText, items, selectList, input, streaming) {
    this.questionLines = questionLines;
    this.hintText = hintText;
    this.items = items;
    this.selectList = selectList;
    this.input = input;
    this.streaming = streaming ?? false;
  }
  invalidate() {
    this.selectList?.invalidate();
  }
  setInteractive(selectList, input, hintText) {
    this.streaming = false;
    this.selectList = selectList;
    this.input = input;
    if (hintText) this.hintText = hintText;
  }
  setAnswered(selectedValue, isNegative) {
    this.streaming = false;
    this.answered = true;
    this.selectedValue = selectedValue;
    this.answerIsNegative = isNegative;
  }
  setCancelled() {
    this.streaming = false;
    this.answered = true;
    this.cancelled = true;
  }
  render(width) {
    try {
      return this._render(width);
    } catch {
      return [
        chunkWOKNPWRC_cjs.BOX_INDENT_STR + chunkWOKNPWRC_cjs.theme.fg("dim", "\u256D\u2500\u2500\u2500\u2500 Question \u2500\u2500\u2500\u2500\u256E"),
        chunkWOKNPWRC_cjs.BOX_INDENT_STR + chunkWOKNPWRC_cjs.theme.fg("dim", "\u2502 (render error)   \u2502"),
        chunkWOKNPWRC_cjs.BOX_INDENT_STR + chunkWOKNPWRC_cjs.theme.fg("dim", "\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F")
      ];
    }
  }
  _render(width) {
    const border = (s) => chunkWOKNPWRC_cjs.theme.fg("dim", s);
    const innerWidth = Math.max(1, width - chunkWOKNPWRC_cjs.BOX_INDENT_STR.length - 4);
    const boxWidth = innerWidth + 4;
    const lines = [];
    lines.push(chunkWOKNPWRC_cjs.BOX_INDENT_STR + border(`\u256D${"\u2500".repeat(boxWidth - 2)}\u256E`));
    const addLine = (content, contentVisWidth) => {
      const pad = Math.max(0, innerWidth - contentVisWidth);
      lines.push(chunkWOKNPWRC_cjs.BOX_INDENT_STR + border("\u2502") + " " + content + " ".repeat(pad) + " " + border("\u2502"));
    };
    const header = chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "Question"));
    addLine(header, piTui.visibleWidth(header));
    for (const qLine of this.questionLines) {
      const wrapped = piTui.wrapTextWithAnsi(qLine, innerWidth);
      for (const wLine of wrapped) {
        const text = chunkWOKNPWRC_cjs.theme.fg("text", wLine);
        addLine(text, piTui.visibleWidth(wLine));
      }
    }
    addLine("", 0);
    if (this.streaming) {
      for (const item of this.items) {
        const line = chunkWOKNPWRC_cjs.theme.fg("dim", `   ${item.label}`);
        addLine(line, piTui.visibleWidth(line));
      }
      const waiting = chunkWOKNPWRC_cjs.theme.fg("dim", "\u2026");
      addLine(waiting, piTui.visibleWidth(waiting));
    } else if (this.answered && this.items.length > 0) {
      if (this.cancelled) {
        for (const item of this.items) {
          const line = chunkWOKNPWRC_cjs.theme.fg("dim", `   ${item.label}`);
          addLine(line, piTui.visibleWidth(line));
        }
        const cancelLine = `${chunkWOKNPWRC_cjs.theme.fg("error", "\u2717")}  ${chunkWOKNPWRC_cjs.theme.fg("dim", "(cancelled)")}`;
        addLine(cancelLine, piTui.visibleWidth(cancelLine));
      } else {
        for (const item of this.items) {
          const isSelected = item.label === this.selectedValue;
          if (isSelected) {
            const icon = this.answerIsNegative ? chunkWOKNPWRC_cjs.theme.fg("error", "\u2717") : chunkWOKNPWRC_cjs.theme.fg("success", "\u2713");
            const label = chunkWOKNPWRC_cjs.theme.fg("text", item.label);
            const line = `${icon}  ${label}`;
            addLine(line, piTui.visibleWidth(line));
          } else {
            const line = chunkWOKNPWRC_cjs.theme.fg("dim", `   ${item.label}`);
            addLine(line, piTui.visibleWidth(line));
          }
        }
      }
      addLine("", 0);
    } else if (this.answered && this.selectedValue != null) {
      const icon = this.answerIsNegative ? chunkWOKNPWRC_cjs.theme.fg("error", "\u2717") : chunkWOKNPWRC_cjs.theme.fg("success", "\u2713");
      const iconPrefix = `${icon}  `;
      const continuationPrefix = "   ";
      const wrappedAnswer = piTui.wrapTextWithAnsi(this.selectedValue, Math.max(1, innerWidth - piTui.visibleWidth(iconPrefix)));
      wrappedAnswer.forEach((line, index) => {
        const prefix = index === 0 ? iconPrefix : continuationPrefix;
        const content = `${prefix}${chunkWOKNPWRC_cjs.theme.fg("text", line)}`;
        addLine(content, piTui.visibleWidth(prefix) + piTui.visibleWidth(line));
      });
    } else if (this.answered && this.cancelled) {
      const cancelLine = `${chunkWOKNPWRC_cjs.theme.fg("error", "\u2717")}  ${chunkWOKNPWRC_cjs.theme.fg("dim", "(cancelled)")}`;
      addLine(cancelLine, piTui.visibleWidth(cancelLine));
    } else {
      if (this.selectList) {
        const selectLines = this.selectList.render(innerWidth);
        for (const sLine of selectLines) {
          addLine(sLine, piTui.visibleWidth(sLine));
        }
      } else if (this.input) {
        const inputLines = this.input.render(innerWidth);
        for (const iLine of inputLines) {
          addLine(iLine, piTui.visibleWidth(iLine));
        }
      }
      const hint = chunkWOKNPWRC_cjs.theme.fg("dim", this.hintText);
      addLine(hint, piTui.visibleWidth(hint));
    }
    lines.push(chunkWOKNPWRC_cjs.BOX_INDENT_STR + border(`\u2570${"\u2500".repeat(boxWidth - 2)}\u256F`));
    return lines;
  }
};
var AskQuestionInlineComponent = class _AskQuestionInlineComponent extends piTui.Container {
  borderedBox;
  selectList;
  input;
  onSubmit;
  onCancel;
  isNegativeAnswer;
  allowEmptyInput = false;
  answered = false;
  /**
   * Create a pre-answered instance for rendering from chat history.
   * No interactive elements — just shows the question and the answer in the bordered box.
   */
  static fromHistory(question, options, answer, cancelled) {
    const component = _AskQuestionInlineComponent.createStreaming();
    component.updateArgs({ question, options });
    component.answered = true;
    if (cancelled) {
      component.borderedBox.setCancelled();
    } else {
      component.borderedBox.setAnswered(answer, false);
    }
    return component;
  }
  /**
   * Create a streaming instance for early rendering during tool input streaming.
   * Shows the bordered box with "…" indicator. Call updateArgs() as partial JSON
   * arrives, then activate() when the question event fires.
   */
  static createStreaming() {
    const component = new _AskQuestionInlineComponent();
    return component;
  }
  _focused = false;
  get focused() {
    return this._focused;
  }
  set focused(value) {
    this._focused = value;
    if (!this.answered && this.input) {
      this.input.focused = value;
    }
  }
  render(width) {
    try {
      return super.render(width);
    } catch {
      return [
        chunkWOKNPWRC_cjs.BOX_INDENT_STR + chunkWOKNPWRC_cjs.theme.fg("dim", "\u256D\u2500\u2500\u2500\u2500 Question \u2500\u2500\u2500\u2500\u256E"),
        chunkWOKNPWRC_cjs.BOX_INDENT_STR + chunkWOKNPWRC_cjs.theme.fg("dim", "\u2502 (render error)   \u2502"),
        chunkWOKNPWRC_cjs.BOX_INDENT_STR + chunkWOKNPWRC_cjs.theme.fg("dim", "\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F")
      ];
    }
  }
  /**
   * Private constructor — use static factories or the options constructor.
   */
  constructor(options, _ui) {
    super();
    if (options) {
      this.onSubmit = options.onSubmit;
      this.onCancel = options.onCancel;
      this.isNegativeAnswer = options.isNegativeAnswer;
      this.allowEmptyInput = Boolean(options.allowEmptyInput);
      const questionLines = options.question.split("\n");
      let hintText;
      if (options.options && options.options.length > 0) {
        hintText = "\u2191\u2193 to navigate \xB7 Enter to select \xB7 Esc to skip";
        this.buildSelectMode(options.options);
      } else {
        hintText = "Enter to submit \xB7 Esc to skip";
        this.buildInputMode();
      }
      this.borderedBox = new AskQuestionBorderedBox(
        questionLines,
        hintText,
        options.options || [],
        this.selectList,
        this.input
      );
    } else {
      this.borderedBox = new AskQuestionBorderedBox([], "", [], void 0, void 0, true);
    }
    this.addChild(this.borderedBox);
    this.addChild(new piTui.Spacer(1));
  }
  /**
   * Update the question text and options from streaming partial args.
   * Called during tool input delta streaming.
   */
  updateArgs(args) {
    if (this.answered) return;
    if (!args || typeof args !== "object") return;
    const a = args;
    if (typeof a.question === "string") {
      this.borderedBox.questionLines = a.question.split("\n");
    }
    if (Array.isArray(a.options)) {
      this.borderedBox.items = a.options.filter(
        (o) => typeof o === "object" && o !== null && typeof o.label === "string"
      );
    }
  }
  /**
   * Activate the interactive elements (SelectList or Input) and wire up callbacks.
   * Called by handleAskQuestion when the question event fires after streaming.
   */
  activate(options) {
    if (this.answered) return;
    this.onSubmit = options.onSubmit;
    this.onCancel = options.onCancel;
    this.isNegativeAnswer = options.isNegativeAnswer;
    this.allowEmptyInput = Boolean(options.allowEmptyInput);
    this.borderedBox.questionLines = options.question.split("\n");
    this.borderedBox.items = options.options || [];
    let hintText;
    if (options.options && options.options.length > 0) {
      hintText = "\u2191\u2193 to navigate \xB7 Enter to select \xB7 Esc to skip";
      this.buildSelectMode(options.options);
    } else {
      hintText = "Enter to submit \xB7 Esc to skip";
      this.buildInputMode();
    }
    this.borderedBox.setInteractive(this.selectList, this.input, hintText);
  }
  static CUSTOM_RESPONSE_VALUE = "__custom_response__";
  buildSelectMode(opts) {
    const items = opts.map((opt) => ({
      value: opt.label,
      label: opt.description ? `  ${opt.label}  ${chunkWOKNPWRC_cjs.theme.fg("dim", opt.description)}` : `  ${opt.label}`
    }));
    items.push({
      value: _AskQuestionInlineComponent.CUSTOM_RESPONSE_VALUE,
      label: `  ${chunkWOKNPWRC_cjs.theme.fg("dim", "\u270E Custom response...")}`
    });
    this.selectList = new piTui.SelectList(items, Math.min(items.length, 8), chunkWOKNPWRC_cjs.getSelectListTheme());
    this.selectList.onSelect = (item) => {
      if (item.value === _AskQuestionInlineComponent.CUSTOM_RESPONSE_VALUE) {
        this.switchToCustomInput();
        return;
      }
      this.handleAnswer(item.value);
    };
    this.selectList.onCancel = () => {
      this.handleCancel();
    };
  }
  switchToCustomInput() {
    this.selectList = void 0;
    this.buildInputMode();
    this.borderedBox.items = [];
    this.borderedBox.setInteractive(void 0, this.input, "Enter to submit \xB7 Esc to skip");
  }
  buildInputMode() {
    this.input = new piTui.Input();
    this.input.onSubmit = (value) => {
      const trimmed = value.trim();
      if (trimmed || this.allowEmptyInput) {
        this.handleAnswer(trimmed);
      }
    };
    this.input.keybindings = piTui.getEditorKeybindings();
  }
  handleAnswer(answer) {
    if (this.answered) return;
    this.answered = true;
    const isNegative = this.isNegativeAnswer?.(answer) ?? false;
    this.borderedBox.setAnswered(answer, isNegative);
    this.onSubmit?.(answer);
  }
  handleCancel() {
    if (this.answered) return;
    this.answered = true;
    this.borderedBox.setCancelled();
    this.onCancel?.();
  }
  handleInput(data) {
    if (this.answered) return;
    if (this.selectList) {
      this.selectList.handleInput(data);
    } else if (this.input) {
      const kb = piTui.getEditorKeybindings();
      if (kb.matches(data, "selectCancel")) {
        this.handleCancel();
        return;
      }
      this.input.handleInput(data);
    }
  }
};

// src/onboarding/onboarding-inline.ts
var OnboardingInlineComponent = class extends piTui.Container {
  tui;
  options;
  // Track which step we're on (written by renderStep for debugging / future use)
  currentStep = "welcome";
  stepBox;
  selectList;
  activeInlineQuestion;
  _finished = false;
  // Collected choices
  loginRequested = false;
  loginProvider;
  selectedModePack;
  selectedOmPack;
  selectedYolo = true;
  // Focusable
  _focused = false;
  get focused() {
    return this._focused;
  }
  set focused(value) {
    this._focused = value;
  }
  constructor(options) {
    super();
    this.tui = options.tui;
    this.options = options;
    const prevModePack = options.previous?.modePackId ? options.modePacks.find((p) => p.id === options.previous.modePackId) : void 0;
    this.selectedModePack = prevModePack ?? options.modePacks[0];
    const prevOmPack = options.previous?.omPackId ? options.omPacks.find((p) => p.id === options.previous.omPackId) : void 0;
    this.selectedOmPack = prevOmPack ?? options.omPacks[0] ?? { id: "none", name: "None available", description: "", modelId: "" };
    if (options.previous?.yolo != null) {
      this.selectedYolo = options.previous.yolo;
    }
    this.renderStep("welcome");
  }
  get finished() {
    return this._finished;
  }
  /** Programmatically cancel the wizard (e.g. on Ctrl+C). */
  cancel() {
    if (this._finished) return;
    this._finished = true;
    this.collapseStep("Setup skipped \u2014 run /setup anytime to configure");
    this.options.onCancel();
  }
  /** Refresh the available mode packs (e.g. after a login grants new provider access). */
  updateModePacks(packs) {
    this.options.modePacks = packs;
    if (!this.selectedModePack || !packs.find((p) => p.id === this.selectedModePack.id)) {
      this.selectedModePack = packs[0];
    }
  }
  /** Refresh the available OM packs (e.g. after a login grants new provider access). */
  updateOmPacks(packs) {
    this.options.omPacks = packs;
    if (!this.selectedOmPack || !packs.find((p) => p.id === this.selectedOmPack.id)) {
      this.selectedOmPack = packs[0];
    }
  }
  /** Update whether the user has any provider access (e.g. after a login). */
  updateHasProviderAccess(hasAccess) {
    this.options.hasProviderAccess = hasAccess;
  }
  // ---------------------------------------------------------------------------
  // Rendering helpers
  // ---------------------------------------------------------------------------
  clearStep() {
    if (this.stepBox) {
      this.removeChild(this.stepBox);
    }
    this.selectList = void 0;
  }
  renderStep(step) {
    this.currentStep = step;
    switch (step) {
      case "welcome":
        return this.renderWelcome();
      case "auth":
        return this.renderAuth();
      case "modePack":
        return this.renderModePack();
      case "omPack":
        return this.renderOmPack();
      case "yolo":
        return this.renderYolo();
      case "done":
        return this.renderDone();
    }
  }
  stepCount = 0;
  makeBox() {
    this.clearStep();
    this.stepBox = new piTui.Box(chunkWOKNPWRC_cjs.BOX_INDENT, 1, (text) => chunkWOKNPWRC_cjs.theme.bg("toolPendingBg", text));
    if (this.stepCount > 0) {
      this.addChild(new piTui.Spacer(1));
    }
    this.stepCount++;
    this.addChild(this.stepBox);
    return this.stepBox;
  }
  // ---------------------------------------------------------------------------
  // Step: Welcome
  // ---------------------------------------------------------------------------
  renderWelcome() {
    const box = this.makeBox();
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "\u{1F44B} Welcome to Mastra Code")), 0, 0));
    box.addChild(new piTui.Spacer(1));
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", "Let's configure your models and preferences."), 0, 0));
    box.addChild(new piTui.Text(chalk8__default.default.white("You can re-run this anytime with /setup."), 0, 0));
    box.addChild(new piTui.Spacer(1));
    const items = [
      { value: "continue", label: `  ${chunkWOKNPWRC_cjs.theme.fg("success", "Continue")}` },
      { value: "skip", label: `  ${chunkWOKNPWRC_cjs.theme.fg("dim", "Skip")}` }
    ];
    this.selectList = new piTui.SelectList(items, items.length, chunkWOKNPWRC_cjs.getSelectListTheme());
    this.selectList.onSelect = (item) => {
      if (item.value === "continue") {
        this.collapseStep("Welcome");
        this.renderStep("auth");
      } else {
        this._finished = true;
        this.collapseStep("Setup skipped \u2014 run /setup anytime to configure");
        this.options.onCancel();
      }
    };
    this.selectList.onCancel = () => {
      this._finished = true;
      this.collapseStep("Setup skipped \u2014 run /setup anytime to configure");
      this.options.onCancel();
    };
    box.addChild(this.selectList);
  }
  // ---------------------------------------------------------------------------
  // Step: Auth
  // ---------------------------------------------------------------------------
  renderAuth() {
    const box = this.makeBox();
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "\u{1F511} Authentication")), 0, 0));
    box.addChild(new piTui.Spacer(1));
    const providers = this.options.authProviders;
    if (providers.length === 0) {
      box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "No OAuth providers available. Skipping."), 0, 0));
      setTimeout(() => this.renderStep("modePack"), 100);
      return;
    }
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", "Log in with an AI provider to use your subscription,"), 0, 0));
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", "or skip if you have API keys configured as environment variables."), 0, 0));
    box.addChild(new piTui.Spacer(1));
    const items = providers.map((p) => ({
      value: p.value,
      label: p.loggedIn ? `  ${p.label}  ${chunkWOKNPWRC_cjs.theme.fg("success", "\u2713 logged in")}` : `  ${p.label}`
    }));
    items.push({
      value: "__skip",
      label: `  ${chunkWOKNPWRC_cjs.theme.fg("dim", "Skip (use API keys or configure later with /login)")}`
    });
    this.selectList = new piTui.SelectList(items, Math.min(items.length, 8), chunkWOKNPWRC_cjs.getSelectListTheme());
    this.selectList.onSelect = (item) => {
      if (item.value === "__skip") {
        this.renderStep("modePack");
      } else {
        this.loginRequested = true;
        this.loginProvider = item.value;
        this.options.onLogin(item.value, () => {
          this.renderStep("modePack");
        });
      }
    };
    this.selectList.onCancel = () => {
      this.renderStep("modePack");
    };
    box.addChild(this.selectList);
    box.addChild(new piTui.Spacer(1));
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "\u2191\u2193 navigate \xB7 Enter select \xB7 Esc skip"), 0, 0));
  }
  // ---------------------------------------------------------------------------
  // Step: Mode pack
  // ---------------------------------------------------------------------------
  /** Text component showing details for the currently highlighted mode pack. */
  modePackDetail;
  renderModePack() {
    const packs = this.options.modePacks;
    const box = this.makeBox();
    if (!this.options.hasProviderAccess) {
      box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("warning", "No model providers configured")), 0, 0));
      box.addChild(new piTui.Spacer(1));
      box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", "To use Mastra Code you need at least one API key or OAuth login"), 0, 0));
      box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", "for Anthropic, OpenAI, or another supported provider."), 0, 0));
      box.addChild(new piTui.Spacer(1));
      box.addChild(
        new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "See https://mastra.ai/models for supported providers and API key env vars."), 0, 0)
      );
      box.addChild(new piTui.Spacer(1));
      box.addChild(
        new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "Set an API key and restart, or run /login to authenticate via OAuth."), 0, 0)
      );
      box.addChild(new piTui.Spacer(1));
    }
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "Model Packs")), 0, 0));
    box.addChild(new piTui.Spacer(1));
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", "Choose default models for each mode (build / plan / fast):"), 0, 0));
    box.addChild(new piTui.Spacer(1));
    const prevId = this.options.previous?.modePackId ?? null;
    const items = packs.map((p) => ({
      value: p.id,
      label: `  ${p.name}  ${chunkWOKNPWRC_cjs.theme.fg("dim", p.description)}${p.id === prevId ? chunkWOKNPWRC_cjs.theme.fg("dim", " (current)") : ""}`
    }));
    this.selectList = new piTui.SelectList(items, items.length, chunkWOKNPWRC_cjs.getSelectListTheme());
    const prevIdx = prevId ? packs.findIndex((p) => p.id === prevId) : -1;
    if (prevIdx > 0) this.selectList.setSelectedIndex(prevIdx);
    this.selectList.onSelect = (item) => {
      const pack = packs.find((p) => p.id === item.value) ?? packs[0];
      if (pack.id === "custom") {
        this.runCustomPackFlow();
      } else {
        this.selectedModePack = pack;
        this.collapseStep(`Model pack \u2192 ${chunkWOKNPWRC_cjs.theme.bold(this.selectedModePack.name)}`);
        this.renderStep("omPack");
      }
    };
    this.selectList.onCancel = () => {
      this.collapseStep(`Model pack \u2192 ${chunkWOKNPWRC_cjs.theme.bold(this.selectedModePack.name)} (default)`);
      this.renderStep("omPack");
    };
    this.selectList.onSelectionChange = (item) => {
      this.updateModePackDetail(packs, item.value);
    };
    box.addChild(this.selectList);
    box.addChild(new piTui.Spacer(1));
    this.modePackDetail = new piTui.Text("", 0, 0);
    box.addChild(this.modePackDetail);
    const initialId = prevIdx > 0 ? packs[prevIdx].id : packs[0].id;
    this.updateModePackDetail(packs, initialId);
    box.addChild(new piTui.Spacer(1));
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "\u2191\u2193 navigate \xB7 Enter select \xB7 Esc use default"), 0, 0));
  }
  updateModePackDetail(packs, highlightedId) {
    const pack = packs.find((p) => p.id === highlightedId);
    if (!pack || !this.modePackDetail) return;
    if (pack.id === "custom") {
      this.modePackDetail.setText(chunkWOKNPWRC_cjs.theme.fg("dim", "  You'll pick a model for each mode in the next steps."));
    } else {
      const detail = [
        `  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.blue)("plan")}  \u2192 ${chunkWOKNPWRC_cjs.theme.fg("text", pack.models.plan)}`,
        `  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.purple)("build")} \u2192 ${chunkWOKNPWRC_cjs.theme.fg("text", pack.models.build)}`,
        `  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.green)("fast")}  \u2192 ${chunkWOKNPWRC_cjs.theme.fg("text", pack.models.fast)}`
      ].join("\n");
      this.modePackDetail.setText(detail);
    }
    this.tui.requestRender();
  }
  // ---------------------------------------------------------------------------
  // Custom pack flow — sequential model selection for each mode
  // ---------------------------------------------------------------------------
  async promptCustomPackName() {
    return new Promise((resolve3) => {
      const question = new AskQuestionInlineComponent(
        {
          question: "Name this custom pack",
          formatResult: (answer) => `Custom pack: ${answer}`,
          onSubmit: (answer) => {
            this.activeInlineQuestion = void 0;
            const trimmed = answer.trim();
            resolve3(trimmed.length > 0 ? trimmed : null);
          },
          onCancel: () => {
            this.activeInlineQuestion = void 0;
            resolve3(null);
          }
        },
        this.tui
      );
      this.activeInlineQuestion = question;
      this.stepBox.addChild(new piTui.Spacer(1));
      this.stepBox.addChild(question);
      this.tui.requestRender();
    });
  }
  async runCustomPackFlow() {
    this.selectList = void 0;
    const packName = await this.promptCustomPackName();
    if (!packName) {
      const fallback = this.options.modePacks.find((p) => p.id !== "custom") ?? this.options.modePacks[0];
      this.selectedModePack = fallback;
      this.collapseStep(`Model pack \u2192 ${chunkWOKNPWRC_cjs.theme.bold(this.selectedModePack.name)} (cancelled custom)`);
      this.renderStep("omPack");
      this.tui.requestRender();
      return;
    }
    this.collapseStep(`Model pack \u2192 Custom (${packName})`);
    const modes = [
      { id: "plan", label: "plan", color: chunkWOKNPWRC_cjs.mastra.purple },
      { id: "build", label: "build", color: chunkWOKNPWRC_cjs.mastra.green },
      { id: "fast", label: "fast", color: chunkWOKNPWRC_cjs.mastra.orange }
    ];
    const models = { build: "", plan: "", fast: "" };
    for (const mode of modes) {
      const title = `Select model for ${mode.label} mode`;
      const modelId = await this.options.onSelectModel(title, mode.color);
      if (!modelId) {
        const fallback = this.options.modePacks.find((p) => p.id !== "custom") ?? this.options.modePacks[0];
        this.selectedModePack = fallback;
        this.collapseStep(`Model pack \u2192 ${chunkWOKNPWRC_cjs.theme.bold(this.selectedModePack.name)} (cancelled custom)`);
        this.renderStep("omPack");
        this.tui.requestRender();
        return;
      }
      models[mode.id] = modelId;
    }
    this.selectedModePack = {
      id: `custom:${packName}`,
      name: packName,
      description: "Saved custom pack",
      models: { build: models.build, plan: models.plan, fast: models.fast }
    };
    this.collapseStep(
      `Model pack \u2192 ${chunkWOKNPWRC_cjs.theme.bold(packName)}  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.blue)("plan")} ${models.plan}  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.purple)("build")} ${models.build}  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.green)("fast")} ${models.fast}`
    );
    this.renderStep("omPack");
    this.tui.requestRender();
  }
  // ---------------------------------------------------------------------------
  // Step: OM pack
  // ---------------------------------------------------------------------------
  renderOmPack() {
    const omPacks = this.options.omPacks;
    if (omPacks.length === 0) {
      this.renderStep("yolo");
      return;
    }
    const box = this.makeBox();
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "\u{1F9E0} Observational Memory")), 0, 0));
    box.addChild(new piTui.Spacer(1));
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", "Choose the model for observational memory:"), 0, 0));
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "https://mastra.ai/docs/memory/observational-memory"), 0, 0));
    box.addChild(new piTui.Spacer(1));
    const prevOmId = this.options.previous?.omPackId ?? null;
    const items = omPacks.map((p) => ({
      value: p.id,
      label: `  ${p.name}  ${chunkWOKNPWRC_cjs.theme.fg("dim", p.description)}${p.id === prevOmId ? chunkWOKNPWRC_cjs.theme.fg("dim", " (current)") : ""}`
    }));
    this.selectList = new piTui.SelectList(items, items.length, chunkWOKNPWRC_cjs.getSelectListTheme());
    const prevOmIdx = prevOmId ? omPacks.findIndex((p) => p.id === prevOmId) : -1;
    if (prevOmIdx > 0) this.selectList.setSelectedIndex(prevOmIdx);
    this.selectList.onSelect = (item) => {
      const pack = omPacks.find((p) => p.id === item.value) ?? omPacks[0];
      if (pack.id === "custom") {
        this.runCustomOmFlow();
      } else {
        this.selectedOmPack = pack;
        this.collapseStep(`Observational memory \u2192 ${chunkWOKNPWRC_cjs.theme.bold(this.selectedOmPack.name)}`);
        this.renderStep("yolo");
      }
    };
    this.selectList.onCancel = () => {
      this.collapseStep(`Observational memory \u2192 ${chunkWOKNPWRC_cjs.theme.bold(this.selectedOmPack.name)} (default)`);
      this.renderStep("yolo");
    };
    box.addChild(this.selectList);
    box.addChild(new piTui.Spacer(1));
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "\u2191\u2193 navigate \xB7 Enter select \xB7 Esc use default"), 0, 0));
  }
  async runCustomOmFlow() {
    this.selectList = void 0;
    this.collapseStep(`Observational memory \u2192 ${chunkWOKNPWRC_cjs.theme.bold("Custom")}`);
    const modelId = await this.options.onSelectModel("Select model for observational memory");
    if (modelId) {
      this.selectedOmPack = { id: "custom", name: "Custom", description: "User-selected model", modelId };
      this.collapseStep(`Observational memory \u2192 ${chunkWOKNPWRC_cjs.theme.bold("Custom")}  ${modelId}`);
    } else {
      const fallback = this.options.omPacks.find((p) => p.id !== "custom");
      if (fallback) {
        this.selectedOmPack = fallback;
        this.collapseStep(`Observational memory \u2192 ${chunkWOKNPWRC_cjs.theme.bold(fallback.name)} (cancelled custom)`);
      } else {
        this.collapseStep(`Observational memory \u2192 ${chunkWOKNPWRC_cjs.theme.bold("Custom")} (cancelled)`);
      }
    }
    this.renderStep("yolo");
    this.tui.requestRender();
  }
  // ---------------------------------------------------------------------------
  // Step: YOLO mode
  // ---------------------------------------------------------------------------
  renderYolo() {
    const box = this.makeBox();
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "\u26A1 Tool Approval")), 0, 0));
    box.addChild(new piTui.Spacer(1));
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", "YOLO mode auto-approves all tool calls (edits, commands, etc)."), 0, 0));
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", "You can toggle this anytime with Ctrl+Y or /yolo."), 0, 0));
    box.addChild(new piTui.Spacer(1));
    const prevYolo = this.options.previous?.yolo ?? null;
    const currentOn = prevYolo === true ? chunkWOKNPWRC_cjs.theme.fg("dim", " (current)") : "";
    const currentOff = prevYolo === false ? chunkWOKNPWRC_cjs.theme.fg("dim", " (current)") : "";
    const items = [
      {
        value: "on",
        label: `  ${chunkWOKNPWRC_cjs.theme.fg("success", "Enable YOLO")}  ${chunkWOKNPWRC_cjs.theme.fg("dim", "(recommended \u2014 auto-approve everything)")}${currentOn}`
      },
      {
        value: "off",
        label: `  ${chunkWOKNPWRC_cjs.theme.fg("warning", "Disable YOLO")}  ${chunkWOKNPWRC_cjs.theme.fg("dim", "(ask before each tool call)")}${currentOff}`
      }
    ];
    this.selectList = new piTui.SelectList(items, items.length, chunkWOKNPWRC_cjs.getSelectListTheme());
    if (prevYolo === false) this.selectList.setSelectedIndex(1);
    this.selectList.onSelect = (item) => {
      this.selectedYolo = item.value === "on";
      const label = this.selectedYolo ? "enabled" : "disabled";
      this.collapseStep(`YOLO mode \u2192 ${chunkWOKNPWRC_cjs.theme.bold(label)}`);
      this.renderStep("done");
    };
    this.selectList.onCancel = () => {
      this.collapseStep(`YOLO mode \u2192 ${chunkWOKNPWRC_cjs.theme.bold("enabled")} (default)`);
      this.renderStep("done");
    };
    box.addChild(this.selectList);
    box.addChild(new piTui.Spacer(1));
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "\u2191\u2193 navigate \xB7 Enter select \xB7 Esc use default"), 0, 0));
  }
  // ---------------------------------------------------------------------------
  // Step: Done
  // ---------------------------------------------------------------------------
  renderDone() {
    this._finished = true;
    const box = this.makeBox();
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("success", "\u2713 Setup complete!")), 0, 0));
    box.addChild(new piTui.Spacer(1));
    const lines = [
      `Model pack: ${chunkWOKNPWRC_cjs.theme.bold(this.selectedModePack.name)}`,
      `  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.blue)("plan")}  \u2192 ${this.selectedModePack.models.plan}`,
      `  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.purple)("build")} \u2192 ${this.selectedModePack.models.build}`,
      `  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.green)("fast")}  \u2192 ${this.selectedModePack.models.fast}`,
      `Observational memory: ${chunkWOKNPWRC_cjs.theme.bold(this.selectedOmPack.name)}`,
      `YOLO mode: ${chunkWOKNPWRC_cjs.theme.bold(this.selectedYolo ? "enabled" : "disabled")}`
    ];
    for (const line of lines) {
      box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", line), 0, 0));
    }
    box.addChild(new piTui.Spacer(1));
    box.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "Type a message to start coding, or use /help for commands."), 0, 0));
    this.options.onComplete({
      modePack: this.selectedModePack,
      omPack: this.selectedOmPack,
      yolo: this.selectedYolo,
      loginRequested: this.loginRequested,
      loginProvider: this.loginProvider
    });
  }
  // ---------------------------------------------------------------------------
  // Collapse a completed step into a single summary line
  // ---------------------------------------------------------------------------
  collapseStep(summary) {
    if (!this.stepBox) return;
    this.stepBox.clear();
    this.stepBox.setBgFn((text) => chunkWOKNPWRC_cjs.theme.bg("toolSuccessBg", text));
    this.stepBox.addChild(new piTui.Text(`${chunkWOKNPWRC_cjs.theme.fg("success", "\u2713")} ${chunkWOKNPWRC_cjs.theme.fg("text", summary)}`, 0, 0));
    this.selectList = void 0;
    this.activeInlineQuestion = void 0;
  }
  // ---------------------------------------------------------------------------
  // Input handling
  // ---------------------------------------------------------------------------
  handleInput(data) {
    if (this._finished) return;
    if (this.activeInlineQuestion) {
      this.activeInlineQuestion.handleInput(data);
      return;
    }
    if (this.selectList) {
      this.selectList.handleInput(data);
      return;
    }
  }
};
var PACKAGE_NAME = "mastracode";
var NPM_REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
var FETCH_TIMEOUT_MS = 5e3;
function matchPM(str) {
  if (/pnpm/i.test(str)) return "pnpm";
  if (/\byarn\b/i.test(str)) return "yarn";
  if (/\bbun\b/i.test(str)) return "bun";
  if (/\bnpm\b/i.test(str)) return "npm";
  return null;
}
async function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent;
  if (userAgent) {
    const pm = matchPM(userAgent);
    if (pm) return pm;
  }
  const execPath = process.env.npm_execpath;
  if (execPath) {
    const pm = matchPM(execPath);
    if (pm) return pm;
  }
  const nodePath = process.env.NODE_PATH;
  if (nodePath) {
    if (/[/\\]\.pnpm[/\\]/.test(nodePath) || /[/\\]pnpm[/\\]/.test(nodePath)) return "pnpm";
    if (/[/\\]\.yarn[/\\]/.test(nodePath)) return "yarn";
    if (/[/\\]\.bun[/\\]/.test(nodePath)) return "bun";
  }
  try {
    const scriptPath = fs2.realpathSync(process.argv[1] ?? "");
    if (/[/\\]\.?pnpm[/\\]/.test(scriptPath)) return "pnpm";
    if (/[/\\]\.?yarn[/\\]/.test(scriptPath)) return "yarn";
    if (/[/\\]\.?bun[/\\]/.test(scriptPath)) return "bun";
  } catch {
  }
  const pnpmResult = await new Promise((resolve3) => {
    child_process.execFile("pnpm", ["list", "-g", "--depth=0", PACKAGE_NAME], { timeout: 3e3 }, (error, stdout) => {
      resolve3(!error && stdout.includes(PACKAGE_NAME));
    });
  });
  if (pnpmResult) return "pnpm";
  return "npm";
}
function getInstallCommand(pm, version) {
  const pkg = version ? `${PACKAGE_NAME}@${version}` : `${PACKAGE_NAME}@latest`;
  switch (pm) {
    case "pnpm":
      return `pnpm add -g ${pkg}`;
    case "yarn":
      return `yarn global add ${pkg}`;
    case "bun":
      return `bun add -g ${pkg}`;
    default:
      return `npm install -g ${pkg}`;
  }
}
function getCurrentVersion() {
  {
    return "0.1.0";
  }
}
async function fetchLatestVersion() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(NPM_REGISTRY_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data.version ?? null;
  } catch {
    return null;
  }
}
function isNewerVersion(current, latest) {
  const parse = (v) => v.replace(/^v/, "").split("-")[0].split(".").map((s) => {
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  });
  const [cMajor = 0, cMinor = 0, cPatch = 0] = parse(current);
  const [lMajor = 0, lMinor = 0, lPatch = 0] = parse(latest);
  if (lMajor !== cMajor) return lMajor > cMajor;
  if (lMinor !== cMinor) return lMinor > cMinor;
  return lPatch > cPatch;
}
function runUpdate(pm, targetVersion) {
  const args = buildInstallArgs(pm, targetVersion);
  return new Promise((resolve3) => {
    child_process.execFile(pm, args, { timeout: 6e4 }, (error) => {
      resolve3(!error);
    });
  });
}
function buildInstallArgs(pm, version) {
  const pkg = `${PACKAGE_NAME}@${version}`;
  switch (pm) {
    case "pnpm":
      return ["add", "-g", pkg];
    case "yarn":
      return ["global", "add", pkg];
    case "bun":
      return ["add", "-g", pkg];
    default:
      return ["install", "-g", pkg];
  }
}
async function processSlashCommand(command, args, workingDir) {
  const { result: withArgs, shouldAppendRawArgs } = replaceArguments(command.template, args);
  let result = withArgs;
  result = await replaceShellOutput(result, workingDir);
  result = await replaceFileReferences(result, workingDir);
  if (shouldAppendRawArgs) {
    result = result.trimEnd() + `

ARGUMENTS: ${args.join(" ")}`;
  }
  return result;
}
function replaceArguments(template, args) {
  let result = template;
  const hasArgumentsVar = /\$ARGUMENTS/.test(template);
  const hasPositionalVar = /\$[1-9]\d*/.test(template);
  result = result.replace(/\$ARGUMENTS/g, args.join(" "));
  args.forEach((arg, index) => {
    const pattern = new RegExp(`\\$${index + 1}`, "g");
    result = result.replace(pattern, arg);
  });
  result = result.replace(/\$[1-9]\d*/g, "");
  return {
    result,
    shouldAppendRawArgs: !hasArgumentsVar && !hasPositionalVar && args.length > 0
  };
}
async function replaceShellOutput(template, workingDir) {
  const shellPattern = /!`([^`]+)`/g;
  const matches = [...template.matchAll(shellPattern)];
  let result = template;
  for (const match of matches) {
    const [fullMatch, command] = match;
    try {
      const output = child_process.execSync(command, {
        cwd: workingDir,
        encoding: "utf-8",
        timeout: 3e4,
        maxBuffer: 1024 * 1024
        // 1MB buffer
      });
      result = result.replace(fullMatch, output.trim());
    } catch (error) {
      console.error(`Error executing shell command "${command}":`, error);
      result = result.replace(fullMatch, `[Error: Failed to execute "${command}"]`);
    }
  }
  return result;
}
async function replaceFileReferences(template, workingDir) {
  const filePattern = /@([\w./-]+)/g;
  const matches = [...template.matchAll(filePattern)];
  let result = template;
  for (const match of matches) {
    const [fullMatch, filePath] = match;
    try {
      const fullPath = path6__namespace.resolve(workingDir, filePath);
      const content = await fs2.promises.readFile(fullPath, "utf-8");
      result = result.replace(fullMatch, content);
    } catch (error) {
      console.error(`Error reading file "${filePath}":`, error);
      result = result.replace(fullMatch, `[Error: Could not read "${filePath}"]`);
    }
  }
  return result;
}

// src/tui/components/help-overlay.ts
function getCommands(modes) {
  const cmds = [
    { key: "/new", description: "Start a new thread" },
    { key: "/threads", description: "Switch between threads" },
    { key: "/thread", description: "Show current thread info" },
    { key: "/thread:tag-dir", description: "Tag thread with current directory" },
    { key: "/name", description: "Rename current thread" },
    { key: "/resource", description: "Show/switch resource ID" },
    { key: "/skills", description: "List available skills" },
    { key: "/models", description: "Switch model pack" },
    { key: "/custom-providers", description: "Manage custom providers and models" },
    { key: "/subagents", description: "Configure subagent models" },
    { key: "/permissions", description: "Tool approval permissions" },
    { key: "/settings", description: "Notifications, YOLO, thinking" },
    { key: "/om", description: "Configure Observational Memory" },
    { key: "/review", description: "Review a GitHub pull request" },
    { key: "/report-issue", description: "Open or browse mastracode issues" },
    { key: "/cost", description: "Token usage and costs" },
    { key: "/diff", description: "Modified files or git diff" },
    { key: "/sandbox", description: "Manage sandbox allowed paths" },
    { key: "/hooks", description: "Show/reload configured hooks" },
    { key: "/mcp", description: "Show/reload MCP connections" },
    { key: "/login", description: "Login with OAuth provider" },
    { key: "/logout", description: "Logout from OAuth provider" },
    { key: "/setup", description: "Run the setup wizard" },
    { key: "/theme", description: "Switch color theme (auto/dark/light)" },
    { key: "/update", description: "Check for and install updates" }
  ];
  if (modes > 1) {
    cmds.push({ key: "/mode", description: "Switch or list modes" });
  }
  cmds.push({ key: "/exit", description: "Exit" }, { key: "/help", description: "Show this help" });
  return cmds;
}
function getShortcuts(modes) {
  const shortcuts = [
    { key: "Ctrl+C", description: "Interrupt / clear input" },
    { key: "Ctrl+C\xD72", description: "Exit (double-tap)" },
    { key: "Ctrl+D", description: "Exit (when editor empty)" },
    { key: "Enter", description: "Send message / queue follow-up" },
    { key: "Ctrl+T", description: "Toggle thinking blocks" },
    { key: "Ctrl+E", description: "Expand/collapse tool outputs" },
    { key: "Ctrl+Y", description: "Toggle YOLO mode" },
    { key: "Ctrl+Z", description: "Suspend process (fg to resume)" },
    { key: "Alt+Z", description: "Undo last clear" }
  ];
  if (modes > 1) {
    shortcuts.push({ key: "\u21E7+Tab", description: "Cycle agent modes" });
  }
  shortcuts.push({ key: "/", description: "Commands" }, { key: "!", description: "Shell" });
  return shortcuts;
}
function renderSection(title, entries) {
  const maxKeyLen = Math.max(...entries.map((e) => e.key.length));
  const lines = entries.map((e) => `  ${e.key.padEnd(maxKeyLen + 2)}${e.description}`).join("\n");
  return `${title}
${lines}`;
}
function buildHelpText(options) {
  const sections = [];
  sections.push(renderSection("Commands", getCommands(options.modes)));
  if (options.customSlashCommands.length > 0) {
    const customEntries = options.customSlashCommands.map((cmd) => ({
      key: `//${cmd.name}`,
      description: cmd.description || "No description"
    }));
    sections.push(renderSection("Custom Commands", customEntries));
  }
  sections.push(renderSection("Shell", [{ key: "!<cmd>", description: "Run a shell command" }]));
  sections.push(renderSection("Keyboard Shortcuts", getShortcuts(options.modes)));
  return sections.join("\n\n");
}

// src/tui/commands/help.ts
function handleHelpCommand(ctx) {
  const text = buildHelpText({
    modes: ctx.harness.listModes().length,
    customSlashCommands: ctx.customSlashCommands
  });
  ctx.showInfo(text);
}

// src/tui/commands/cost.ts
function handleCostCommand(ctx) {
  const formatNumber = (n) => n.toLocaleString();
  const ds = ctx.state.harness.getDisplayState();
  let omTokensText = "";
  if (ds.omProgress.observationTokens > 0) {
    omTokensText = `
  Memory:     ${formatNumber(ds.omProgress.observationTokens)} tokens`;
  }
  ctx.showInfo(`Token Usage (Current Thread):
  Input:      ${formatNumber(ds.tokenUsage.promptTokens)} tokens
  Output:     ${formatNumber(ds.tokenUsage.completionTokens)} tokens${omTokensText}
  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  Total:      ${formatNumber(ds.tokenUsage.totalTokens)} tokens
  
  Note: For cost estimates, check your provider's pricing page.`);
}

// src/tui/commands/yolo.ts
function handleYoloCommand(ctx) {
  const current = ctx.harness.getState().yolo === true;
  ctx.harness.setState({ yolo: !current });
  ctx.showInfo(!current ? "YOLO mode ON \u2014 tools auto-approved" : "YOLO mode OFF \u2014 tools require approval");
}
var BASE_THINKING_LEVELS = [
  { id: "off", label: "Off", providerValue: "none", description: "Reasoning disabled" },
  { id: "low", label: "Low", providerValue: "low", description: "Light reasoning" },
  { id: "medium", label: "Medium", providerValue: "medium", description: "Balanced reasoning" },
  { id: "high", label: "High", providerValue: "high", description: "Deep reasoning" },
  { id: "xhigh", label: "Very High", providerValue: "xhigh", description: "Maximum reasoning depth" }
];
function isOpenAIModel(modelId) {
  return modelId.startsWith("openai/");
}
function getThinkingLevelsForModel(modelId) {
  if (!isOpenAIModel(modelId)) {
    return [...BASE_THINKING_LEVELS];
  }
  return BASE_THINKING_LEVELS.map((level) => ({
    ...level,
    label: level.providerValue
  }));
}
var THINKING_LEVELS = getThinkingLevelsForModel("");
function getThinkingLevelForModel(modelId, levelId) {
  return getThinkingLevelsForModel(modelId).find((level) => level.id === levelId) ?? getThinkingLevelsForModel(modelId)[0];
}

// src/tui/commands/think.ts
function supportsThinking(modelId) {
  return modelId.startsWith("openai/");
}
function getThinkingStatusLine(modelId, levelId) {
  const level = getThinkingLevelForModel(modelId, levelId);
  return `Thinking: ${level.label}`;
}
function isThinkingLevelSetting(level) {
  return THINKING_LEVELS.some((option) => option.id === level);
}
function persistGlobalThinkingLevel(level) {
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  settings.preferences.thinkingLevel = level;
  chunkWOKNPWRC_cjs.saveSettings(settings);
}
function getModelNote(ctx) {
  const modelId = ctx.state.harness.getCurrentModelId() ?? "";
  if (!modelId) return "No model selected.";
  if (!supportsThinking(modelId)) {
    return `Warning: current model (${modelId}) may not support reasoning effort. Setting will be saved but may not take effect.`;
  }
  return null;
}
async function handleThinkCommand(ctx, args = []) {
  const currentLevel = ctx.harness.getState()?.thinkingLevel ?? "off";
  const modelId = ctx.state.harness.getCurrentModelId() ?? "";
  const thinkingLevels = getThinkingLevelsForModel(modelId);
  const arg = args[0]?.toLowerCase();
  if (arg === "status") {
    ctx.showInfo(getThinkingStatusLine(modelId, currentLevel));
    return;
  }
  if (arg) {
    const selected = thinkingLevels.find((l) => l.id === arg);
    if (!selected) {
      ctx.showInfo(
        `Invalid thinking level: ${arg}. Use one of: ${THINKING_LEVELS.map((l) => l.id).join(", ")} or 'status'.`
      );
      return;
    }
    const note = getModelNote(ctx);
    await ctx.harness.setState({ thinkingLevel: selected.id });
    persistGlobalThinkingLevel(selected.id);
    ctx.showInfo(getThinkingStatusLine(modelId, selected.id) + (note ? ` (${note})` : ""));
    return;
  }
  const items = thinkingLevels.map((l) => ({
    value: l.id,
    label: `  ${l.label}  ${chunkWOKNPWRC_cjs.theme.fg("dim", l.description)}${l.id === currentLevel ? chunkWOKNPWRC_cjs.theme.fg("dim", " (current)") : ""}`
  }));
  const modelNote = getModelNote(ctx);
  return new Promise((resolve3) => {
    const container = new piTui.Box(1, 1);
    container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "Thinking Level")), 0, 0));
    container.addChild(new piTui.Spacer(1));
    if (modelNote) {
      container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("warning", modelNote), 0, 0));
      container.addChild(new piTui.Spacer(1));
    }
    const selectList = new piTui.SelectList(items, items.length, chunkWOKNPWRC_cjs.getSelectListTheme());
    selectList.onSelect = async (item) => {
      ctx.state.activeInlineQuestion = void 0;
      const selectedLevel = item.value;
      if (!isThinkingLevelSetting(selectedLevel)) {
        collapseResult("cancelled");
        ctx.state.ui.requestRender();
        resolve3();
        return;
      }
      try {
        await ctx.harness.setState({ thinkingLevel: selectedLevel });
        persistGlobalThinkingLevel(selectedLevel);
        const selectedLabel = getThinkingLevelForModel(modelId, selectedLevel).label;
        collapseResult(
          `Thinking \u2192 ${chunkWOKNPWRC_cjs.theme.bold(selectedLevel === currentLevel ? `${selectedLabel} (unchanged)` : selectedLabel)}`
        );
      } catch {
        collapseResult("cancelled");
      } finally {
        ctx.state.ui.requestRender();
        resolve3();
      }
    };
    selectList.onCancel = () => {
      ctx.state.activeInlineQuestion = void 0;
      collapseResult("cancelled");
      ctx.state.ui.requestRender();
      resolve3();
    };
    container.addChild(selectList);
    container.addChild(new piTui.Spacer(1));
    container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "\u2191\u2193 navigate \xB7 Enter select \xB7 Esc cancel"), 0, 0));
    const currentIdx = thinkingLevels.findIndex((l) => l.id === currentLevel);
    if (currentIdx > 0) selectList.setSelectedIndex(currentIdx);
    const collapseResult = (result) => {
      container.clear();
      if (result === "cancelled") {
        container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", `${chunkWOKNPWRC_cjs.theme.fg("error", "\u2717")} Thinking level (cancelled)`), 0, 0));
      } else {
        container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", `${chunkWOKNPWRC_cjs.theme.fg("success", "\u2713")} ${result}`), 0, 0));
      }
    };
    const inputShim = {
      handleInput: (data) => {
        if (piTui.isKeyRelease(data)) return;
        selectList.handleInput(data);
      }
    };
    ctx.state.activeInlineQuestion = inputShim;
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.chatContainer.addChild(container);
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}

// src/tui/commands/permissions.ts
async function handlePermissionsCommand(ctx, args) {
  if (args[0] === "set" && args.length >= 3) {
    const category = args[1];
    const policy = args[2];
    const validCategories = ["read", "edit", "execute", "mcp"];
    const validPolicies = ["allow", "ask", "deny"];
    if (!validCategories.includes(category)) {
      ctx.showInfo(`Invalid category: ${category}. Must be one of: ${validCategories.join(", ")}`);
      return;
    }
    if (!validPolicies.includes(policy)) {
      ctx.showInfo(`Invalid policy: ${policy}. Must be one of: ${validPolicies.join(", ")}`);
      return;
    }
    ctx.harness.setPermissionForCategory({ category, policy });
    ctx.showInfo(`Set ${category} policy to: ${policy}`);
    return;
  }
  await showPermissions(ctx);
}
async function showPermissions(ctx) {
  const { TOOL_CATEGORIES: TOOL_CATEGORIES2, getToolsForCategory } = await import('./permissions-YLP5R74I.cjs');
  const rules = ctx.harness.getPermissionRules();
  const grants = ctx.harness.getSessionGrants();
  const isYolo = ctx.harness.getState().yolo === true;
  const lines = [];
  lines.push("Tool Approval Permissions");
  lines.push("\u2500".repeat(40));
  if (isYolo) {
    lines.push("");
    lines.push("\u26A1 YOLO mode is ON \u2014 all tools are auto-approved");
    lines.push("  Use /yolo to toggle off");
  }
  lines.push("");
  lines.push("Category Policies:");
  for (const [cat, meta] of Object.entries(TOOL_CATEGORIES2)) {
    const policy = rules.categories[cat] || "ask";
    const sessionGranted = grants.categories.includes(cat);
    const tools = getToolsForCategory(cat);
    const status = sessionGranted ? `${policy} (session: always allow)` : policy;
    lines.push(`  ${meta.label.padEnd(12)} ${status.padEnd(16)} tools: ${tools.join(", ")}`);
  }
  if (Object.keys(rules.tools).length > 0) {
    lines.push("");
    lines.push("Per-tool Overrides:");
    for (const [tool, policy] of Object.entries(rules.tools)) {
      lines.push(`  ${tool.padEnd(24)} ${policy}`);
    }
  }
  if (grants.categories.length > 0 || grants.tools.length > 0) {
    lines.push("");
    lines.push("Session Grants (reset on restart):");
    if (grants.categories.length > 0) {
      lines.push(`  Categories: ${grants.categories.join(", ")}`);
    }
    if (grants.tools.length > 0) {
      lines.push(`  Tools: ${grants.tools.join(", ")}`);
    }
  }
  lines.push("");
  lines.push("Commands:");
  lines.push("  /permissions set <category> <allow|ask|deny>");
  lines.push("  /yolo \u2014 toggle auto-approve all tools");
  ctx.showInfo(lines.join("\n"));
}

// src/tui/commands/name.ts
async function handleNameCommand(ctx, args) {
  const title = args.join(" ").trim();
  if (!title) {
    ctx.showInfo("Usage: /name <title>");
    return;
  }
  if (!ctx.harness.getCurrentThreadId()) {
    ctx.showInfo("No active thread. Send a message first.");
    return;
  }
  await ctx.harness.renameThread({ title });
  ctx.showInfo(`Thread renamed to: ${title}`);
}

// src/tui/commands/exit.ts
function handleExitCommand(ctx) {
  ctx.stop();
  process.exit(0);
}

// src/tui/commands/hooks.ts
function handleHooksCommand(ctx, args) {
  const hm = ctx.hookManager;
  if (!hm) {
    ctx.showInfo("Hooks system not initialized.");
    return;
  }
  const subcommand = args[0];
  if (subcommand === "reload") {
    hm.reload();
    ctx.showInfo("Hooks config reloaded.");
    return;
  }
  const paths = hm.getConfigPaths();
  if (!hm.hasHooks()) {
    ctx.showInfo(
      `No hooks configured.

Add hooks to:
  ${paths.project} (project)
  ${paths.global} (global)

Example hooks.json:
  {
    "PreToolUse": [{
      "type": "command",
      "command": "echo 'tool called'",
      "matcher": { "tool_name": "execute_command" }
    }]
  }`
    );
    return;
  }
  const hookConfig = hm.getConfig();
  const lines = [`Hooks Configuration:`];
  lines.push(`  Project: ${paths.project}`);
  lines.push(`  Global:  ${paths.global}`);
  lines.push("");
  const eventNames = ["PreToolUse", "PostToolUse", "Stop", "UserPromptSubmit", "SessionStart", "SessionEnd"];
  for (const event of eventNames) {
    const hooks = hookConfig[event];
    if (hooks && hooks.length > 0) {
      lines.push(`  ${event} (${hooks.length} hook${hooks.length > 1 ? "s" : ""}):`);
      for (const hook of hooks) {
        const matcherStr = hook.matcher?.tool_name ? ` [tool: ${hook.matcher.tool_name}]` : "";
        const desc = hook.description ? ` - ${hook.description}` : "";
        lines.push(`    ${hook.command}${matcherStr}${desc}`);
      }
    }
  }
  lines.push("");
  lines.push(`  /hooks reload - Reload config from disk`);
  ctx.showInfo(lines.join("\n"));
}
var CONNECTED_ACTIONS = [
  { label: "View tools", key: "tools" },
  { label: "View logs", key: "logs" },
  { label: "Reconnect", key: "reconnect" }
];
var FAILED_ACTIONS = [
  { label: "View error", key: "error" },
  { label: "View logs", key: "logs" },
  { label: "Reconnect", key: "reconnect" }
];
var CONNECTING_ACTIONS = [{ label: "Waiting for connection...", key: "none" }];
var McpSelectorComponent = class extends piTui.Box {
  listContainer;
  statuses;
  skipped;
  selectedIndex = 0;
  getStatusesCallback;
  onReloadAllCallback;
  onReconnectServerCallback;
  getServerLogsCallback;
  showInfoCallback;
  onCloseCallback;
  tui;
  pollTimer = null;
  // Sub-menu state
  subMenuOpen = false;
  subMenuIndex = 0;
  subMenuActions = [];
  // Detail view state (tool list / error display)
  _detailView = false;
  // Loading state during reload
  _reloading = false;
  // Focusable implementation
  _focused = false;
  get focused() {
    return this._focused;
  }
  set focused(value) {
    this._focused = value;
  }
  constructor(options) {
    super(2, 1, (text) => chunkWOKNPWRC_cjs.theme.bg("overlayBg", text));
    this.tui = options.tui;
    this.statuses = options.statuses;
    this.skipped = options.skipped;
    this.getStatusesCallback = options.getStatuses;
    this.onReloadAllCallback = options.onReloadAll;
    this.onReconnectServerCallback = options.onReconnectServer;
    this.getServerLogsCallback = options.getServerLogs;
    this.showInfoCallback = options.showInfo;
    this.onCloseCallback = options.onClose;
    this.buildUI();
    this.startPollingIfNeeded();
  }
  buildUI() {
    const titleText = chalk8__default.default.bgHex("#16c858").white.bold(" Manage MCP servers ");
    this.addChild(new piTui.Text(titleText, 0, 0));
    this.addChild(new piTui.Spacer(1));
    this.listContainer = new piTui.Container();
    this.addChild(this.listContainer);
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "\u2191\u2193 navigate \u2022 Enter select \u2022 r reload all \u2022 Esc close"), 0, 0));
    this.updateList();
  }
  getTotalItems() {
    return this.statuses.length + this.skipped.length;
  }
  updateList() {
    this.listContainer.clear();
    const total = this.getTotalItems();
    const countLabel = this._reloading ? `${total} server${total !== 1 ? "s" : ""} \u2014 reconnecting...` : `${total} server${total !== 1 ? "s" : ""}`;
    this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg(this._reloading ? "warning" : "muted", countLabel), 0, 0));
    this.listContainer.addChild(new piTui.Spacer(1));
    const totalItems = this.getTotalItems();
    for (let i = 0; i < this.statuses.length; i++) {
      const status = this.statuses[i];
      const isSelected = i === this.selectedIndex && !this.subMenuOpen;
      let icon;
      let stateText;
      if (this._reloading) {
        icon = chunkWOKNPWRC_cjs.theme.fg("warning", "\u27F3");
        stateText = chunkWOKNPWRC_cjs.theme.fg("warning", "reconnecting...");
      } else if (status.connecting) {
        icon = chunkWOKNPWRC_cjs.theme.fg("warning", "\u27F3");
        stateText = chunkWOKNPWRC_cjs.theme.fg("warning", "connecting...");
      } else if (status.connected) {
        icon = chunkWOKNPWRC_cjs.theme.fg("success", "\u2714");
        stateText = chunkWOKNPWRC_cjs.theme.fg("success", "connected");
      } else {
        icon = chunkWOKNPWRC_cjs.theme.fg("error", "\u2717");
        stateText = chunkWOKNPWRC_cjs.theme.fg("error", "failed");
      }
      const cursor = isSelected ? chunkWOKNPWRC_cjs.theme.fg("accent", "\u203A ") : "  ";
      const name = isSelected ? chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", status.name)) : status.name;
      const transport = chunkWOKNPWRC_cjs.theme.fg("muted", `[${status.transport}]`);
      const toolInfo = !this._reloading && status.toolCount > 0 ? chunkWOKNPWRC_cjs.theme.fg("muted", ` \xB7 ${status.toolCount} tools`) : "";
      this.listContainer.addChild(new piTui.Text(`${cursor}${icon} ${name} ${transport} ${stateText}${toolInfo}`, 0, 0));
      if (i === this.selectedIndex && this.subMenuOpen) {
        for (let j = 0; j < this.subMenuActions.length; j++) {
          const action = this.subMenuActions[j];
          const actionSelected = j === this.subMenuIndex;
          const actionCursor = actionSelected ? chunkWOKNPWRC_cjs.theme.fg("accent", "  \u203A ") : "    ";
          const actionText = actionSelected ? chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", action.label)) : chunkWOKNPWRC_cjs.theme.fg("muted", action.label);
          this.listContainer.addChild(new piTui.Text(`${actionCursor}${actionText}`, 0, 0));
        }
      }
    }
    if (this.skipped.length > 0) {
      this.listContainer.addChild(new piTui.Spacer(1));
      this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "Skipped:"), 0, 0));
      for (let i = 0; i < this.skipped.length; i++) {
        const s = this.skipped[i];
        const idx = this.statuses.length + i;
        const isSelected = idx === this.selectedIndex && !this.subMenuOpen;
        const cursor = isSelected ? chunkWOKNPWRC_cjs.theme.fg("accent", "\u203A ") : "  ";
        const name = isSelected ? chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", s.name)) : s.name;
        this.listContainer.addChild(
          new piTui.Text(`${cursor}${chunkWOKNPWRC_cjs.theme.fg("warning", "\u2298")} ${name} \u2014 ${chunkWOKNPWRC_cjs.theme.fg("muted", s.reason)}`, 0, 0)
        );
      }
    }
    if (totalItems === 0) {
      this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "No MCP servers configured"), 0, 0));
    }
    this.tui.requestRender();
  }
  startPollingIfNeeded() {
    if (this.pollTimer) return;
    const hasConnecting = this.statuses.some((s) => s.connecting);
    if (!hasConnecting) return;
    this.pollTimer = setInterval(() => {
      if (this._detailView || this._reloading) return;
      const fresh = this.getStatusesCallback();
      this.statuses = fresh.statuses;
      this.skipped = fresh.skipped;
      const total = this.getTotalItems();
      if (this.selectedIndex >= total) {
        this.selectedIndex = Math.max(0, total - 1);
      }
      this.updateList();
      if (!this.statuses.some((s) => s.connecting)) {
        this.stopPolling();
      }
    }, 500);
  }
  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
  /** Clean up resources when component is removed. */
  dispose() {
    this.stopPolling();
  }
  handleInput(data) {
    const kb = piTui.getEditorKeybindings();
    if (this._reloading) {
      if (kb.matches(data, "selectCancel")) {
        this.onCloseCallback();
      }
      return;
    }
    const totalItems = this.getTotalItems();
    if (this._detailView) {
      if (kb.matches(data, "selectCancel")) {
        this._detailView = false;
        this.updateList();
      }
      return;
    }
    if (this.subMenuOpen) {
      this.handleSubMenuInput(data, kb);
      return;
    }
    if (kb.matches(data, "selectUp")) {
      if (totalItems === 0) return;
      this.selectedIndex = this.selectedIndex === 0 ? totalItems - 1 : this.selectedIndex - 1;
      this.updateList();
    } else if (kb.matches(data, "selectDown")) {
      if (totalItems === 0) return;
      this.selectedIndex = this.selectedIndex === totalItems - 1 ? 0 : this.selectedIndex + 1;
      this.updateList();
    } else if (kb.matches(data, "selectConfirm")) {
      if (this.selectedIndex < this.statuses.length) {
        this.openSubMenu();
      }
    } else if (data === "r") {
      this.doReloadAll();
    } else if (kb.matches(data, "selectCancel")) {
      this.stopPolling();
      this.onCloseCallback();
    }
  }
  openSubMenu() {
    const status = this.statuses[this.selectedIndex];
    if (!status) return;
    if (status.connecting) {
      this.subMenuActions = CONNECTING_ACTIONS;
    } else if (status.connected) {
      this.subMenuActions = CONNECTED_ACTIONS;
    } else {
      this.subMenuActions = FAILED_ACTIONS;
    }
    this.subMenuOpen = true;
    this.subMenuIndex = 0;
    this.updateList();
  }
  handleSubMenuInput(data, kb) {
    if (kb.matches(data, "selectUp")) {
      this.subMenuIndex = this.subMenuIndex === 0 ? this.subMenuActions.length - 1 : this.subMenuIndex - 1;
      this.updateList();
    } else if (kb.matches(data, "selectDown")) {
      this.subMenuIndex = this.subMenuIndex === this.subMenuActions.length - 1 ? 0 : this.subMenuIndex + 1;
      this.updateList();
    } else if (kb.matches(data, "selectConfirm")) {
      const action = this.subMenuActions[this.subMenuIndex];
      if (!action || action.key === "none") return;
      this.executeAction(action.key);
    } else if (kb.matches(data, "selectCancel")) {
      this.subMenuOpen = false;
      this.updateList();
    }
  }
  executeAction(actionKey) {
    const status = this.statuses[this.selectedIndex];
    if (!status) return;
    switch (actionKey) {
      case "tools": {
        this.subMenuOpen = false;
        this.showToolList(status);
        break;
      }
      case "error": {
        this.subMenuOpen = false;
        this.showError(status);
        break;
      }
      case "logs": {
        this.subMenuOpen = false;
        this.showLogs(status);
        break;
      }
      case "reconnect": {
        this.subMenuOpen = false;
        this.doReconnectServer(status);
        break;
      }
    }
  }
  doReloadAll() {
    this._reloading = true;
    this.updateList();
    this.onReloadAllCallback().then((result) => {
      this.statuses = result.statuses;
      this.skipped = result.skipped;
      const total = this.getTotalItems();
      if (this.selectedIndex >= total) {
        this.selectedIndex = Math.max(0, total - 1);
      }
      const connected = result.statuses.filter((s) => s.connected);
      const totalTools = connected.reduce((sum, s) => sum + s.toolCount, 0);
      this.showInfoCallback(`MCP: Reloaded. ${connected.length} server(s) connected, ${totalTools} tool(s).`);
      for (const s of result.statuses.filter((s2) => !s2.connected)) {
        this.showInfoCallback(`MCP: Failed to connect to "${s.name}": ${s.error ?? "Unknown error"}`);
      }
    }).catch(() => {
      this.showInfoCallback("MCP: Reload failed. Retrying may help.");
    }).finally(() => {
      this._reloading = false;
      this.updateList();
    });
  }
  doReconnectServer(status) {
    if (status.connecting) return;
    const name = status.name;
    const idx = this.statuses.findIndex((s) => s.name === name);
    if (idx >= 0) {
      this.statuses[idx] = {
        name,
        connected: false,
        connecting: true,
        toolCount: 0,
        toolNames: [],
        transport: status.transport
      };
    }
    this.updateList();
    this.onReconnectServerCallback(name).then((updated) => {
      if (this._reloading) return;
      const i = this.statuses.findIndex((s) => s.name === name);
      if (i >= 0) {
        this.statuses[i] = updated;
      }
      if (updated.connected) {
        this.showInfoCallback(`MCP: Reconnected "${name}" \u2014 ${updated.toolCount} tool(s)`);
      } else {
        this.showInfoCallback(`MCP: Failed to reconnect "${name}": ${updated.error ?? "Unknown error"}`);
      }
    }).catch((err) => {
      if (this._reloading) return;
      const errMsg = err instanceof Error ? err.message : String(err);
      const i = this.statuses.findIndex((s) => s.name === name);
      if (i >= 0) {
        this.statuses[i] = {
          name,
          connected: false,
          connecting: false,
          toolCount: 0,
          toolNames: [],
          transport: status.transport,
          error: errMsg
        };
      }
      this.showInfoCallback(`MCP: Failed to reconnect "${name}": ${errMsg}`);
    }).finally(() => {
      if (!this._reloading) {
        this.updateList();
      }
    });
  }
  showToolList(status) {
    this.listContainer.clear();
    this.listContainer.addChild(
      new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(`Tools for ${status.name}`) + chunkWOKNPWRC_cjs.theme.fg("muted", ` (${status.toolCount})`), 0, 0)
    );
    this.listContainer.addChild(new piTui.Spacer(1));
    if (status.toolNames.length === 0) {
      this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "No tools available"), 0, 0));
    } else {
      for (const toolName of status.toolNames) {
        this.listContainer.addChild(new piTui.Text(`  ${chunkWOKNPWRC_cjs.theme.fg("muted", "\u2013")} ${toolName}`, 0, 0));
      }
    }
    this.listContainer.addChild(new piTui.Spacer(1));
    this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "Press Esc to go back"), 0, 0));
    this._detailView = true;
    this.tui.requestRender();
  }
  showError(status) {
    this.listContainer.clear();
    this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(`Error for ${status.name}`), 0, 0));
    this.listContainer.addChild(new piTui.Spacer(1));
    this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("error", status.error ?? "Unknown error"), 0, 0));
    this.listContainer.addChild(new piTui.Spacer(1));
    this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "Press Esc to go back"), 0, 0));
    this._detailView = true;
    this.tui.requestRender();
  }
  showLogs(status) {
    this.listContainer.clear();
    const logs = this.getServerLogsCallback(status.name);
    this.listContainer.addChild(
      new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(`Logs for ${status.name}`) + chunkWOKNPWRC_cjs.theme.fg("muted", ` (${logs.length} lines)`), 0, 0)
    );
    this.listContainer.addChild(new piTui.Spacer(1));
    if (logs.length === 0) {
      const hint = status.transport === "http" ? "No logs available (HTTP servers do not produce stderr output)" : "No logs captured yet";
      this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", hint), 0, 0));
    } else {
      const tail = logs.slice(-50);
      if (logs.length > 50) {
        this.listContainer.addChild(
          new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", `  ... ${logs.length - 50} earlier lines omitted`), 0, 0)
        );
      }
      for (const line of tail) {
        this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", `  ${line}`), 0, 0));
      }
    }
    this.listContainer.addChild(new piTui.Spacer(1));
    this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "Press Esc to go back"), 0, 0));
    this._detailView = true;
    this.tui.requestRender();
  }
};

// src/utils/errors.ts
function summarizeErrorDetail(error) {
  if (error instanceof Error) {
    if (error.cause instanceof Error && error.cause.message) {
      return error.cause.message;
    }
    if (typeof error.cause === "string" && error.cause.trim().length > 0) {
      return error.cause;
    }
    if (error.message.trim().length > 0) {
      return error.message;
    }
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  if (error && typeof error === "object") {
    const errorObj = error;
    const candidates = [errorObj["message"], errorObj["cause"], errorObj["code"], errorObj["statusText"]];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate;
      }
    }
  }
  return void 0;
}
function extractRequestUrl(error) {
  if (!error || typeof error !== "object") {
    return void 0;
  }
  const candidates = [];
  const errorObj = error;
  candidates.push(errorObj["requestUrl"], errorObj["url"]);
  if (errorObj["cause"] && typeof errorObj["cause"] === "object") {
    const causeObj = errorObj["cause"];
    candidates.push(causeObj["requestUrl"], causeObj["url"]);
  }
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return void 0;
}
function parseError(error) {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message.toLowerCase();
  const errorObj = error;
  const detail = summarizeErrorDetail(error);
  const requestUrl = extractRequestUrl(error);
  if (message.includes("rate limit") || message.includes("rate_limit") || message.includes("429") || errorObj.statusCode === 429 || errorObj.status === 429) {
    const retryAfter = extractRetryAfter(errorObj);
    return {
      message: "Rate limited. Please wait a moment before trying again.",
      type: "rate_limit",
      retryable: true,
      retryDelay: retryAfter || 5e3,
      originalError: err
    };
  }
  if (message.includes("unauthorized") || message.includes("authentication") || message.includes("invalid api key") || message.includes("invalid_api_key") || message.includes("api key") || errorObj.statusCode === 401 || errorObj.status === 401) {
    return {
      message: "Authentication failed. Please check your API key or login with /login.",
      detail,
      requestUrl,
      type: "auth",
      retryable: false,
      originalError: err
    };
  }
  if (errorObj.statusCode === 403 || errorObj.status === 403) {
    return {
      message: "Access denied. You may not have permission to use this model.",
      detail,
      requestUrl,
      type: "auth",
      retryable: false,
      originalError: err
    };
  }
  if (message.includes("network") || message.includes("econnrefused") || message.includes("enotfound") || message.includes("fetch failed") || message.includes("connection")) {
    return {
      message: "Network error while contacting the provider or gateway.",
      detail,
      requestUrl,
      type: "network",
      retryable: true,
      retryDelay: 2e3,
      originalError: err
    };
  }
  if (message.includes("timeout") || message.includes("timed out") || message.includes("etimedout")) {
    return {
      message: "Request timed out. The server may be overloaded.",
      type: "timeout",
      retryable: true,
      retryDelay: 3e3,
      originalError: err
    };
  }
  if (message.includes("model not found") || message.includes("model_not_found") || message.includes("does not exist") || message.includes("invalid model")) {
    return {
      message: "Model not found. Please select a different model with /models.",
      type: "model_not_found",
      retryable: false,
      originalError: err
    };
  }
  if (message.includes("context length") || message.includes("context_length") || message.includes("too many tokens") || message.includes("maximum context") || message.includes("token limit")) {
    return {
      message: "Message too long. Try starting a new thread with /new.",
      type: "context_length",
      retryable: false,
      originalError: err
    };
  }
  if (message.includes("content filter") || message.includes("content_filter") || message.includes("content policy") || message.includes("safety") || message.includes("prohibited")) {
    return {
      message: "Content was filtered by the model's safety system.",
      type: "content_filter",
      retryable: false,
      originalError: err
    };
  }
  if (message.includes("internal server") || message.includes("server error") || errorObj.statusCode === 500 || errorObj.status === 500 || errorObj.statusCode === 502 || errorObj.status === 502 || errorObj.statusCode === 503 || errorObj.status === 503) {
    return {
      message: "Server error. The API may be experiencing issues.",
      type: "server_error",
      retryable: true,
      retryDelay: 5e3,
      originalError: err
    };
  }
  if (message.includes("invalid request") || message.includes("bad request") || errorObj.statusCode === 400 || errorObj.status === 400) {
    return {
      message: `Invalid request: ${extractErrorDetail(err)}`,
      type: "invalid_request",
      retryable: false,
      originalError: err
    };
  }
  return {
    message: extractErrorDetail(err),
    type: "unknown",
    retryable: false,
    originalError: err
  };
}
function extractRetryAfter(error) {
  const headers = error.headers;
  const retryAfter = error.retryAfter || headers?.["retry-after"];
  if (typeof retryAfter === "number") {
    return retryAfter * 1e3;
  }
  if (typeof retryAfter === "string") {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds * 1e3;
    }
  }
  return void 0;
}
function extractErrorDetail(error) {
  const errorObj = error;
  if (errorObj.error && typeof errorObj.error === "object") {
    const apiError = errorObj.error;
    if (apiError.message) return String(apiError.message);
  }
  if (errorObj.message) return String(errorObj.message);
  if (errorObj.detail) return String(errorObj.detail);
  if (errorObj.reason) return String(errorObj.reason);
  let message = error.message;
  message = message.replace(/^(error|exception|failed):\s*/i, "");
  if (message.length > 200) {
    message = message.substring(0, 200) + "...";
  }
  return message || "An unknown error occurred";
}
function sendNotification(reason, opts) {
  const { mode, message, hookManager } = opts;
  if (mode === "off") {
    hookManager?.runNotification(reason, message);
    return;
  }
  if (mode === "bell" || mode === "both") {
    process.stdout.write("\x07");
  }
  if (mode === "system" || mode === "both") {
    sendSystemNotification(reason, message);
  }
  hookManager?.runNotification(reason, message);
}
function sendSystemNotification(reason, message) {
  if (process.platform === "darwin") {
    const title = "Mastra Code";
    const body = message || reasonToMessage(reason);
    const escaped = body.replace(/"/g, '\\"');
    child_process.exec(`osascript -e 'display notification "${escaped}" with title "${title}"'`);
  }
}
function reasonToMessage(reason) {
  switch (reason) {
    case "agent_done":
      return "Agent finished \u2014 waiting for your input";
    case "ask_question":
      return "Agent has a question for you";
    case "tool_approval":
      return "Tool requires your approval";
    case "plan_approval":
      return "Plan requires your approval";
    case "sandbox_access":
      return "Sandbox access requested";
  }
}

// src/tui/display.ts
function showError(state, message) {
  state.chatContainer.addChild(new piTui.Spacer(1));
  state.chatContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("error", `Error: ${message}`), 1, 0));
  state.ui.requestRender();
}
function showInfo(state, message) {
  state.chatContainer.addChild(new piTui.Spacer(1));
  state.chatContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", message), 1, 0));
  state.ui.requestRender();
}
function showFormattedError(state, event) {
  const error = "error" in event ? event.error : event;
  const parsed = parseError(error);
  state.chatContainer.addChild(new piTui.Spacer(1));
  let errorText = `Error: ${parsed.message}`;
  if (parsed.detail && parsed.detail !== parsed.message) {
    errorText += chunkWOKNPWRC_cjs.theme.fg("muted", ` (${parsed.detail})`);
  }
  if (parsed.requestUrl) {
    errorText += chunkWOKNPWRC_cjs.theme.fg("muted", ` [url: ${parsed.requestUrl}]`);
  }
  const retryable = "retryable" in event ? event.retryable : parsed.retryable;
  const retryDelay = "retryDelay" in event ? event.retryDelay : parsed.retryDelay;
  if (retryable && retryDelay) {
    const seconds = Math.ceil(retryDelay / 1e3);
    errorText += chunkWOKNPWRC_cjs.theme.fg("muted", ` (retry in ${seconds}s)`);
  }
  state.chatContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("error", errorText), 1, 0));
  const hint = getErrorHint(parsed.type);
  if (hint) {
    state.chatContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", `  Hint: ${hint}`), 1, 0));
  }
  state.ui.requestRender();
}
function getErrorHint(errorType) {
  switch (errorType) {
    case "auth":
      return "Use /login to authenticate with a provider";
    case "model_not_found":
      return "Use /models to select a different model";
    case "context_length":
      return "Use /new to start a fresh conversation";
    case "rate_limit":
      return "Wait a moment and try again";
    case "network":
      return "Check your internet connection";
    default:
      return null;
  }
}
function notify(state, reason, message) {
  const mode = state.harness.getState()?.notifications ?? "off";
  sendNotification(reason, {
    mode,
    message,
    hookManager: state.hookManager
  });
}

// src/tui/commands/mcp.ts
async function handleMcpCommand(ctx, args) {
  const mm = ctx.mcpManager;
  if (!mm) {
    ctx.showInfo("MCP system not initialized.");
    return;
  }
  const subcommand = args[0];
  if (subcommand === "reload") {
    await reloadServers(ctx);
    return;
  }
  if (subcommand === "status") {
    showTextStatus(ctx);
    return;
  }
  const paths = mm.getConfigPaths();
  if (!mm.hasServers()) {
    ctx.showInfo(
      `No MCP servers configured.

Add servers to:
  ${paths.project} (project)
  ${paths.global} (global)
  ${paths.claude} (Claude Code compat)

Example mcp.json:
  {
    "mcpServers": {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
        "env": {}
      },
      "remote-api": {
        "url": "https://mcp.example.com/sse",
        "headers": { "Authorization": "Bearer <token>" }
      }
    }
  }

Note: For dynamic auth (token refresh), use a stdio wrapper.
"headers" only supports static values.`
    );
    return;
  }
  const statuses = mm.getServerStatuses();
  const skipped = mm.getSkippedServers();
  const selector = new McpSelectorComponent({
    tui: ctx.state.ui,
    statuses,
    skipped,
    configPaths: paths,
    getStatuses: () => ({
      statuses: mm.getServerStatuses(),
      skipped: mm.getSkippedServers()
    }),
    onReloadAll: async () => {
      await mm.reload();
      return {
        statuses: mm.getServerStatuses(),
        skipped: mm.getSkippedServers()
      };
    },
    onReconnectServer: async (name) => {
      return mm.reconnectServer(name);
    },
    getServerLogs: (name) => {
      return mm.getServerLogs(name);
    },
    showInfo: (msg) => {
      showInfo(ctx.state, msg);
    },
    onClose: () => {
      selector.dispose();
      ctx.state.ui.hideOverlay();
    }
  });
  ctx.state.ui.showOverlay(selector, {
    width: "80%",
    maxHeight: "70%",
    anchor: "center"
  });
  selector.focused = true;
}
async function reloadServers(ctx) {
  const mm = ctx.mcpManager;
  if (!mm) return;
  ctx.showInfo("MCP: Reconnecting to servers...");
  try {
    await mm.reload();
    const statuses = mm.getServerStatuses();
    const connected = statuses.filter((s) => s.connected);
    const totalTools = connected.reduce((sum, s) => sum + s.toolCount, 0);
    ctx.showInfo(`MCP: Reloaded. ${connected.length} server(s) connected, ${totalTools} tool(s).`);
    for (const s of statuses.filter((s2) => !s2.connected)) {
      ctx.showInfo(`MCP: Failed to connect to "${s.name}": ${s.error}`);
    }
  } catch (error) {
    ctx.showError(`MCP reload failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
function showTextStatus(ctx) {
  const mm = ctx.mcpManager;
  if (!mm) return;
  const paths = mm.getConfigPaths();
  const statuses = mm.getServerStatuses();
  const skipped = mm.getSkippedServers();
  const lines = [`MCP Servers:`];
  lines.push(`  Project: ${paths.project}`);
  lines.push(`  Global:  ${paths.global}`);
  lines.push(`  Claude:  ${paths.claude}`);
  lines.push("");
  for (const status of statuses) {
    const icon = status.connecting ? "\u27F3" : status.connected ? "\u2713" : "\u2717";
    const state = status.connecting ? "connecting..." : status.connected ? "connected" : `error: ${status.error}`;
    lines.push(`  ${icon} ${status.name} [${status.transport}] (${state})`);
    if (status.toolNames.length > 0) {
      for (const toolName of status.toolNames) {
        lines.push(`      - ${toolName}`);
      }
    }
  }
  if (skipped.length > 0) {
    lines.push("");
    lines.push("  Skipped:");
    for (const s of skipped) {
      lines.push(`    \u2717 ${s.name}: ${s.reason}`);
    }
  }
  lines.push("");
  lines.push(`  /mcp reload - Disconnect and reconnect all servers`);
  ctx.showInfo(lines.join("\n"));
}

// src/tui/commands/mode.ts
async function handleModeCommand(ctx, args) {
  const modes = ctx.harness.listModes();
  if (modes.length <= 1) {
    ctx.showInfo("Only one mode available");
    return;
  }
  if (args[0]) {
    try {
      await ctx.harness.switchMode({ modeId: args[0] });
    } catch (err) {
      ctx.showError(`Failed to switch mode: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    const currentMode = ctx.harness.getCurrentMode();
    const modeList = modes.map((m) => `  ${m.id === currentMode?.id ? "* " : "  "}${m.id}${m.name ? ` - ${m.name}` : ""}`).join("\n");
    ctx.showInfo(`Modes:
${modeList}`);
  }
}
var MAX_COLLAPSED_LINES = 3;
var getBorderColor = () => chunkWOKNPWRC_cjs.mastra.green;
var SlashCommandComponent = class extends piTui.Container {
  commandName;
  contentLines;
  expanded = false;
  constructor(commandName, content) {
    super();
    this.commandName = commandName;
    this.contentLines = content ? content.split("\n").filter((l) => l.trim()) : [];
    this.rebuild();
  }
  setExpanded(expanded) {
    if (this.expanded === expanded) return;
    this.expanded = expanded;
    this.rebuild();
  }
  rebuild() {
    this.clear();
    const border = (char) => chalk8__default.default.bold.hex(getBorderColor())(char);
    const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
    const maxLineWidth = termWidth - 6 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
    const heading = chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.specialGray)(`/${this.commandName}`);
    if (this.contentLines.length === 0) {
      this.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${heading}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      return;
    }
    this.addChild(new piTui.Text(`${border("\u256D\u2500\u2500")}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    const wrappedLines = [];
    for (const line of this.contentLines) {
      if (line.length > maxLineWidth) {
        let remaining = line;
        while (remaining.length > maxLineWidth) {
          const breakAt = remaining.lastIndexOf(" ", maxLineWidth);
          const splitAt = breakAt > 0 ? breakAt : maxLineWidth;
          wrappedLines.push(remaining.slice(0, splitAt));
          remaining = remaining.slice(splitAt).trimStart();
        }
        if (remaining) wrappedLines.push(remaining);
      } else {
        wrappedLines.push(line);
      }
    }
    const truncated = !this.expanded && wrappedLines.length > MAX_COLLAPSED_LINES + 1;
    const displayLines = truncated ? wrappedLines.slice(0, MAX_COLLAPSED_LINES) : wrappedLines;
    const contentText = displayLines.map(
      (line) => `${border("\u2502")} ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.mainGray)(line.length > maxLineWidth ? line.slice(0, maxLineWidth - 1) + "\u2026" : line)}`
    ).join("\n");
    this.addChild(new piTui.Text(contentText, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    if (truncated) {
      const moreText = chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.darkGray)(
        `... ${wrappedLines.length - MAX_COLLAPSED_LINES} more lines (ctrl+e to expand)`
      );
      this.addChild(new piTui.Text(`${border("\u2502")} ${moreText}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    }
    this.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${heading}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    this.addChild(new piTui.Spacer(1));
  }
};

// src/tui/commands/skills.ts
var MAX_NAME_LENGTH = 64;
var MAX_DESCRIPTION_LENGTH = 1024;
var MAX_INSTRUCTION_LINES = 500;
var MAX_INSTRUCTION_TOKENS = 5e3;
var WORKSPACE_SKILLS_WARNING_PREFIX = "[WorkspaceSkills]";
var WARNING_PREVIEW_COUNT = 3;
var INVALID_YAML = "__INVALID_YAML__";
function estimateTokenCount(text) {
  return Math.ceil(text.length / 4);
}
function parseSkillFile(skillDir) {
  const skillFile = path6__namespace.default.join(skillDir, "SKILL.md");
  if (!fs2__default.default.existsSync(skillFile)) return null;
  const raw = fs2__default.default.readFileSync(skillFile, "utf-8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { metadata: null, instructions: raw };
  }
  try {
    return {
      metadata: yaml.parse(match[1] ?? ""),
      instructions: match[2] ?? ""
    };
  } catch {
    return { metadata: INVALID_YAML, instructions: match[2] ?? "" };
  }
}
function validateSkillMetadata(metadata, dirName, instructions) {
  const errors = [];
  const warnings = [];
  if (metadata === INVALID_YAML) {
    return { errors: ["Invalid YAML frontmatter"], warnings };
  }
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { errors: ["Missing or invalid YAML frontmatter"], warnings };
  }
  const data = metadata;
  const name = data.name;
  const description = data.description;
  const license = data.license;
  const meta = data.metadata;
  if (typeof name !== "string") {
    errors.push(`name: Expected string, received ${typeof name}`);
  } else if (!name.trim()) {
    errors.push("name: Skill name cannot be empty");
  } else {
    if (name.length > MAX_NAME_LENGTH) errors.push(`name: Skill name must be at most ${MAX_NAME_LENGTH} characters`);
    if (!/^[a-z0-9-]+$/.test(name)) errors.push("name: Skill name can only contain lowercase letters, numbers, and hyphens");
    if (name.startsWith("-") || name.endsWith("-")) errors.push("name: Skill name must not start or end with a hyphen");
    if (name.includes("--")) errors.push("name: Skill name must not contain consecutive hyphens");
    if (dirName && name !== dirName) errors.push(`Skill name "${name}" must match directory name "${dirName}"`);
  }
  if (typeof description !== "string") {
    errors.push(`description: Expected string, received ${typeof description}`);
  } else if (!description.trim()) {
    errors.push("description: Skill description cannot be only whitespace");
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`description: Skill description must be at most ${MAX_DESCRIPTION_LENGTH} characters`);
  }
  if (license !== void 0 && typeof license !== "string") {
    errors.push(`license: Expected string, received ${Array.isArray(license) ? "array" : typeof license}`);
  }
  if (meta !== void 0 && (!meta || typeof meta !== "object" || Array.isArray(meta))) {
    errors.push(`metadata: Expected object, received ${Array.isArray(meta) ? "array" : typeof meta}`);
  }
  if (instructions) {
    const lineCount = instructions.split("\n").length;
    if (lineCount > MAX_INSTRUCTION_LINES) {
      warnings.push(`instructions: SKILL.md has ${lineCount} lines (recommended: <${MAX_INSTRUCTION_LINES}). Consider moving content to references/.`);
    }
    const tokenEstimate = estimateTokenCount(instructions);
    if (tokenEstimate > MAX_INSTRUCTION_TOKENS) {
      warnings.push(
        `instructions: Instructions have ~${tokenEstimate} estimated tokens (recommended: <${MAX_INSTRUCTION_TOKENS}). Consider moving content to references/.`
      );
    }
  }
  return { errors, warnings };
}
function collectMetadataWarnings(skills) {
  const warnings = [];
  for (const skill of skills) {
    const skillDir = skill.path;
    const dirName = path6__namespace.default.basename(skillDir);
    const parsed = parseSkillFile(skillDir);
    if (!parsed) continue;
    const result = validateSkillMetadata(parsed.metadata, dirName, parsed.instructions);
    for (const message of [...result.errors, ...result.warnings]) {
      warnings.push({ summary: `${dirName} \u2014 ${message}`, path: skillDir });
    }
  }
  return warnings;
}
function collectSuppressedWarnings(ctx) {
  return ctx.extension.workspaceSkillWarningSink.getWarnings().map((message) => message.trim()).filter(Boolean).map((message) => {
    const cleaned = message.startsWith(WORKSPACE_SKILLS_WARNING_PREFIX) ? message.slice(WORKSPACE_SKILLS_WARNING_PREFIX.length).trim() : message;
    return { summary: cleaned };
  });
}
function dedupeWarnings(warnings) {
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const warning of warnings) {
    const key = `${warning.summary}::${warning.path ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(warning);
  }
  return deduped;
}
function buildWarningsContent(warnings, expanded) {
  const lines = [`Warnings: ${warnings.length}`];
  const visibleWarnings = expanded ? warnings : warnings.slice(0, WARNING_PREVIEW_COUNT);
  for (const warning of visibleWarnings) {
    lines.push(`- ${warning.summary}`);
    if (expanded && warning.path) {
      lines.push(`  path: ${warning.path}`);
    }
  }
  if (!expanded && warnings.length > WARNING_PREVIEW_COUNT) {
    lines.push(`...and ${warnings.length - WARNING_PREVIEW_COUNT} more`);
  }
  return lines;
}
var SkillsWarningsComponent = class extends SlashCommandComponent {
  warnings;
  constructor(warnings) {
    super("skills-warnings");
    this.warnings = warnings;
    this.contentLines = buildWarningsContent(warnings, false);
    this.rebuild();
  }
  setExpanded(expanded) {
    if (this.expanded === expanded) return;
    this.expanded = expanded;
    this.contentLines = buildWarningsContent(this.warnings, expanded);
    this.rebuild();
  }
};
function renderSlashBlock(ctx, commandName, lines, expanded) {
  const component = new SlashCommandComponent(commandName, lines.join("\n"));
  component.setExpanded(expanded);
  ctx.state.allSlashCommandComponents.push(component);
  ctx.state.chatContainer.addChild(component);
  return component;
}
async function handleSkillsCommand(ctx) {
  let workspace = ctx.getResolvedWorkspace();
  if (!workspace && ctx.harness.hasWorkspace()) {
    try {
      workspace = await ctx.harness.resolveWorkspace();
    } catch (error) {
      ctx.showError(`Failed to resolve workspace: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
  }
  if (!workspace?.skills) {
    ctx.showInfo(
      "No skills configured.\n\nAdd skills to any of these locations:\n  .mastracode/skills/   (project-local)\n  .claude/skills/       (project-local)\n  ~/.mastracode/skills/ (global)\n  ~/.claude/skills/     (global)\n\nEach skill is a folder with a SKILL.md file.\nInstall skills: npx add-skill <github-url>"
    );
    return;
  }
  try {
    const skills = await ctx.extension.workspaceAdapter.listSkills(workspace);
    if (skills.length === 0) {
      ctx.showInfo(
        "No skills found in configured directories.\n\nEach skill needs a SKILL.md file with YAML frontmatter.\nInstall skills: npx add-skill <github-url>"
      );
      return;
    }
    const warnings = dedupeWarnings([
      ...collectMetadataWarnings(skills.map((skill) => ({ path: skill.path }))),
      ...collectSuppressedWarnings(ctx)
    ]);
    if (warnings.length > 0) {
      const warningsComponent = new SkillsWarningsComponent(warnings);
      ctx.state.allSlashCommandComponents.push(warningsComponent);
      ctx.state.chatContainer.addChild(warningsComponent);
    }
    const skillLines = [`${skills.length} skills available.`];
    for (const skill of skills) {
      skillLines.push(`- ${skill.name ?? path6__namespace.default.basename(skill.path)}`);
      skillLines.push(`  path: ${skill.path}`);
      if (skill.description) {
        skillLines.push(`  description: ${skill.description}`);
      }
    }
    renderSlashBlock(ctx, "skills", skillLines, false);
    ctx.state.ui.requestRender();
  } catch (error) {
    ctx.showError(`Failed to list skills: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    ctx.extension.workspaceSkillWarningSink.clearWarnings();
  }
}

// src/tui/commands/new.ts
function handleNewCommand(ctx) {
  const { state } = ctx;
  state.pendingNewThread = true;
  state.chatContainer.clear();
  state.pendingTools.clear();
  state.allToolComponents = [];
  state.allSystemReminderComponents = [];
  state.harness.getDisplayState().modifiedFiles.clear();
  if (state.taskProgress) {
    state.taskProgress.updateTasks([]);
  }
  state.taskWriteInsertIndex = -1;
  ctx.updateStatusLine();
  state.ui.requestRender();
  ctx.showInfo("Ready for new conversation");
}
function confirmClone(state, threadLabel) {
  const label = threadLabel ? `Clone thread "${threadLabel}"?` : "Clone the current thread?";
  return new Promise((resolve3) => {
    const question = new AskQuestionInlineComponent(
      {
        question: label,
        options: [
          { label: "Yes", description: "Clone this thread" },
          { label: "No", description: "Cancel" }
        ],
        formatResult: (answer) => answer === "Yes" ? "Cloning thread..." : "Cancelled.",
        isNegativeAnswer: (answer) => answer !== "Yes",
        onSubmit: (answer) => {
          state.activeInlineQuestion = void 0;
          resolve3(answer === "Yes");
        },
        onCancel: () => {
          state.activeInlineQuestion = void 0;
          resolve3(false);
        }
      },
      state.ui
    );
    state.activeInlineQuestion = question;
    state.chatContainer.addChild(question);
    state.chatContainer.addChild(new piTui.Spacer(1));
    state.ui.requestRender();
    state.chatContainer.invalidate();
  });
}
function askCloneName(state) {
  return new Promise((resolve3) => {
    const question = new AskQuestionInlineComponent(
      {
        question: "Give the cloned thread a name? (Esc to skip)",
        formatResult: (answer) => `Thread name: ${answer}`,
        onSubmit: (answer) => {
          state.activeInlineQuestion = void 0;
          const trimmed = answer.trim();
          resolve3(trimmed.length > 0 ? trimmed : null);
        },
        onCancel: () => {
          state.activeInlineQuestion = void 0;
          resolve3(null);
        }
      },
      state.ui
    );
    state.activeInlineQuestion = question;
    state.chatContainer.addChild(question);
    state.chatContainer.addChild(new piTui.Spacer(1));
    state.ui.requestRender();
    state.chatContainer.invalidate();
  });
}
async function resetUIAfterClone(ctx, clonedTitle) {
  const { state } = ctx;
  state.chatContainer.clear();
  state.pendingTools.clear();
  state.allToolComponents = [];
  state.allSystemReminderComponents = [];
  state.harness.getDisplayState().modifiedFiles.clear();
  if (state.taskProgress) {
    state.taskProgress.updateTasks([]);
  }
  state.taskWriteInsertIndex = -1;
  ctx.updateStatusLine();
  await ctx.renderExistingMessages();
  state.ui.requestRender();
  ctx.showInfo(`Cloned thread: ${clonedTitle}`);
}
async function handleCloneCommand(ctx) {
  const { state } = ctx;
  const currentThreadId = state.harness.getCurrentThreadId();
  if (!currentThreadId) {
    ctx.showInfo("No active thread to clone");
    return;
  }
  if (!await confirmClone(state)) return;
  const customTitle = await askCloneName(state);
  try {
    const clonedThread = await state.harness.cloneThread({
      sourceThreadId: currentThreadId,
      ...customTitle ? { title: customTitle } : {}
    });
    await resetUIAfterClone(ctx, clonedThread.title || clonedThread.id);
  } catch (error) {
    ctx.showError(`Failed to clone thread: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// src/tui/commands/resource.ts
async function handleResourceCommand(ctx, args) {
  const { state, harness } = ctx;
  const sub = args[0]?.trim();
  const current = harness.getResourceId();
  const defaultId = harness.getDefaultResourceId();
  if (!sub) {
    const knownIds = await harness.getKnownResourceIds();
    const isOverridden = current !== defaultId;
    const lines = [
      `Current: ${current}${isOverridden ? ` (auto-detected: ${defaultId})` : ""}`,
      "",
      "Known resource IDs:",
      ...knownIds.map((id) => `  ${id === current ? "* " : "  "}${id}`),
      "",
      "Usage:",
      "  /resource          - Show current resource and known IDs",
      "  /resource <id>     - Switch to a resource ID (resumes latest thread)",
      "  /resource reset    - Reset to auto-detected ID"
    ];
    ctx.showInfo(lines.join("\n"));
    return;
  }
  const newId = sub === "reset" ? defaultId : args.join(" ").trim();
  if (newId === current) {
    ctx.showInfo(`Already on resource: ${current}`);
    return;
  }
  harness.setResourceId({ resourceId: newId });
  const threads = await harness.listThreads();
  const latest = [...threads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  if (latest) {
    await harness.switchThread({ threadId: latest.id });
    state.chatContainer.clear();
    state.pendingTools.clear();
    state.allToolComponents = [];
    state.allSystemReminderComponents = [];
    state.pendingNewThread = false;
    await ctx.renderExistingMessages();
    ctx.showInfo(
      sub === "reset" ? `Resource ID reset to: ${defaultId} \u2014 resumed thread: ${latest.title || latest.id}` : `Switched to resource: ${newId} \u2014 resumed thread: ${latest.title || latest.id}`
    );
  } else {
    state.chatContainer.clear();
    state.pendingTools.clear();
    state.allToolComponents = [];
    state.allSystemReminderComponents = [];
    state.pendingNewThread = true;
    ctx.showInfo(
      sub === "reset" ? `Resource ID reset to: ${defaultId} (no existing threads, a new one will be created)` : `Switched to resource: ${newId} (no existing threads, a new one will be created)`
    );
  }
  ctx.updateStatusLine();
  state.ui.requestRender();
}
function colorizeDiffLine(line) {
  const t = chunkWOKNPWRC_cjs.theme.getTheme();
  const addedColor = chalk8__default.default.hex(t.success);
  const hunkHeaderColor = chalk8__default.default.hex(t.toolBorderPending);
  const fileHeaderColor = chalk8__default.default.bold.hex(t.accent);
  const removedColor = chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.red);
  const metaColor = chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.mainGray);
  if (line.startsWith("+++") || line.startsWith("---")) {
    return fileHeaderColor(line);
  }
  if (line.startsWith("+")) {
    return addedColor(line);
  }
  if (line.startsWith("-")) {
    return removedColor(line);
  }
  if (line.startsWith("@@")) {
    const match = line.match(/^(@@ .+? @@)(.*)/);
    if (match) {
      return hunkHeaderColor(match[1]) + metaColor(match[2] || "");
    }
    return hunkHeaderColor(line);
  }
  if (line.startsWith("diff ") || line.startsWith("index ") || line.startsWith("new file") || line.startsWith("deleted file") || line.startsWith("similarity index") || line.startsWith("rename ")) {
    return metaColor(line);
  }
  return metaColor(line);
}
var DiffOutputComponent = class extends piTui.Container {
  constructor(command, diffOutput) {
    super();
    this.addChild(new piTui.Spacer(1));
    this.addChild(
      new piTui.Text(
        `${chunkWOKNPWRC_cjs.theme.fg("success", "\u2713")} ${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("muted", "$"))} ${chunkWOKNPWRC_cjs.theme.fg("text", command)}`,
        chunkWOKNPWRC_cjs.BOX_INDENT,
        0
      )
    );
    const output = diffOutput.trimEnd();
    if (output) {
      const lines = output.split("\n");
      for (const line of lines) {
        this.addChild(new piTui.Text(`  ${colorizeDiffLine(line)}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      }
    }
  }
};

// src/tui/commands/diff.ts
async function handleDiffCommand(ctx, filePath) {
  const { state } = ctx;
  if (filePath) {
    try {
      const { execa } = await import('execa');
      const result = await execa("git", ["diff", filePath], {
        cwd: process.cwd(),
        reject: false
      });
      if (!result.stdout.trim()) {
        const staged = await execa("git", ["diff", "--cached", filePath], {
          cwd: process.cwd(),
          reject: false
        });
        if (!staged.stdout.trim()) {
          ctx.showInfo(`No changes detected for: ${filePath}`);
          return;
        }
        const component2 = new DiffOutputComponent(`git diff --cached ${filePath}`, staged.stdout);
        state.chatContainer.addChild(component2);
        state.ui.requestRender();
        return;
      }
      const component = new DiffOutputComponent(`git diff ${filePath}`, result.stdout);
      state.chatContainer.addChild(component);
      state.ui.requestRender();
    } catch (error) {
      ctx.showError(error instanceof Error ? error.message : "Failed to get diff");
    }
    return;
  }
  const modifiedFiles = state.harness.getDisplayState().modifiedFiles;
  if (modifiedFiles.size === 0) {
    try {
      const { execa } = await import('execa');
      const result = await execa("git", ["diff", "--stat"], {
        cwd: process.cwd(),
        reject: false
      });
      const staged = await execa("git", ["diff", "--cached", "--stat"], {
        cwd: process.cwd(),
        reject: false
      });
      const output = [result.stdout, staged.stdout].filter(Boolean).join("\n");
      if (output.trim()) {
        const component = new DiffOutputComponent("git diff --stat", output);
        state.chatContainer.addChild(component);
        state.ui.requestRender();
      } else {
        ctx.showInfo("No file changes detected in this session or working tree.");
      }
    } catch {
      ctx.showInfo("No file changes tracked in this session.");
    }
    return;
  }
  const lines = [`Modified files (${modifiedFiles.size}):`];
  for (const [fp, info] of modifiedFiles) {
    const opCounts = /* @__PURE__ */ new Map();
    for (const op of info.operations) {
      opCounts.set(op, (opCounts.get(op) || 0) + 1);
    }
    const ops = Array.from(opCounts.entries()).map(([op, count]) => count > 1 ? `${op}\xD7${count}` : op).join(", ");
    lines.push(`  ${chunkWOKNPWRC_cjs.theme.fg("path", fp)} ${chunkWOKNPWRC_cjs.theme.fg("muted", `(${ops})`)}`);
  }
  lines.push("");
  lines.push(chunkWOKNPWRC_cjs.theme.fg("muted", "Use /diff <path> to see the git diff for a specific file."));
  ctx.showInfo(lines.join("\n"));
}
var MAX_VISIBLE_THREADS = 12;
var INITIAL_PREVIEW_LOAD_COUNT = 24;
var PREVIEW_BATCH_SIZE = 2;
var INITIAL_PREVIEW_LOAD_DELAY_MS = 150;
var INTERACTION_PREVIEW_LOAD_DELAY_MS = 250;
var FOLLOW_UP_PREVIEW_LOAD_DELAY_MS = 50;
var ThreadSelectorComponent = class extends piTui.Box {
  searchInput;
  listContainer;
  allThreads;
  filteredThreads;
  selectedIndex = 0;
  currentThreadId;
  currentResourceId;
  currentProjectPath;
  onSelectCallback;
  onCancelCallback;
  onCloneCallback;
  tui;
  getMessagePreviews;
  onMessagePreviewsLoaded;
  messagePreviews;
  attemptedPreviewThreadIds;
  loadingPreviewThreadIds = /* @__PURE__ */ new Set();
  previewLoadVersion = 0;
  previewLoadTimeout = null;
  // Focusable implementation
  _focused = false;
  get focused() {
    return this._focused;
  }
  set focused(value) {
    this._focused = value;
    this.searchInput.focused = value;
  }
  constructor(options) {
    super(2, 1, (text) => chunkWOKNPWRC_cjs.theme.bg("overlayBg", text));
    this.tui = options.tui;
    this.currentResourceId = options.currentResourceId;
    this.currentProjectPath = options.currentProjectPath;
    this.allThreads = this.sortThreads(options.threads, options.currentThreadId);
    this.currentThreadId = options.currentThreadId;
    this.onSelectCallback = options.onSelect;
    this.onCancelCallback = options.onCancel;
    this.onCloneCallback = options.onClone;
    this.getMessagePreviews = options.getMessagePreviews;
    this.onMessagePreviewsLoaded = options.onMessagePreviewsLoaded;
    this.messagePreviews = new Map(options.initialMessagePreviews ?? []);
    this.attemptedPreviewThreadIds = new Set(options.initialAttemptedPreviewThreadIds ?? []);
    this.filteredThreads = this.allThreads;
    this.buildUI();
    this.scheduleMessagePreviewLoad({ initialLoad: true });
  }
  getVisibleRange() {
    const startIndex = Math.max(
      0,
      Math.min(
        this.selectedIndex - Math.floor(MAX_VISIBLE_THREADS / 2),
        this.filteredThreads.length - MAX_VISIBLE_THREADS
      )
    );
    const endIndex = Math.min(startIndex + MAX_VISIBLE_THREADS, this.filteredThreads.length);
    return { startIndex, endIndex };
  }
  getVisibleThreads() {
    const { startIndex, endIndex } = this.getVisibleRange();
    return this.filteredThreads.slice(startIndex, endIndex);
  }
  getPreviewCandidates(initialLoad) {
    const initialThreads = initialLoad ? this.filteredThreads.slice(0, INITIAL_PREVIEW_LOAD_COUNT) : [];
    const combinedThreads = [...initialThreads, ...this.getVisibleThreads()];
    const uniqueThreads = combinedThreads.filter(
      (thread, index, threads) => threads.findIndex((t) => t.id === thread.id) === index
    );
    const prioritizedThreads = uniqueThreads.filter(
      (thread) => thread.resourceId === this.currentResourceId && typeof thread.metadata?.projectPath === "string" && thread.metadata.projectPath === this.currentProjectPath
    );
    const remainingThreads = uniqueThreads.filter((thread) => !prioritizedThreads.some((t) => t.id === thread.id));
    return [...prioritizedThreads, ...remainingThreads].filter(
      (thread) => !this.messagePreviews.has(thread.id) && !this.attemptedPreviewThreadIds.has(thread.id) && !this.loadingPreviewThreadIds.has(thread.id)
    );
  }
  scheduleMessagePreviewLoad({
    initialLoad = false,
    delayMs
  } = {}) {
    const previewDelayMs = delayMs ?? (initialLoad ? INITIAL_PREVIEW_LOAD_DELAY_MS : FOLLOW_UP_PREVIEW_LOAD_DELAY_MS);
    if (this.previewLoadTimeout) {
      clearTimeout(this.previewLoadTimeout);
    }
    this.previewLoadTimeout = setTimeout(() => {
      this.previewLoadTimeout = null;
      void this.loadMessagePreviews({ initialLoad });
    }, previewDelayMs);
  }
  async loadMessagePreviews({ initialLoad = false } = {}) {
    if (!this.getMessagePreviews) return;
    const version = ++this.previewLoadVersion;
    const candidates = this.getPreviewCandidates(initialLoad);
    const threadIds = candidates.slice(0, PREVIEW_BATCH_SIZE).map((thread) => thread.id);
    if (threadIds.length === 0) return;
    threadIds.forEach((threadId) => this.loadingPreviewThreadIds.add(threadId));
    this.updateList();
    this.tui.requestRender();
    try {
      const previews = await this.getMessagePreviews(threadIds);
      if (version !== this.previewLoadVersion) return;
      threadIds.forEach((threadId) => this.attemptedPreviewThreadIds.add(threadId));
      for (const [threadId, preview] of previews) {
        if (preview) {
          this.messagePreviews.set(threadId, preview);
        }
      }
      this.onMessagePreviewsLoaded?.(new Map(this.messagePreviews), new Set(this.attemptedPreviewThreadIds));
    } catch {
    } finally {
      threadIds.forEach((threadId) => this.loadingPreviewThreadIds.delete(threadId));
    }
    this.updateList();
    this.tui.requestRender();
    if (candidates.length > PREVIEW_BATCH_SIZE) {
      this.scheduleMessagePreviewLoad({ initialLoad, delayMs: FOLLOW_UP_PREVIEW_LOAD_DELAY_MS });
    }
  }
  buildUI() {
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "Select Thread")), 0, 0));
    this.addChild(new piTui.Spacer(1));
    const cloneHint = this.onCloneCallback ? " \u2022 c clone" : "";
    this.addChild(
      new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", `Type to search \u2022 \u2191\u2193 navigate \u2022 Enter select${cloneHint} \u2022 Esc cancel`), 0, 0)
    );
    this.addChild(new piTui.Spacer(1));
    this.searchInput = new piTui.Input();
    this.searchInput.onSubmit = () => {
      const selected = this.filteredThreads[this.selectedIndex];
      if (selected) {
        this.onSelectCallback(selected);
      }
    };
    this.addChild(this.searchInput);
    this.addChild(new piTui.Spacer(1));
    this.listContainer = new piTui.Container();
    this.addChild(this.listContainer);
    this.updateList();
  }
  sortThreads(threads, currentThreadId) {
    const sorted = [...threads];
    const resId = this.currentResourceId;
    const projPath = this.currentProjectPath;
    sorted.sort((a, b) => {
      if (a.id === currentThreadId) return -1;
      if (b.id === currentThreadId) return 1;
      if (resId) {
        const aLocal = a.resourceId === resId;
        const bLocal = b.resourceId === resId;
        if (aLocal && !bLocal) return -1;
        if (!aLocal && bLocal) return 1;
      }
      if (projPath && a.resourceId === b.resourceId) {
        const aDir = typeof a.metadata?.projectPath === "string" && a.metadata.projectPath === projPath;
        const bDir = typeof b.metadata?.projectPath === "string" && b.metadata.projectPath === projPath;
        if (aDir && !bDir) return -1;
        if (!aDir && bDir) return 1;
      }
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
    return sorted;
  }
  filterThreads(query) {
    this.filteredThreads = query ? piTui.fuzzyFilter(
      this.allThreads,
      query,
      (t) => `${t.title ?? ""} ${t.resourceId} ${t.id} ${typeof t.metadata?.projectPath === "string" ? t.metadata.projectPath : ""}`
    ) : this.allThreads;
    this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, this.filteredThreads.length - 1));
    this.updateList();
    this.scheduleMessagePreviewLoad({ initialLoad: true });
  }
  formatTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1e3);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
  updateList() {
    this.listContainer.clear();
    const startIndex = Math.max(
      0,
      Math.min(
        this.selectedIndex - Math.floor(MAX_VISIBLE_THREADS / 2),
        this.filteredThreads.length - MAX_VISIBLE_THREADS
      )
    );
    const endIndex = Math.min(startIndex + MAX_VISIBLE_THREADS, this.filteredThreads.length);
    for (let i = startIndex; i < endIndex; i++) {
      const thread = this.filteredThreads[i];
      if (!thread) continue;
      const isSelected = i === this.selectedIndex;
      const isCurrent = thread.id === this.currentThreadId;
      const checkmark = isCurrent ? chunkWOKNPWRC_cjs.theme.fg("success", " \u2713") : "";
      const shortId = thread.id.slice(-6);
      const threadPath = thread.metadata?.projectPath;
      const pathTag = threadPath ? chunkWOKNPWRC_cjs.theme.fg("dim", ` [${threadPath.split("/").pop()}]`) : "";
      const displayId = `${thread.resourceId}/${shortId}`;
      const timeAgo = chunkWOKNPWRC_cjs.theme.fg("muted", ` (${this.formatTimeAgo(thread.updatedAt)})`);
      const displayTitle = thread.title && thread.title !== "New Thread" ? thread.title : null;
      let line = "";
      if (isSelected) {
        line = chunkWOKNPWRC_cjs.theme.fg("accent", `\u2192 ${displayId}`) + pathTag + timeAgo + checkmark;
      } else {
        line = `  ${displayId}` + pathTag + timeAgo + checkmark;
      }
      this.listContainer.addChild(new piTui.Text(line, 0, 0));
      if (displayTitle) {
        this.listContainer.addChild(new piTui.Text(`     ${chunkWOKNPWRC_cjs.theme.fg("muted", displayTitle)}`, 0, 0));
      } else {
        const preview = this.messagePreviews.get(thread.id);
        if (preview) {
          this.listContainer.addChild(new piTui.Text(`     ${chunkWOKNPWRC_cjs.theme.fg("dim", `"${preview}"`)}`, 0, 0));
        }
      }
    }
    if (startIndex > 0 || endIndex < this.filteredThreads.length) {
      const scrollInfo = chunkWOKNPWRC_cjs.theme.fg("muted", `(${this.selectedIndex + 1}/${this.filteredThreads.length})`);
      this.listContainer.addChild(new piTui.Text(scrollInfo, 0, 0));
    }
    if (this.filteredThreads.length === 0) {
      this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "No matching threads"), 0, 0));
    }
  }
  handleInput(keyData) {
    const kb = piTui.getEditorKeybindings();
    if (kb.matches(keyData, "selectUp")) {
      if (this.filteredThreads.length === 0) return;
      this.selectedIndex = this.selectedIndex === 0 ? this.filteredThreads.length - 1 : this.selectedIndex - 1;
      this.updateList();
      this.tui.requestRender();
      this.scheduleMessagePreviewLoad({ delayMs: INTERACTION_PREVIEW_LOAD_DELAY_MS });
    } else if (kb.matches(keyData, "selectDown")) {
      if (this.filteredThreads.length === 0) return;
      this.selectedIndex = this.selectedIndex === this.filteredThreads.length - 1 ? 0 : this.selectedIndex + 1;
      this.updateList();
      this.tui.requestRender();
      this.scheduleMessagePreviewLoad({ delayMs: INTERACTION_PREVIEW_LOAD_DELAY_MS });
    } else if (kb.matches(keyData, "selectConfirm")) {
      const selected = this.filteredThreads[this.selectedIndex];
      if (selected) {
        this.onSelectCallback(selected);
      }
    } else if (kb.matches(keyData, "selectCancel")) {
      this.onCancelCallback();
    } else if (keyData === "c" && this.onCloneCallback && !this.searchInput.getValue()) {
      const selected = this.filteredThreads[this.selectedIndex];
      if (selected) {
        this.onCloneCallback(selected);
      }
    } else {
      this.searchInput.handleInput(keyData);
      this.filterThreads(this.searchInput.getValue());
      this.tui.requestRender();
      this.scheduleMessagePreviewLoad({ delayMs: INTERACTION_PREVIEW_LOAD_DELAY_MS });
    }
  }
};

// src/tui/commands/threads.ts
function showThreadLockPrompt(ctx, threadTitle, ownerPid, lockedThreadId) {
  const questionComponent = new AskQuestionInlineComponent(
    {
      question: `Thread "${threadTitle}" is locked by pid ${ownerPid}. What would you like to do?`,
      options: [
        { label: "Switch thread", description: "Pick a different thread" },
        { label: "New thread", description: "Start a fresh thread" },
        ...lockedThreadId ? [{ label: "Clone thread", description: "Fork from this thread" }] : [],
        { label: "Exit", description: "Exit" }
      ],
      formatResult: (answer) => {
        if (answer === "Switch thread") return "Opening thread selector...";
        if (answer === "Clone thread") return "Cloning thread...";
        if (answer === "New thread") return "Starting new thread.";
        return "Exiting.";
      },
      onSubmit: async (answer) => {
        ctx.state.activeInlineQuestion = void 0;
        if (answer === "Switch thread") {
          await handleThreadsCommand(ctx);
        } else if (answer === "Clone thread" && lockedThreadId) {
          try {
            const customTitle = await askCloneName(ctx.state);
            const clonedThread = await ctx.state.harness.cloneThread({
              sourceThreadId: lockedThreadId,
              ...customTitle ? { title: customTitle } : {}
            });
            ctx.state.pendingNewThread = false;
            await resetUIAfterClone(ctx, clonedThread.title || clonedThread.id);
          } catch (error) {
            ctx.showError(`Failed to clone thread: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else if (answer === "New thread") ; else {
          process.exit(0);
        }
      },
      onCancel: () => {
        ctx.state.activeInlineQuestion = void 0;
        process.exit(0);
      }
    },
    ctx.state.ui
  );
  ctx.state.activeInlineQuestion = questionComponent;
  ctx.state.chatContainer.addChild(questionComponent);
  ctx.state.chatContainer.addChild(new piTui.Spacer(1));
  ctx.state.ui.requestRender();
  ctx.state.chatContainer.invalidate();
}
async function handleThreadsCommand(ctx) {
  const { state } = ctx;
  const threads = await state.harness.listThreads({ allResources: true });
  const currentId = state.pendingNewThread ? null : state.harness.getCurrentThreadId();
  const currentResourceId = state.harness.getResourceId();
  const threadById = new Map(threads.map((thread) => [thread.id, thread]));
  for (const [threadId, cachedPreview] of [...state.threadPreviewCache.entries()]) {
    const thread = threadById.get(threadId);
    if (!thread || cachedPreview.updatedAt < thread.updatedAt.getTime()) {
      state.threadPreviewCache.delete(threadId);
      state.attemptedThreadPreviewIds.delete(threadId);
    }
  }
  for (const threadId of [...state.attemptedThreadPreviewIds]) {
    if (!threadById.has(threadId)) {
      state.attemptedThreadPreviewIds.delete(threadId);
    }
  }
  if (threads.length === 0) {
    ctx.showInfo("No threads yet. Send a message to create one.");
    return;
  }
  return new Promise((resolve3) => {
    const selector = new ThreadSelectorComponent({
      tui: state.ui,
      threads,
      currentThreadId: currentId,
      currentResourceId,
      currentProjectPath: state.projectInfo.rootPath,
      initialMessagePreviews: new Map(
        [...state.threadPreviewCache.entries()].map(
          ([threadId, cachedPreview]) => [threadId, cachedPreview.preview]
        )
      ),
      initialAttemptedPreviewThreadIds: state.attemptedThreadPreviewIds,
      onMessagePreviewsLoaded: (previews, attemptedThreadIds) => {
        state.threadPreviewCache = new Map(
          [...previews.entries()].flatMap(([threadId, preview]) => {
            const thread = threadById.get(threadId);
            return thread ? [[threadId, { preview, updatedAt: thread.updatedAt.getTime() }]] : [];
          })
        );
        state.attemptedThreadPreviewIds = attemptedThreadIds;
      },
      getMessagePreviews: async (threadIds) => {
        return new Map(
          threadIds.flatMap((threadId) => {
            const preview = state.threadPreviewCache.get(threadId)?.preview;
            return preview ? [[threadId, preview]] : [];
          })
        );
      },
      onSelect: async (thread) => {
        state.ui.hideOverlay();
        if (thread.id === currentId) {
          resolve3();
          return;
        }
        if (thread.resourceId !== currentResourceId) {
          state.harness.setResourceId({ resourceId: thread.resourceId });
        }
        try {
          await state.harness.switchThread({ threadId: thread.id });
        } catch (error) {
          if (error instanceof chunkWOKNPWRC_cjs.ThreadLockError) {
            showThreadLockPrompt(ctx, thread.title || thread.id, error.ownerPid, thread.id);
          } else {
            ctx.showError(`Failed to switch thread: ${error instanceof Error ? error.message : String(error)}`);
          }
          resolve3();
          return;
        }
        state.pendingNewThread = false;
        state.chatContainer.clear();
        state.allToolComponents = [];
        state.allSystemReminderComponents = [];
        state.pendingTools.clear();
        await ctx.renderExistingMessages();
        ctx.showInfo(`Switched to: ${thread.title || thread.id}`);
        resolve3();
      },
      onClone: async (thread) => {
        state.ui.hideOverlay();
        if (!await confirmClone(state, thread.title || thread.id)) {
          resolve3();
          return;
        }
        try {
          const customTitle = await askCloneName(state);
          const clonedThread = await state.harness.cloneThread({
            sourceThreadId: thread.id,
            ...customTitle ? { title: customTitle } : {}
          });
          state.pendingNewThread = false;
          await resetUIAfterClone(ctx, clonedThread.title || clonedThread.id);
        } catch (error) {
          ctx.showError(`Failed to clone thread: ${error instanceof Error ? error.message : String(error)}`);
        }
        resolve3();
      },
      onCancel: () => {
        state.ui.hideOverlay();
        resolve3();
      }
    });
    state.ui.showOverlay(selector, {
      width: "80%",
      maxHeight: "60%",
      anchor: "center"
    });
    selector.focused = true;
  });
}

// src/tui/commands/thread.ts
function formatDateWithLocal(date) {
  return `${date.toISOString()} [${date.toLocaleString()}]`;
}
async function handleThreadCommand(ctx) {
  const { harness, state } = ctx;
  const currentThreadId = harness.getCurrentThreadId();
  const currentResourceId = harness.getResourceId();
  const isPendingNewThread = state.pendingNewThread;
  if (!currentThreadId) {
    const lines2 = ["No active thread.", `Resource: ${currentResourceId}`];
    if (isPendingNewThread) {
      lines2.push("Pending new thread: yes");
    }
    ctx.showInfo(lines2.join("\n"));
    return;
  }
  const threads = await harness.listThreads({ allResources: true });
  const thread = threads.find((t) => t.id === currentThreadId);
  const cloneMetadata = thread?.metadata && typeof thread.metadata === "object" ? thread.metadata.clone : void 0;
  const lines = [
    `Title: ${thread?.title?.trim() || "(untitled)"}`,
    `ID: ${currentThreadId}`,
    `Resource: ${thread?.resourceId ?? currentResourceId}`
  ];
  if (thread) {
    lines.push(`Created: ${formatDateWithLocal(thread.createdAt)}`);
    lines.push(`Updated: ${formatDateWithLocal(thread.updatedAt)}`);
  }
  if (isPendingNewThread) {
    lines.push("Pending new thread: yes");
  }
  if (cloneMetadata?.sourceThreadId) {
    lines.push(`Forked from: ${cloneMetadata.sourceThreadId}`);
    if (cloneMetadata.clonedAt) {
      const clonedAt = cloneMetadata.clonedAt instanceof Date ? cloneMetadata.clonedAt : new Date(cloneMetadata.clonedAt);
      lines.push(`Forked at: ${formatDateWithLocal(clonedAt)}`);
    }
  }
  ctx.showInfo(lines.join("\n"));
}
async function handleThreadTagDirCommand(ctx) {
  const { state } = ctx;
  const threadId = state.harness.getCurrentThreadId();
  if (!threadId && state.pendingNewThread) {
    ctx.showInfo("No active thread yet \u2014 send a message first.");
    return;
  }
  if (!threadId) {
    ctx.showInfo("No active thread.");
    return;
  }
  const projectPath = state.harness.getState()?.projectPath;
  if (!projectPath) {
    ctx.showInfo("Could not detect current project path.");
    return;
  }
  const dirName = projectPath.split("/").pop() || projectPath;
  return new Promise((resolve3) => {
    const questionComponent = new AskQuestionInlineComponent(
      {
        question: `Tag this thread with directory "${dirName}"?
  ${chunkWOKNPWRC_cjs.theme.fg("dim", projectPath)}`,
        options: [{ label: "Yes" }, { label: "No" }],
        formatResult: (answer) => answer === "Yes" ? `Tagged thread with: ${dirName}` : `Thread not tagged`,
        onSubmit: async (answer) => {
          state.activeInlineQuestion = void 0;
          if (answer.toLowerCase().startsWith("y")) {
            await state.harness.setThreadSetting({ key: "projectPath", value: projectPath });
          }
          resolve3();
        },
        onCancel: () => {
          state.activeInlineQuestion = void 0;
          resolve3();
        }
      },
      state.ui
    );
    state.activeInlineQuestion = questionComponent;
    state.chatContainer.addChild(new piTui.Spacer(1));
    state.chatContainer.addChild(questionComponent);
    state.chatContainer.addChild(new piTui.Spacer(1));
    state.ui.requestRender();
    state.chatContainer.invalidate();
  });
}
async function sandboxAddPath(ctx, rawPath) {
  const harnessState = ctx.state.harness.getState();
  const currentPaths = harnessState.sandboxAllowedPaths ?? [];
  const resolved = path6__namespace.default.resolve(rawPath);
  if (currentPaths.includes(resolved)) {
    ctx.showInfo(`Path already allowed: ${resolved}`);
    return;
  }
  try {
    await fs2__default.default.promises.access(resolved);
  } catch {
    ctx.showError(`Path does not exist: ${resolved}`);
    return;
  }
  const updated = [...currentPaths, resolved];
  ctx.state.harness.setState({ sandboxAllowedPaths: updated });
  await ctx.state.harness.setThreadSetting({ key: "sandboxAllowedPaths", value: updated });
  ctx.showInfo(`Added to sandbox: ${resolved}`);
}
async function sandboxRemovePath(ctx, rawPath, currentPaths) {
  const resolved = path6__namespace.default.resolve(rawPath);
  const match = currentPaths.find((p) => p === resolved || p === rawPath);
  if (!match) {
    ctx.showError(`Path not in allowed list: ${resolved}`);
    return;
  }
  const updated = currentPaths.filter((p) => p !== match);
  ctx.state.harness.setState({ sandboxAllowedPaths: updated });
  await ctx.state.harness.setThreadSetting({ key: "sandboxAllowedPaths", value: updated });
  ctx.showInfo(`Removed from sandbox: ${match}`);
}
async function showSandboxAddPrompt(ctx) {
  return new Promise((resolve3) => {
    const questionComponent = new AskQuestionInlineComponent(
      {
        question: "Enter path to allow",
        formatResult: (answer) => {
          return `Path: ${path6__namespace.default.resolve(answer)}`;
        },
        onSubmit: async (answer) => {
          ctx.state.activeInlineQuestion = void 0;
          await sandboxAddPath(ctx, answer);
          resolve3();
        },
        onCancel: () => {
          ctx.state.activeInlineQuestion = void 0;
          resolve3();
        }
      },
      ctx.state.ui
    );
    ctx.state.activeInlineQuestion = questionComponent;
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.chatContainer.addChild(questionComponent);
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}
async function handleSandboxCommand(ctx, args) {
  const harnessState = ctx.state.harness.getState();
  const currentPaths = harnessState.sandboxAllowedPaths ?? [];
  const subcommand = args[0]?.toLowerCase();
  if (subcommand === "add" && args.length > 1) {
    await sandboxAddPath(ctx, args.slice(1).join(" ").trim());
    return;
  }
  if (subcommand === "remove" && args.length > 1) {
    await sandboxRemovePath(ctx, args.slice(1).join(" ").trim(), currentPaths);
    return;
  }
  const options = [
    { label: "Add path", description: "Allow access to another directory" }
  ];
  for (const p of currentPaths) {
    options.push({
      label: `Remove: ${p}`,
      description: p
    });
  }
  const pathsSummary = currentPaths.length ? `${currentPaths.length} allowed path${currentPaths.length > 1 ? "s" : ""}` : "no extra paths";
  return new Promise((resolve3) => {
    const questionComponent = new AskQuestionInlineComponent(
      {
        question: `Sandbox settings (${pathsSummary})`,
        options,
        formatResult: (answer) => {
          if (answer === "Add path") return "Adding sandbox path\u2026";
          if (answer.startsWith("Remove: ")) {
            return `Removed: ${answer.replace("Remove: ", "")}`;
          }
          return answer;
        },
        onSubmit: async (answer) => {
          ctx.state.activeInlineQuestion = void 0;
          if (answer === "Add path") {
            resolve3();
            await showSandboxAddPrompt(ctx);
          } else if (answer.startsWith("Remove: ")) {
            const targetPath = answer.replace("Remove: ", "");
            if (currentPaths.includes(targetPath)) {
              await sandboxRemovePath(ctx, targetPath, currentPaths);
            }
            resolve3();
          } else {
            resolve3();
          }
        },
        onCancel: () => {
          ctx.state.activeInlineQuestion = void 0;
          resolve3();
        }
      },
      ctx.state.ui
    );
    ctx.state.activeInlineQuestion = questionComponent;
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.chatContainer.addChild(questionComponent);
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}
var ModelSelectorComponent = class extends piTui.Box {
  searchInput;
  listContainer;
  allModels;
  filteredModels;
  selectedIndex = 0;
  currentModelId;
  onSelectCallback;
  onCancelCallback;
  tui;
  title;
  titleColor;
  // Focusable implementation
  _focused = false;
  get focused() {
    return this._focused;
  }
  set focused(value) {
    this._focused = value;
    this.searchInput.focused = value;
  }
  constructor(options) {
    super(2, 1, (text) => chunkWOKNPWRC_cjs.theme.bg("overlayBg", text));
    this.tui = options.tui;
    this.title = options.title ?? "Select Model";
    this.titleColor = options.titleColor;
    this.allModels = this.sortModels(options.models, options.currentModelId);
    this.currentModelId = options.currentModelId;
    this.onSelectCallback = options.onSelect;
    this.onCancelCallback = options.onCancel;
    this.filteredModels = this.allModels;
    this.buildUI();
  }
  buildUI() {
    const titleText = this.titleColor ? chalk8__default.default.bgHex(this.titleColor).white.bold(` ${this.title} `) : chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", this.title));
    this.addChild(new piTui.Text(titleText, 0, 0));
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "Type to search \u2022 \u2191\u2193 navigate \u2022 Enter select \u2022 Esc cancel"), 0, 0));
    this.addChild(new piTui.Spacer(1));
    this.searchInput = new piTui.Input();
    this.searchInput.onSubmit = () => {
      if (this.hasCustomItem && this.selectedIndex === 0) {
        const query = this.searchInput.getValue().trim();
        if (query) this.handleSelect(this.makeCustomModelItem(query));
      } else {
        const modelIndex = this.hasCustomItem ? this.selectedIndex - 1 : this.selectedIndex;
        const selected = this.filteredModels[modelIndex];
        if (selected) this.handleSelect(selected);
      }
    };
    this.addChild(this.searchInput);
    this.addChild(new piTui.Spacer(1));
    this.listContainer = new piTui.Container();
    this.addChild(this.listContainer);
    this.updateList();
  }
  sortModels(models, currentModelId) {
    const sorted = [...models];
    sorted.sort((a, b) => {
      const aIsCurrent = a.id === currentModelId;
      const bIsCurrent = b.id === currentModelId;
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;
      if (a.hasApiKey && !b.hasApiKey) return -1;
      if (!a.hasApiKey && b.hasApiKey) return 1;
      const aCount = a.useCount ?? 0;
      const bCount = b.useCount ?? 0;
      if (aCount !== bCount) return bCount - aCount;
      const providerCompare = a.provider.localeCompare(b.provider);
      if (providerCompare !== 0) return providerCompare;
      return a.modelName.localeCompare(b.modelName);
    });
    return sorted;
  }
  /** Whether the custom "Use: ..." item is showing at the top */
  hasCustomItem = false;
  filterModels(query) {
    this.filteredModels = query ? piTui.fuzzyFilter(this.allModels, query, (m) => `${m.id} ${m.provider} ${m.modelName}`) : this.allModels;
    const trimmed = query.trim();
    this.hasCustomItem = trimmed.length > 0 && this.filteredModels[0]?.id !== trimmed;
    const totalItems = this.filteredModels.length + (this.hasCustomItem ? 1 : 0);
    this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, totalItems - 1));
    this.updateList();
  }
  makeCustomModelItem(id) {
    const parts = id.split("/");
    const provider = parts.length > 1 ? parts[0] : "custom";
    const modelName = parts.length > 1 ? parts.slice(1).join("/") : id;
    return { id, provider, modelName, hasApiKey: true };
  }
  updateList() {
    this.listContainer.clear();
    const totalItems = this.filteredModels.length + (this.hasCustomItem ? 1 : 0);
    const maxVisible = 12;
    const startIndex = Math.max(0, Math.min(this.selectedIndex - Math.floor(maxVisible / 2), totalItems - maxVisible));
    const endIndex = Math.min(startIndex + maxVisible, totalItems);
    for (let i = startIndex; i < endIndex; i++) {
      if (this.hasCustomItem && i === 0) {
        const query = this.searchInput.getValue().trim();
        const isSelected2 = this.selectedIndex === 0;
        const line2 = isSelected2 ? chunkWOKNPWRC_cjs.theme.fg("accent", "\u2192 ") + chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", `Use: ${query}`)) : "  " + chunkWOKNPWRC_cjs.theme.fg("muted", `Use: ${query}`);
        this.listContainer.addChild(new piTui.Text(line2, 0, 0));
        continue;
      }
      const modelIndex = this.hasCustomItem ? i - 1 : i;
      const item = this.filteredModels[modelIndex];
      if (!item) continue;
      const isSelected = i === this.selectedIndex;
      const isCurrent = item.id === this.currentModelId;
      const checkmark = isCurrent ? chunkWOKNPWRC_cjs.theme.fg("success", " \u2713") : "";
      const noKeyIndicator = !item.hasApiKey ? chunkWOKNPWRC_cjs.theme.fg("error", " \u2717") + chunkWOKNPWRC_cjs.theme.fg("muted", item.apiKeyEnvVar ? ` (${item.apiKeyEnvVar})` : " (no key)") : "";
      let line = "";
      if (isSelected) {
        line = chunkWOKNPWRC_cjs.theme.fg("accent", "\u2192 " + item.id) + checkmark + noKeyIndicator;
      } else {
        const modelText = item.hasApiKey ? item.id : chunkWOKNPWRC_cjs.theme.fg("muted", item.id);
        line = "  " + modelText + checkmark + noKeyIndicator;
      }
      this.listContainer.addChild(new piTui.Text(line, 0, 0));
    }
    if (startIndex > 0 || endIndex < totalItems) {
      const scrollInfo = chunkWOKNPWRC_cjs.theme.fg("muted", `(${this.selectedIndex + 1}/${totalItems})`);
      this.listContainer.addChild(new piTui.Text(scrollInfo, 0, 0));
    }
    if (totalItems === 0) {
      this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "No matching models"), 0, 0));
    }
  }
  handleInput(keyData) {
    const kb = piTui.getEditorKeybindings();
    const totalItems = this.filteredModels.length + (this.hasCustomItem ? 1 : 0);
    if (kb.matches(keyData, "selectUp")) {
      if (totalItems === 0) return;
      this.selectedIndex = this.selectedIndex === 0 ? totalItems - 1 : this.selectedIndex - 1;
      this.updateList();
      this.tui.requestRender();
    } else if (kb.matches(keyData, "selectDown")) {
      if (totalItems === 0) return;
      this.selectedIndex = this.selectedIndex === totalItems - 1 ? 0 : this.selectedIndex + 1;
      this.updateList();
      this.tui.requestRender();
    } else if (kb.matches(keyData, "selectConfirm")) {
      if (this.hasCustomItem && this.selectedIndex === 0) {
        const query = this.searchInput.getValue().trim();
        if (query) this.handleSelect(this.makeCustomModelItem(query));
      } else {
        const modelIndex = this.hasCustomItem ? this.selectedIndex - 1 : this.selectedIndex;
        const selected = this.filteredModels[modelIndex];
        if (selected) this.handleSelect(selected);
      }
    } else if (kb.matches(keyData, "selectCancel")) {
      this.onCancelCallback();
    } else {
      this.searchInput.handleInput(keyData);
      this.filterModels(this.searchInput.getValue());
      this.tui.requestRender();
    }
  }
  handleSelect(model) {
    this.onSelectCallback(model);
  }
  getSearchInput() {
    return this.searchInput;
  }
};
var MaskedInput = class {
  input;
  get focused() {
    return this.input.focused;
  }
  set focused(value) {
    this.input.focused = value;
  }
  set onSubmit(fn) {
    this.input.onSubmit = fn;
  }
  set onEscape(fn) {
    this.input.onEscape = fn;
  }
  constructor() {
    this.input = new piTui.Input();
  }
  getValue() {
    return this.input.getValue();
  }
  setValue(value) {
    this.input.setValue(value);
  }
  handleInput(data) {
    this.input.handleInput(data);
  }
  invalidate() {
    this.input.invalidate();
  }
  render(width) {
    const real = this.input.getValue();
    try {
      this.input.setValue("*".repeat(real.length));
      return this.input.render(width);
    } finally {
      this.input.setValue(real);
    }
  }
};

// src/tui/components/api-key-dialog.ts
var ApiKeyDialogComponent = class extends piTui.Box {
  input;
  onSubmit;
  onCancel;
  _focused = false;
  get focused() {
    return this._focused;
  }
  set focused(value) {
    this._focused = value;
    this.input.focused = value;
  }
  constructor(options) {
    super(2, 1, (text) => chunkWOKNPWRC_cjs.theme.bg("overlayBg", text));
    this.onSubmit = options.onSubmit;
    this.onCancel = options.onCancel;
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", `API Key Required`)), 0, 0));
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", `Enter an API key for ${options.providerName}:`), 0, 0));
    if (options.apiKeyEnvVar) {
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", `You can also set ${options.apiKeyEnvVar} in your environment.`), 0, 0));
    }
    this.addChild(new piTui.Spacer(1));
    this.input = new MaskedInput();
    this.input.onSubmit = (value) => {
      const trimmed = value.trim();
      if (trimmed) {
        this.onSubmit(trimmed);
      } else {
        this.onCancel();
      }
    };
    this.addChild(this.input);
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "  Enter to submit \xB7 Esc to cancel"), 0, 0));
  }
  handleInput(data) {
    const kb = piTui.getEditorKeybindings();
    if (kb.matches(data, "selectCancel")) {
      this.onCancel();
      return;
    }
    this.input.handleInput(data);
  }
};

// src/tui/prompt-api-key.ts
function promptForApiKeyIfNeeded(ui, model, authStorage) {
  if (model.hasApiKey || !authStorage) {
    return Promise.resolve();
  }
  return new Promise((resolve3) => {
    const dialog = new ApiKeyDialogComponent({
      providerName: model.provider,
      apiKeyEnvVar: model.apiKeyEnvVar,
      onSubmit: (key) => {
        ui.hideOverlay();
        authStorage.setStoredApiKey(model.provider, key, model.apiKeyEnvVar);
        resolve3();
      },
      onCancel: () => {
        ui.hideOverlay();
        resolve3();
      }
    });
    ui.showOverlay(dialog, {
      width: "70%",
      maxHeight: "50%",
      anchor: "center"
    });
    dialog.focused = true;
  });
}
var GRADIENT_WIDTH = 30;
var BASE_COLOR = [22, 200, 88];
function getMinBrightness() {
  return chunkWOKNPWRC_cjs.getThemeMode() === "dark" ? 0.45 : 0.55;
}
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
var IDLE_BRIGHTNESS = 0.8;
function applyGradientSweep(text, offset, color, fadeProgress = 0) {
  const chars = [...text];
  const totalChars = chars.length;
  if (totalChars === 0) return text;
  const baseColor = color ? hexToRgb(color) : BASE_COLOR;
  const gradientCenter = offset % 1 * 100;
  const halfGradient = GRADIENT_WIDTH / 2;
  const minBrightness = getMinBrightness();
  const brightnessRange = 1 - minBrightness;
  let result = "";
  let batchChars = "";
  let batchR = -1, batchG = -1, batchB = -1;
  for (let i = 0; i < totalChars; i++) {
    const char = chars[i];
    if (char === " ") {
      if (batchChars) {
        result += chalk8__default.default.rgb(batchR, batchG, batchB)(batchChars);
        batchChars = "";
      }
      result += " ";
      continue;
    }
    const charPosition = i / totalChars * 100;
    let distance = Math.abs(charPosition - gradientCenter);
    if (distance > 50) distance = 100 - distance;
    const normalizedDistance = Math.min(distance / halfGradient, 1);
    const animBrightness = minBrightness + brightnessRange * (1 - normalizedDistance);
    const brightness = animBrightness + (IDLE_BRIGHTNESS - animBrightness) * fadeProgress;
    const r = Math.floor(baseColor[0] * brightness);
    const g = Math.floor(baseColor[1] * brightness);
    const b = Math.floor(baseColor[2] * brightness);
    if (r === batchR && g === batchG && b === batchB) {
      batchChars += char;
    } else {
      if (batchChars) {
        result += chalk8__default.default.rgb(batchR, batchG, batchB)(batchChars);
      }
      batchChars = char;
      batchR = r;
      batchG = g;
      batchB = b;
    }
  }
  if (batchChars) {
    result += chalk8__default.default.rgb(batchR, batchG, batchB)(batchChars);
  }
  return result;
}
var GradientAnimator = class {
  offset = 0;
  intervalId = null;
  onTick;
  _isFadingOut = false;
  _isFadingIn = false;
  _fadeProgress = 0;
  // 0 = full animation, 1 = fully idle
  constructor(onTick) {
    this.onTick = onTick;
  }
  start() {
    if (this.intervalId && !this._isFadingOut) return;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this._isFadingOut = false;
    this._isFadingIn = true;
    this._fadeProgress = 1;
    this.offset = 0;
    this.intervalId = setInterval(() => {
      this.offset += 0.03;
      if (this._isFadingIn) {
        this._fadeProgress -= 0.06;
        if (this._fadeProgress <= 0) {
          this._fadeProgress = 0;
          this._isFadingIn = false;
        }
      }
      this.onTick();
    }, 80);
  }
  /**
   * Smoothly fade the gradient to idle state over ~500ms.
   */
  fadeOut() {
    if (!this.intervalId) return;
    if (this._isFadingOut) return;
    this._isFadingOut = true;
    this._isFadingIn = false;
    this._fadeProgress = 0;
    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this._fadeProgress += 0.08;
      if (this._fadeProgress >= 1) {
        this._fadeProgress = 1;
        this.stop();
      }
      this.onTick();
    }, 40);
  }
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this._isFadingOut = false;
    this._isFadingIn = false;
    this._fadeProgress = 0;
    this.offset = 0;
  }
  getOffset() {
    return this.offset;
  }
  /** 0 = full animation, 1 = fully idle. Use to interpolate colors. */
  getFadeProgress() {
    return this._fadeProgress;
  }
  isFadingOut() {
    return this._isFadingOut;
  }
  isFadingIn() {
    return this._isFadingIn;
  }
  isRunning() {
    return this.intervalId !== null;
  }
};
var OMProgressComponent = class extends piTui.Container {
  state = harness.defaultOMProgressState();
  statusText;
  constructor() {
    super();
    this.statusText = new piTui.Text("");
    this.children.push(this.statusText);
  }
  updateProgress(progress) {
    this.state.pendingTokens = progress.pendingTokens;
    this.state.threshold = progress.threshold;
    this.state.thresholdPercent = progress.thresholdPercent;
    this.state.observationTokens = progress.observationTokens;
    this.state.reflectionThreshold = progress.reflectionThreshold;
    this.state.reflectionThresholdPercent = progress.reflectionThresholdPercent;
    this.updateDisplay();
  }
  startObservation(cycleId, _tokensToObserve) {
    this.state.status = "observing";
    this.state.cycleId = cycleId;
    this.state.startTime = Date.now();
    this.updateDisplay();
  }
  endObservation() {
    this.state.status = "idle";
    this.state.cycleId = void 0;
    this.state.startTime = void 0;
    this.updateDisplay();
  }
  startReflection(cycleId) {
    this.state.status = "reflecting";
    this.state.cycleId = cycleId;
    this.state.startTime = Date.now();
    this.updateDisplay();
  }
  endReflection() {
    this.state.status = "idle";
    this.state.cycleId = void 0;
    this.state.startTime = void 0;
    this.updateDisplay();
  }
  failOperation() {
    this.state.status = "idle";
    this.state.cycleId = void 0;
    this.state.startTime = void 0;
    this.updateDisplay();
  }
  getStatus() {
    return this.state.status;
  }
  updateDisplay() {
    if (this.state.status === "idle") {
      if (this.state.thresholdPercent > 0) {
        const percent = Math.round(this.state.thresholdPercent);
        const bar = this.renderProgressBar(percent, 10);
        this.statusText.setText(chunkWOKNPWRC_cjs.theme.fg("muted", `OM ${bar} ${percent}%`));
      } else {
        this.statusText.setText("");
      }
    } else if (this.state.status === "observing") {
      const elapsed = this.state.startTime ? Math.round((Date.now() - this.state.startTime) / 1e3) : 0;
      const spinner = this.getSpinner();
      this.statusText.setText(chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.orange)(`${spinner} Observing... ${elapsed}s`));
    } else if (this.state.status === "reflecting") {
      const elapsed = this.state.startTime ? Math.round((Date.now() - this.state.startTime) / 1e3) : 0;
      const spinner = this.getSpinner();
      this.statusText.setText(chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.pink)(`${spinner} Reflecting... ${elapsed}s`));
    }
  }
  renderProgressBar(percent, width) {
    const filled = Math.min(width, Math.round(percent / 100 * width));
    const empty = width - filled;
    const bar = "\u2501".repeat(filled) + "\u2500".repeat(empty);
    if (percent >= 90) {
      return chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.red)(bar);
    } else if (percent >= 70) {
      return chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.orange)(bar);
    } else {
      return chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.darkGray)(bar);
    }
  }
  spinnerFrame = 0;
  getSpinner() {
    const frames = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
    this.spinnerFrame = (this.spinnerFrame + 1) % frames.length;
    return frames[this.spinnerFrame];
  }
  render(maxWidth) {
    this.updateDisplay();
    return this.statusText.render(maxWidth);
  }
};
function formatTokensValue(n) {
  if (n === 0) return "0";
  const k = n / 1e3;
  const s = k.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}
function formatTokensThreshold(n) {
  const k = n / 1e3;
  const s = k.toFixed(1);
  return (s.endsWith(".0") ? s.slice(0, -2) : s) + "k";
}
function colorByPercent(text, percent) {
  if (percent >= 90) return chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.red)(text);
  if (percent >= 70) return chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.orange)(text);
  return chalk8__default.default.hex("#71717a")(text);
}
function formatObservationStatus(state, compact, labelStyler) {
  const percent = Math.round(state.thresholdPercent);
  const pct = colorByPercent(`${percent}%`, percent);
  const defaultStyler = (s) => chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.specialGray)(s);
  const styleLabel = labelStyler ?? defaultStyler;
  if (compact === "percentOnly") {
    return styleLabel("msg ") + pct;
  }
  const label = compact === "full" ? "messages" : "msg";
  const fraction = `${formatTokensValue(state.pendingTokens)}/${formatTokensThreshold(state.threshold)}`;
  const buffered = compact !== "noBuffer" && state.buffered.observations.projectedMessageRemoval > 0 ? chalk8__default.default.italic(
    chunkWOKNPWRC_cjs.theme.fg("muted", ` \u2193${formatTokensThreshold(state.buffered.observations.projectedMessageRemoval)}`)
  ) : "";
  return styleLabel(`${label} `) + colorByPercent(fraction, percent) + buffered;
}
function formatReflectionStatus(state, compact, labelStyler) {
  const percent = Math.round(state.reflectionThresholdPercent);
  const pct = colorByPercent(`${percent}%`, percent);
  const defaultStyler = (s) => chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.specialGray)(s);
  const styleLabel = labelStyler ?? defaultStyler;
  const label = styleLabel(compact === "full" ? "memory" : "mem") + " ";
  if (compact === "percentOnly") {
    return label + pct;
  }
  const fraction = `${formatTokensValue(state.observationTokens)}/${formatTokensThreshold(state.reflectionThreshold)}`;
  const savings = state.buffered.reflection.inputObservationTokens - state.buffered.reflection.observationTokens;
  const buffered = compact !== "noBuffer" && state.buffered.reflection.status === "complete" ? chalk8__default.default.italic(chunkWOKNPWRC_cjs.theme.fg("muted", ` \u2193${formatTokensThreshold(savings)}`)) : "";
  return label + colorByPercent(fraction, percent) + buffered;
}
function formatOMStatus(state) {
  return formatObservationStatus(state);
}

// src/tui/status-line.ts
var getObserverColor = () => chunkWOKNPWRC_cjs.mastra.orange;
var getReflectorColor = () => chunkWOKNPWRC_cjs.mastra.pink;
function isGenericTitle(title) {
  const lower = title.toLowerCase().trim();
  return lower === "new thread" || lower.startsWith("new thread") || lower.startsWith("clone of") || lower.startsWith("untitled");
}
function updateStatusLine(state) {
  if (!state.statusLine) return;
  const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
  const SEP = "  ";
  const omStatus = state.harness.getDisplayState().omProgress.status;
  const isObserving = omStatus === "observing";
  const isReflecting = omStatus === "reflecting";
  const showOMMode = isObserving || isReflecting;
  let modeBadge = "";
  let modeBadgeWidth = 0;
  const modes = state.harness.listModes();
  const currentMode = modes.length > 1 ? state.harness.getCurrentMode() : void 0;
  const mainModeColor = currentMode?.color;
  const modeColor = showOMMode ? isObserving ? getObserverColor() : getReflectorColor() : mainModeColor;
  const tintBg = modeColor ? chunkWOKNPWRC_cjs.tintHex(modeColor, 0.15) : void 0;
  const badgeName = showOMMode ? isObserving ? "observe" : "reflect" : currentMode ? currentMode.name || currentMode.id || "unknown" : void 0;
  if (badgeName && modeColor) {
    const [mcr, mcg, mcb] = [
      parseInt(modeColor.slice(1, 3), 16),
      parseInt(modeColor.slice(3, 5), 16),
      parseInt(modeColor.slice(5, 7), 16)
    ];
    let badgeBrightness = 0.9;
    if (state.gradientAnimator?.isRunning()) {
      const fade = state.gradientAnimator.getFadeProgress();
      const easedFade = fade * fade * (3 - 2 * fade);
      const offset = state.gradientAnimator.getOffset() % 1;
      const animBrightness = 0.65 + 0.3 * (0.5 + 0.5 * Math.sin(offset * Math.PI * 2 + Math.PI));
      badgeBrightness = animBrightness + (0.9 - animBrightness) * easedFade;
    }
    const mr = Math.floor(mcr * badgeBrightness);
    const mg = Math.floor(mcg * badgeBrightness);
    const mb = Math.floor(mcb * badgeBrightness);
    const rightHalf = tintBg ? chalk8__default.default.rgb(mr, mg, mb).bgHex(tintBg)("\u258C") : chalk8__default.default.rgb(mr, mg, mb)("\u258C");
    modeBadge = chalk8__default.default.rgb(mr, mg, mb)("\u2590") + chalk8__default.default.bgRgb(mr, mg, mb).hex("#000000").bold(badgeName.toLowerCase()) + rightHalf;
    modeBadgeWidth = badgeName.length + 2;
  } else if (badgeName) {
    modeBadge = " " + chunkWOKNPWRC_cjs.theme.fg("dim", badgeName) + " ";
    modeBadgeWidth = badgeName.length + 2;
  }
  const fullModelId = (showOMMode ? isObserving ? state.harness.getObserverModelId() : state.harness.getReflectorModelId() : state.harness.getFullModelId()) ?? "";
  const compactModelId = (modelId) => {
    const parts = modelId.split("/");
    if (parts.length >= 3) {
      return `${parts[0]}/${parts.at(-1)}`;
    }
    if (parts.length === 2) {
      return parts[1] ?? modelId;
    }
    return modelId;
  };
  const shortModelId = compactModelId(fullModelId);
  const tinyModelId = shortModelId.includes("/") ? shortModelId : shortModelId.replace(/^claude-/, "").replace(/^(\w+)-(\d+)-(\d{1,2})$/, "$1 $2.$3");
  const homedir2 = process.env.HOME || process.env.USERPROFILE || "";
  const threadTitle = state.currentThreadTitle && !isGenericTitle(state.currentThreadTitle) ? state.currentThreadTitle : null;
  let displayPath = threadTitle || state.projectInfo.rootPath;
  if (!threadTitle && homedir2 && displayPath.startsWith(homedir2)) {
    displayPath = "~" + displayPath.slice(homedir2.length);
  }
  const branch = state.projectInfo.gitBranch;
  const queuedCount = state.pendingQueuedActions.length + state.harness.getFollowUpCount();
  const queuedLabel = queuedCount > 0 ? `${queuedCount} queued` : null;
  const dirFull = !threadTitle && branch ? `${displayPath} (${branch})` : displayPath;
  const dirBranchOnly = !threadTitle && branch ? branch : null;
  const dirBranchShort = !threadTitle && branch && branch.length > 24 ? branch.slice(0, 12) + ".." + branch.slice(-8) : dirBranchOnly;
  const modelTrail = tintBg ? chalk8__default.default.hex(tintBg)("\u258C") : "";
  const styleModelId = (id) => {
    if (!state.modelAuthStatus.hasAuth) {
      const envVar = state.modelAuthStatus.apiKeyEnvVar;
      return chunkWOKNPWRC_cjs.theme.fg("dim", id) + chunkWOKNPWRC_cjs.theme.fg("error", " \u2717") + chunkWOKNPWRC_cjs.theme.fg("muted", envVar ? ` (${envVar})` : " (no key)");
    }
    if (state.gradientAnimator?.isRunning() && modeColor) {
      const fade = state.gradientAnimator.getFadeProgress();
      const easedFade = fade * fade * (3 - 2 * fade);
      const text = applyGradientSweep(id, state.gradientAnimator.getOffset(), modeColor, easedFade);
      const styled = chalk8__default.default.italic(text);
      const bg = tintBg ? chalk8__default.default.bgHex(tintBg)(styled) : styled;
      return bg + modelTrail;
    }
    if (modeColor) {
      const [cr, cg, cb] = [
        parseInt(modeColor.slice(1, 3), 16),
        parseInt(modeColor.slice(3, 5), 16),
        parseInt(modeColor.slice(5, 7), 16)
      ];
      const idleBright = 0.8;
      const fgStyled = chalk8__default.default.rgb(Math.floor(cr * idleBright), Math.floor(cg * idleBright), Math.floor(cb * idleBright)).bold.italic(id);
      const bg = tintBg ? chalk8__default.default.bgHex(tintBg)(fgStyled) : fgStyled;
      return bg + modelTrail;
    }
    return chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.specialGray).bold.italic(id);
  };
  let shortModeBadge = "";
  let shortModeBadgeWidth = 0;
  if (badgeName && modeColor) {
    const shortName = badgeName.toLowerCase().charAt(0);
    const [mcr, mcg, mcb] = [
      parseInt(modeColor.slice(1, 3), 16),
      parseInt(modeColor.slice(3, 5), 16),
      parseInt(modeColor.slice(5, 7), 16)
    ];
    let sBadgeBrightness = 0.9;
    if (state.gradientAnimator?.isRunning()) {
      const fade = state.gradientAnimator.getFadeProgress();
      if (fade < 1) {
        const offset = state.gradientAnimator.getOffset() % 1;
        const animBrightness = 0.65 + 0.3 * (0.5 + 0.5 * Math.sin(offset * Math.PI * 2 + Math.PI));
        sBadgeBrightness = animBrightness + (0.9 - animBrightness) * fade;
      }
    }
    const sr = Math.floor(mcr * sBadgeBrightness);
    const sg = Math.floor(mcg * sBadgeBrightness);
    const sb = Math.floor(mcb * sBadgeBrightness);
    const shortRightHalf = tintBg ? chalk8__default.default.rgb(sr, sg, sb).bgHex(tintBg)("\u258C") : chalk8__default.default.rgb(sr, sg, sb)("\u258C");
    shortModeBadge = chalk8__default.default.rgb(sr, sg, sb)("\u2590") + chalk8__default.default.bgRgb(sr, sg, sb).hex("#000000").bold(shortName) + shortRightHalf;
    shortModeBadgeWidth = shortName.length + 2;
  } else if (badgeName) {
    const shortName = badgeName.toLowerCase().charAt(0);
    shortModeBadge = " " + chunkWOKNPWRC_cjs.theme.fg("dim", shortName) + " ";
    shortModeBadgeWidth = shortName.length + 2;
  }
  const buildLine = (opts) => {
    const parts = [];
    parts.push({
      plain: `${opts.modelId}${tintBg ? " " : ""}`,
      styled: styleModelId(opts.modelId)
    });
    const useBadge = opts.badge === "short" ? shortModeBadge : modeBadge;
    const useBadgeWidth = opts.badge === "short" ? shortModeBadgeWidth : modeBadgeWidth;
    const ds = state.harness.getDisplayState();
    const msgLabelStyler = ds.bufferingMessages && state.gradientAnimator?.isRunning() ? (label) => applyGradientSweep(
      label,
      state.gradientAnimator.getOffset(),
      getObserverColor(),
      state.gradientAnimator.getFadeProgress()
    ) : void 0;
    const obsLabelStyler = ds.bufferingObservations && state.gradientAnimator?.isRunning() ? (label) => applyGradientSweep(
      label,
      state.gradientAnimator.getOffset(),
      getReflectorColor(),
      state.gradientAnimator.getFadeProgress()
    ) : void 0;
    const omProg = state.harness.getDisplayState().omProgress;
    const obs = formatObservationStatus(omProg, opts.memCompact, msgLabelStyler);
    const ref = formatReflectionStatus(omProg, opts.memCompact, obsLabelStyler);
    if (obs) {
      parts.push({ plain: obs, styled: obs });
    }
    if (ref) {
      parts.push({ plain: ref, styled: ref });
    }
    if (opts.showQueue && queuedLabel) {
      parts.push({
        plain: queuedLabel,
        styled: chunkWOKNPWRC_cjs.theme.fg("warning", queuedLabel)
      });
    }
    let dirText = opts.dir !== void 0 ? opts.dir : opts.showDir ? dirFull : null;
    const nonDirWidth = useBadgeWidth + parts.reduce((sum, p, i) => sum + piTui.visibleWidth(p.plain) + (i > 0 ? SEP.length : 0), 0);
    if (dirText) {
      const availableForDir = termWidth - nonDirWidth - SEP.length - 1;
      const dirWidth = piTui.visibleWidth(dirText);
      const MIN_TRUNCATED_DIR = 10;
      if (dirWidth > availableForDir && availableForDir >= MIN_TRUNCATED_DIR) {
        dirText = dirText.slice(0, availableForDir - 1) + "\u2026";
      } else if (dirWidth > availableForDir) {
        dirText = null;
      }
    }
    if (dirText) {
      parts.push({
        plain: dirText,
        styled: chunkWOKNPWRC_cjs.theme.fg("dim", dirText)
      });
    }
    const totalPlain = useBadgeWidth + parts.reduce((sum, p, i) => sum + piTui.visibleWidth(p.plain) + (i > 0 ? SEP.length : 0), 0);
    if (totalPlain + 1 > termWidth) return null;
    let styledLine;
    const hasDir = !!dirText;
    if (hasDir && parts.length >= 3) {
      const leftPart = parts[0];
      const centerParts = parts.slice(1, -1);
      const dirPart = parts[parts.length - 1];
      const leftWidth = useBadgeWidth + piTui.visibleWidth(leftPart.plain);
      const centerWidth = centerParts.reduce((sum, p, i) => sum + piTui.visibleWidth(p.plain) + (i > 0 ? SEP.length : 0), 0);
      const rightWidth = piTui.visibleWidth(dirPart.plain);
      const totalContent = leftWidth + centerWidth + rightWidth;
      const freeSpace = termWidth - totalContent;
      const gapLeft = Math.floor(freeSpace / 2);
      const gapRight = freeSpace - gapLeft;
      styledLine = useBadge + leftPart.styled + " ".repeat(Math.max(gapLeft, 1)) + centerParts.map((p) => p.styled).join(SEP) + " ".repeat(Math.max(gapRight, 1)) + dirPart.styled;
    } else if (hasDir && parts.length === 2) {
      const mainStr = useBadge + parts[0].styled;
      const dirPart = parts[parts.length - 1];
      const gap = termWidth - totalPlain;
      styledLine = mainStr + " ".repeat(gap + SEP.length) + dirPart.styled;
    } else {
      styledLine = useBadge + parts.map((p) => p.styled).join(SEP);
    }
    return { plain: "", styled: styledLine };
  };
  const result = (
    // 1. Full badge + full model + long labels + queue count + full dir
    buildLine({ modelId: fullModelId, memCompact: "full", showDir: false, dir: dirFull, showQueue: true }) ?? // 2. Full badge + full model + queue count + branch only (drop path)
    buildLine({ modelId: fullModelId, memCompact: "full", showDir: false, dir: dirBranchOnly, showQueue: true }) ?? // 3. Full badge + full model + queue count + abbreviated branch
    buildLine({ modelId: fullModelId, memCompact: "full", showDir: false, dir: dirBranchShort, showQueue: true }) ?? // 4. Drop directory entirely
    buildLine({ modelId: fullModelId, memCompact: "full", showDir: false, showQueue: true }) ?? // 5. Drop provider + "claude-" prefix, keep full labels + queue count
    buildLine({ modelId: tinyModelId, memCompact: "full", showDir: false, showQueue: true }) ?? // 6. Short labels (msg/mem) + queue count
    buildLine({ modelId: tinyModelId, showDir: false, showQueue: true }) ?? // 7. Short badge + short labels + queue count
    buildLine({ modelId: tinyModelId, showDir: false, badge: "short", showQueue: true }) ?? // 8. Short badge + fractions (drop buffer indicator, keep queue count)
    buildLine({
      modelId: tinyModelId,
      memCompact: "noBuffer",
      showDir: false,
      badge: "short",
      showQueue: true
    }) ?? // 9. Full badge + percent only + queue count
    buildLine({
      modelId: tinyModelId,
      memCompact: "percentOnly",
      showDir: false,
      badge: "full",
      showQueue: true
    }) ?? // 10. Short badge + percent only + queue count
    buildLine({
      modelId: tinyModelId,
      memCompact: "percentOnly",
      showDir: false,
      badge: "short",
      showQueue: true
    }) ?? // 11. Model only + queue count
    buildLine({ modelId: tinyModelId, showDir: false, badge: void 0, showQueue: true }) ?? // 12. Badge only + queue count
    buildLine({ modelId: "", showDir: false, badge: "short", showQueue: true }) ?? // 13. Model only
    buildLine({ modelId: tinyModelId, showDir: false, badge: void 0 }) ?? // 14. Badge only
    buildLine({ modelId: "", showDir: false, badge: "short" })
  );
  state.statusLine.setText(result?.styled ?? shortModeBadge + styleModelId(tinyModelId));
  if (state.memoryStatusLine) {
    state.memoryStatusLine.setText("");
  }
  state.ui.requestRender();
}

// src/tui/commands/models-pack.ts
async function selectModel(ctx, title, modeColor, currentModelId) {
  const availableModels = await ctx.state.harness.listAvailableModels();
  if (availableModels.length === 0) return void 0;
  return new Promise((resolve3) => {
    const selector = new ModelSelectorComponent({
      tui: ctx.state.ui,
      models: availableModels,
      currentModelId,
      title,
      titleColor: modeColor,
      onSelect: async (model) => {
        ctx.state.ui.hideOverlay();
        await promptForApiKeyIfNeeded(ctx.state.ui, model, ctx.authStorage);
        resolve3(model.id);
      },
      onCancel: () => {
        ctx.state.ui.hideOverlay();
        resolve3(void 0);
      }
    });
    ctx.state.ui.showOverlay(selector, {
      width: "80%",
      maxHeight: "60%",
      anchor: "center"
    });
    selector.focused = true;
  });
}
async function askCustomPackName(ctx, defaultName) {
  return new Promise((resolve3) => {
    const question = new AskQuestionInlineComponent(
      {
        question: "Name this custom pack",
        formatResult: (answer) => `Custom pack: ${answer}`,
        onSubmit: (answer) => {
          ctx.state.activeInlineQuestion = void 0;
          const trimmed = answer.trim();
          resolve3(trimmed.length > 0 ? trimmed : null);
        },
        onCancel: () => {
          ctx.state.activeInlineQuestion = void 0;
          resolve3(null);
        }
      },
      ctx.state.ui
    );
    if (defaultName) {
      question.input?.setValue?.(defaultName);
    }
    ctx.state.activeInlineQuestion = question;
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.chatContainer.addChild(question);
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}
async function askCustomPackAction(ctx, pack) {
  const actions = [
    { id: "activate", label: "Activate", description: "Use this pack as-is" },
    { id: "edit", label: "Edit", description: "Update this pack" },
    { id: "delete", label: "Delete", description: "Remove this custom pack" }
  ];
  return new Promise((resolve3) => {
    const container = new piTui.Box(1, 1);
    container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", `Custom pack: ${pack.name}`)), 0, 0));
    container.addChild(new piTui.Spacer(1));
    const items = actions.map((action) => ({
      value: action.id,
      label: `  ${action.label}  ${chunkWOKNPWRC_cjs.theme.fg("dim", action.description)}`
    }));
    const selectList = new piTui.SelectList(items, items.length, chunkWOKNPWRC_cjs.getSelectListTheme());
    const detailText = new piTui.Text("", 0, 0);
    const detailById = {
      activate: getPackDetail(pack),
      edit: chunkWOKNPWRC_cjs.theme.fg("dim", "  Edit one setting at a time (Rename, plan, build, fast)."),
      delete: chunkWOKNPWRC_cjs.theme.fg("error", "  Permanently removes this custom pack from settings.")
    };
    selectList.onSelectionChange = (item) => {
      detailText.setText(detailById[item.value] ?? "");
      ctx.state.ui.requestRender();
    };
    selectList.onSelect = (item) => {
      ctx.state.activeInlineQuestion = void 0;
      container.clear();
      container.addChild(
        new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", `${chunkWOKNPWRC_cjs.theme.fg("success", "\u2713")} ${pack.name} \u2192 ${chunkWOKNPWRC_cjs.theme.bold(item.value)}`), 0, 0)
      );
      ctx.state.ui.requestRender();
      resolve3(item.value);
    };
    selectList.onCancel = () => {
      ctx.state.activeInlineQuestion = void 0;
      container.clear();
      container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", `${chunkWOKNPWRC_cjs.theme.fg("error", "\u2717")} ${pack.name} (cancelled)`), 0, 0));
      ctx.state.ui.requestRender();
      resolve3(null);
    };
    detailText.setText(detailById["activate"]);
    container.addChild(selectList);
    container.addChild(new piTui.Spacer(1));
    container.addChild(detailText);
    container.addChild(new piTui.Spacer(1));
    container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "\u2191\u2193 navigate \xB7 Enter select \xB7 Esc cancel"), 0, 0));
    const inputShim = { handleInput: (data) => selectList.handleInput(data) };
    ctx.state.activeInlineQuestion = inputShim;
    ctx.state.chatContainer.addChild(container);
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}
async function askCustomPackEditTarget(ctx, pack) {
  return new Promise((resolve3) => {
    const container = new piTui.Box(1, 1);
    container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", `Edit custom pack: ${pack.name}`)), 0, 0));
    container.addChild(new piTui.Spacer(1));
    const selectList = new piTui.SelectList(
      [
        { value: "rename", label: `  Rename \u2192 ${chunkWOKNPWRC_cjs.theme.fg("text", pack.name)}` },
        { value: "plan", label: `  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.purple)("plan")} \u2192 ${chunkWOKNPWRC_cjs.theme.fg("text", pack.models.plan)}` },
        { value: "build", label: `  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.green)("build")} \u2192 ${chunkWOKNPWRC_cjs.theme.fg("text", pack.models.build)}` },
        { value: "fast", label: `  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.orange)("fast")} \u2192 ${chunkWOKNPWRC_cjs.theme.fg("text", pack.models.fast)}` },
        { value: "save", label: `  ${chunkWOKNPWRC_cjs.theme.fg("success", "Save")}` }
      ],
      5,
      chunkWOKNPWRC_cjs.getSelectListTheme()
    );
    const cleanup = () => {
      if (ctx.state.chatContainer.children.includes(container)) {
        ctx.state.chatContainer.removeChild(container);
      }
      ctx.state.ui.requestRender();
      ctx.state.chatContainer.invalidate();
    };
    selectList.onSelect = (item) => {
      ctx.state.activeInlineQuestion = void 0;
      cleanup();
      resolve3(item.value);
    };
    selectList.onCancel = () => {
      ctx.state.activeInlineQuestion = void 0;
      cleanup();
      resolve3(null);
    };
    container.addChild(selectList);
    container.addChild(new piTui.Spacer(1));
    container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "\u2191\u2193 navigate \xB7 Enter select \xB7 Esc cancel"), 0, 0));
    const inputShim = { handleInput: (data) => selectList.handleInput(data) };
    ctx.state.activeInlineQuestion = inputShim;
    ctx.state.chatContainer.addChild(container);
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}
async function runCustomFlow(ctx, options) {
  const modes = [
    { id: "plan", label: "plan", color: chunkWOKNPWRC_cjs.mastra.purple },
    { id: "build", label: "build", color: chunkWOKNPWRC_cjs.mastra.green },
    { id: "fast", label: "fast", color: chunkWOKNPWRC_cjs.mastra.orange }
  ];
  const name = options?.skipNamePrompt ? options?.name : await askCustomPackName(ctx, void 0);
  if (!name) return null;
  const existing = options?.models ?? { build: "", plan: "", fast: "" };
  const models = {
    build: existing.build ?? "",
    plan: existing.plan ?? "",
    fast: existing.fast ?? ""
  };
  for (const mode of modes) {
    const modelId = await selectModel(
      ctx,
      `Select model for ${mode.label} mode`,
      mode.color,
      models[mode.id] || void 0
    );
    if (!modelId) return null;
    models[mode.id] = modelId;
  }
  return {
    id: `custom:${name}`,
    name,
    description: "Saved custom pack",
    models
  };
}
async function runCustomPackEditFlow(ctx, pack) {
  let workingPack = { ...pack, models: { ...pack.models } };
  let previousPackId;
  while (true) {
    const editTarget = await askCustomPackEditTarget(ctx, workingPack);
    if (!editTarget) return null;
    if (editTarget === "save") return { pack: workingPack, previousPackId };
    if (editTarget === "rename") {
      const renamed = await askCustomPackName(ctx, workingPack.name);
      if (!renamed) continue;
      const renamedPack = {
        ...workingPack,
        id: `custom:${renamed}`,
        name: renamed
      };
      if (renamedPack.id !== pack.id && !previousPackId) previousPackId = pack.id;
      workingPack = renamedPack;
      continue;
    }
    const modeColors = {
      plan: chunkWOKNPWRC_cjs.mastra.purple,
      build: chunkWOKNPWRC_cjs.mastra.green,
      fast: chunkWOKNPWRC_cjs.mastra.orange
    };
    const modelId = await selectModel(
      ctx,
      `Select model for ${editTarget} mode`,
      modeColors[editTarget],
      workingPack.models[editTarget]
    );
    if (!modelId) continue;
    workingPack = {
      ...workingPack,
      models: {
        ...workingPack.models,
        [editTarget]: modelId
      }
    };
  }
}
function upsertCustomPackInSettings(settings, pack, modeDefaults, previousPackId, setActive = true) {
  if (!pack.id.startsWith("custom:")) return;
  if (previousPackId && previousPackId.startsWith("custom:") && previousPackId !== pack.id) {
    removeCustomPackFromSettings(settings, previousPackId);
  }
  const customName = pack.id.slice("custom:".length);
  const entry = { name: customName, models: modeDefaults, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  const idx = settings.customModelPacks.findIndex((p) => p.name === customName);
  if (idx >= 0) {
    settings.customModelPacks[idx] = entry;
  } else {
    settings.customModelPacks.push(entry);
  }
  if (setActive) {
    settings.models.activeModelPackId = pack.id;
    settings.models.modeDefaults = modeDefaults;
  }
}
function removeCustomPackFromSettings(settings, packId) {
  if (!packId.startsWith("custom:")) return;
  const packName = packId.slice("custom:".length);
  const removedPack = settings.customModelPacks.find((p) => p.name === packName);
  settings.customModelPacks = settings.customModelPacks.filter((p) => p.name !== packName);
  const modeDefaultsMatchRemovedPack = !!removedPack && settings.models.modeDefaults.plan === removedPack.models.plan && settings.models.modeDefaults.build === removedPack.models.build && settings.models.modeDefaults.fast === removedPack.models.fast;
  if (settings.models.activeModelPackId === packId) {
    settings.models.activeModelPackId = null;
    settings.models.modeDefaults = {};
  } else if (modeDefaultsMatchRemovedPack) {
    settings.models.modeDefaults = {};
  }
  if (settings.onboarding.modePackId === packId) {
    settings.onboarding.modePackId = null;
  }
}
async function applyPack(ctx, pack, previousPackId) {
  const harness = ctx.state.harness;
  const modes = harness.listModes();
  for (const mode of modes) {
    const modelId = pack.models[mode.id];
    if (modelId) {
      mode.defaultModelId = modelId;
      await harness.setThreadSetting({ key: `modeModelId_${mode.id}`, value: modelId });
    }
  }
  const currentModeId = harness.getCurrentModeId();
  const currentModeModel = pack.models[currentModeId];
  if (currentModeModel) {
    await harness.switchModel({ modelId: currentModeModel });
  }
  const subagentModeMap = { explore: "fast", plan: "plan", execute: "build" };
  for (const [agentType, modeId] of Object.entries(subagentModeMap)) {
    const saModelId = pack.models[modeId];
    if (saModelId) {
      await harness.setSubagentModelId({ modelId: saModelId, agentType });
    }
  }
  await harness.setThreadSetting({ key: chunkWOKNPWRC_cjs.THREAD_ACTIVE_MODEL_PACK_ID_KEY, value: pack.id });
  const s = chunkWOKNPWRC_cjs.loadSettings();
  const modeDefaults = {};
  for (const mode of modes) {
    const modelId = pack.models[mode.id];
    if (modelId) modeDefaults[mode.id] = modelId;
  }
  if (pack.id.startsWith("custom:")) {
    upsertCustomPackInSettings(s, pack, modeDefaults, previousPackId);
  } else {
    s.models.activeModelPackId = pack.id;
    s.models.modeDefaults = {};
  }
  s.models.subagentModels = {};
  const hasOpenAI = Object.values(pack.models).some((m) => m.startsWith("openai/"));
  const currentThinking = harness.getState()?.thinkingLevel ?? "off";
  if (hasOpenAI && currentThinking === "off") {
    await harness.setState({ thinkingLevel: "low" });
    s.preferences.thinkingLevel = "low";
  }
  chunkWOKNPWRC_cjs.saveSettings(s);
  updateStatusLine(ctx.state);
}
function getPackDetail(pack) {
  if (pack.id === "custom") {
    return chunkWOKNPWRC_cjs.theme.fg("dim", "  Create a named custom pack and pick a model for each mode.");
  }
  return [
    `  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.purple)("plan")}  \u2192 ${chunkWOKNPWRC_cjs.theme.fg("text", pack.models.plan)}`,
    `  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.green)("build")} \u2192 ${chunkWOKNPWRC_cjs.theme.fg("text", pack.models.build)}`,
    `  ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.orange)("fast")}  \u2192 ${chunkWOKNPWRC_cjs.theme.fg("text", pack.models.fast)}`
  ].join("\n");
}
async function saveCustomPackEdits(ctx, pack, previousPackId) {
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  const wasActive = previousPackId ? settings.models.activeModelPackId === previousPackId : settings.models.activeModelPackId === pack.id;
  const wasOnboarding = previousPackId ? settings.onboarding.modePackId === previousPackId : settings.onboarding.modePackId === pack.id;
  const modeDefaults = {
    plan: pack.models.plan,
    build: pack.models.build,
    fast: pack.models.fast
  };
  upsertCustomPackInSettings(settings, pack, modeDefaults, previousPackId, false);
  if (wasActive) {
    settings.models.activeModelPackId = pack.id;
  }
  if (wasOnboarding) {
    settings.onboarding.modePackId = pack.id;
  }
  chunkWOKNPWRC_cjs.saveSettings(settings);
  if (previousPackId && previousPackId !== pack.id) {
    const harness = ctx.state.harness;
    const threadId = harness.getCurrentThreadId();
    const thread = threadId ? (await harness.listThreads()).find((t) => t.id === threadId) : void 0;
    const threadPackId = thread?.metadata?.[chunkWOKNPWRC_cjs.THREAD_ACTIVE_MODEL_PACK_ID_KEY] ?? null;
    if (threadPackId === previousPackId) {
      await harness.setThreadSetting({ key: chunkWOKNPWRC_cjs.THREAD_ACTIVE_MODEL_PACK_ID_KEY, value: pack.id });
    }
  }
}
async function deleteCustomPack(ctx, pack) {
  if (!pack.id.startsWith("custom:")) return;
  const harness = ctx.state.harness;
  const threadId = harness.getCurrentThreadId();
  const thread = threadId ? (await harness.listThreads()).find((t) => t.id === threadId) : void 0;
  const threadPackId = thread?.metadata?.[chunkWOKNPWRC_cjs.THREAD_ACTIVE_MODEL_PACK_ID_KEY] ?? null;
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  removeCustomPackFromSettings(settings, pack.id);
  chunkWOKNPWRC_cjs.saveSettings(settings);
  if (threadPackId === pack.id) {
    await harness.setThreadSetting({ key: chunkWOKNPWRC_cjs.THREAD_ACTIVE_MODEL_PACK_ID_KEY, value: null });
  }
}
async function handleModelsPackCommand(ctx) {
  const harness = ctx.state.harness;
  const models = await harness.listAvailableModels();
  const hasEnv = (provider) => models.some((m) => m.provider === provider && m.hasApiKey);
  const accessLevel = (storageProviderId) => {
    const cred = ctx.authStorage?.get(storageProviderId);
    if (cred?.type === "oauth") return "oauth";
    if (cred?.type === "api_key" && cred.key.trim().length > 0) return "apikey";
    return false;
  };
  const access = {
    anthropic: accessLevel("anthropic"),
    openai: accessLevel("openai-codex"),
    cerebras: hasEnv("cerebras") ? "apikey" : false,
    google: hasEnv("google") ? "apikey" : false,
    deepseek: hasEnv("deepseek") ? "apikey" : false
  };
  const seen = new Set(Object.keys(access));
  for (const m of models) {
    if (!seen.has(m.provider) && m.hasApiKey) {
      access[m.provider] = "apikey";
      seen.add(m.provider);
    }
  }
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  const packs = chunkWOKNPWRC_cjs.getAvailableModePacks(access, settings.customModelPacks);
  if (packs.length === 0) {
    ctx.showInfo("No model packs available. Configure provider auth first.");
    return;
  }
  const threadId = harness.getCurrentThreadId();
  const thread = threadId ? (await harness.listThreads()).find((t) => t.id === threadId) : void 0;
  const currentPackId = chunkWOKNPWRC_cjs.resolveThreadActiveModelPackId(
    settings,
    packs,
    thread?.metadata
  );
  const items = packs.map((p) => ({
    value: p.id,
    label: `  ${p.name}  ${chunkWOKNPWRC_cjs.theme.fg("dim", p.description)}${p.id === currentPackId ? chunkWOKNPWRC_cjs.theme.fg("dim", " (current)") : ""}`
  }));
  return new Promise((resolve3) => {
    const container = new piTui.Box(1, 1);
    container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "Switch model pack")), 0, 0));
    container.addChild(new piTui.Spacer(1));
    const selectList = new piTui.SelectList(items, items.length, chunkWOKNPWRC_cjs.getSelectListTheme());
    const detailText = new piTui.Text("", 0, 0);
    const updateDetail = (packId) => {
      const pack = packs.find((p) => p.id === packId);
      if (!pack) return;
      detailText.setText(getPackDetail(pack));
      ctx.state.ui.requestRender();
    };
    const collapseResult = (result) => {
      container.clear();
      if (result === "cancelled") {
        container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", `${chunkWOKNPWRC_cjs.theme.fg("error", "\u2717")} Model pack (cancelled)`), 0, 0));
      } else if (result) {
        container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", `${chunkWOKNPWRC_cjs.theme.fg("success", "\u2713")} ${result}`), 0, 0));
      }
      ctx.state.ui.requestRender();
    };
    selectList.onSelect = async (item) => {
      ctx.state.activeInlineQuestion = void 0;
      let pack = packs.find((p) => p.id === item.value);
      let previousPackId;
      if (!pack) {
        collapseResult("cancelled");
        resolve3();
        return;
      }
      if (pack.id === "custom") {
        collapseResult(null);
        pack = await runCustomFlow(ctx);
      } else if (pack.id.startsWith("custom:")) {
        while (true) {
          const action = await askCustomPackAction(ctx, pack);
          if (action === null) {
            collapseResult("cancelled");
            resolve3();
            return;
          }
          if (action === "delete") {
            await deleteCustomPack(ctx, pack);
            collapseResult(`Deleted custom pack \u2192 ${chunkWOKNPWRC_cjs.theme.bold(pack.name)}`);
            ctx.showInfo(`Deleted custom pack: ${pack.name}`);
            resolve3();
            return;
          }
          if (action === "activate") {
            break;
          }
          const edited = await runCustomPackEditFlow(ctx, pack);
          if (!edited) {
            continue;
          }
          previousPackId = edited.previousPackId;
          pack = edited.pack;
          await saveCustomPackEdits(ctx, pack, previousPackId);
          previousPackId = void 0;
          ctx.showInfo(`Updated custom pack: ${pack.name}`);
        }
      }
      if (!pack) {
        collapseResult("cancelled");
        resolve3();
        return;
      }
      await applyPack(ctx, pack, previousPackId);
      collapseResult(`Model pack \u2192 ${chunkWOKNPWRC_cjs.theme.bold(pack.name)}`);
      ctx.showInfo(`Switched to ${pack.name} pack`);
      resolve3();
    };
    selectList.onCancel = () => {
      ctx.state.activeInlineQuestion = void 0;
      collapseResult("cancelled");
      resolve3();
    };
    selectList.onSelectionChange = (item) => {
      updateDetail(item.value);
    };
    container.addChild(selectList);
    container.addChild(new piTui.Spacer(1));
    container.addChild(detailText);
    container.addChild(new piTui.Spacer(1));
    container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "\u2191\u2193 navigate \xB7 Enter select \xB7 Esc cancel"), 0, 0));
    const currentIdx = packs.findIndex((p) => p.id === currentPackId);
    const initialIdx = currentIdx >= 0 ? currentIdx : 0;
    if (initialIdx > 0) selectList.setSelectedIndex(initialIdx);
    updateDetail(packs[initialIdx].id);
    const inputShim = { handleInput: (data) => selectList.handleInput(data) };
    ctx.state.activeInlineQuestion = inputShim;
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.chatContainer.addChild(container);
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}
function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
function normalizeProvider(input) {
  return {
    name: input.name.trim(),
    url: input.url.trim(),
    apiKey: input.apiKey?.trim() || void 0,
    models: [...new Set(input.models.map((model) => model.trim()).filter(Boolean))]
  };
}
function upsertCustomProviderInSettings(settings, provider, previousProviderId) {
  const next = normalizeProvider(provider);
  const nextProviderId = chunkWOKNPWRC_cjs.getCustomProviderId(next.name);
  const filteredProviders = settings.customProviders.filter((existing) => {
    const id = chunkWOKNPWRC_cjs.getCustomProviderId(existing.name);
    return id !== nextProviderId && (!previousProviderId || id !== previousProviderId);
  });
  settings.customProviders = [...filteredProviders, next];
}
function removeCustomProviderFromSettings(settings, providerId) {
  settings.customProviders = settings.customProviders.filter(
    (provider) => chunkWOKNPWRC_cjs.getCustomProviderId(provider.name) !== providerId
  );
}
function addModelToCustomProviderInSettings(settings, providerId, modelName) {
  const trimmed = modelName.trim();
  if (!trimmed) return false;
  const provider = settings.customProviders.find((entry) => chunkWOKNPWRC_cjs.getCustomProviderId(entry.name) === providerId);
  if (!provider) return false;
  provider.models = [.../* @__PURE__ */ new Set([...provider.models, trimmed])];
  return true;
}
function removeModelFromCustomProviderInSettings(settings, providerId, modelName) {
  const provider = settings.customProviders.find((entry) => chunkWOKNPWRC_cjs.getCustomProviderId(entry.name) === providerId);
  if (!provider) return false;
  const before = provider.models.length;
  provider.models = provider.models.filter((model) => model !== modelName);
  return provider.models.length < before;
}
function askText(ctx, question, defaultValue, allowEmptyInput = false) {
  return new Promise((resolve3) => {
    const component = new AskQuestionInlineComponent(
      {
        question,
        allowEmptyInput,
        onSubmit: (answer) => {
          ctx.state.activeInlineQuestion = void 0;
          const trimmed = answer.trim();
          resolve3(trimmed.length > 0 ? trimmed : null);
        },
        onCancel: () => {
          ctx.state.activeInlineQuestion = void 0;
          resolve3(null);
        }
      },
      ctx.state.ui
    );
    if (defaultValue) {
      component.input?.setValue?.(defaultValue);
    }
    ctx.state.activeInlineQuestion = component;
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.chatContainer.addChild(component);
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}
async function askOptionalText(ctx, question, defaultValue) {
  const answer = await askText(ctx, `${question} (leave blank to skip)`, defaultValue, true);
  return answer?.trim() || void 0;
}
function askSelect(ctx, question, options) {
  return new Promise((resolve3) => {
    const component = new AskQuestionInlineComponent(
      {
        question,
        options: options.map((option) => ({ label: option.label, description: option.description })),
        onSubmit: (answer) => {
          ctx.state.activeInlineQuestion = void 0;
          const selected = options.find((option) => option.label === answer);
          resolve3(selected?.value ?? null);
        },
        onCancel: () => {
          ctx.state.activeInlineQuestion = void 0;
          resolve3(null);
        }
      },
      ctx.state.ui
    );
    ctx.state.activeInlineQuestion = component;
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.chatContainer.addChild(component);
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}
async function createProviderFlow(ctx) {
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  const name = await askText(ctx, "Custom provider name");
  if (!name) return;
  const providerId = chunkWOKNPWRC_cjs.getCustomProviderId(name);
  if (settings.customProviders.some((provider) => chunkWOKNPWRC_cjs.getCustomProviderId(provider.name) === providerId)) {
    ctx.showError(`Provider already exists: ${name}`);
    return;
  }
  const url = await askText(ctx, "Base URL (OpenAI-compatible endpoint)");
  if (!url) return;
  if (!isValidUrl(url)) {
    ctx.showError("Invalid URL. Use a full http(s) URL.");
    return;
  }
  const apiKey = await askOptionalText(ctx, "API key");
  upsertCustomProviderInSettings(settings, { name, url, apiKey, models: [] });
  chunkWOKNPWRC_cjs.saveSettings(settings);
  ctx.showInfo(`Added custom provider: ${name}`);
  await manageProviderFlow(ctx, providerId);
}
async function editProviderFlow(ctx, providerId) {
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  const provider = settings.customProviders.find((entry) => chunkWOKNPWRC_cjs.getCustomProviderId(entry.name) === providerId);
  if (!provider) {
    ctx.showError("Provider not found.");
    return;
  }
  const name = await askText(ctx, "Provider name", provider.name);
  if (!name) return;
  const nextProviderId = chunkWOKNPWRC_cjs.getCustomProviderId(name);
  if (nextProviderId !== providerId && settings.customProviders.some((entry) => chunkWOKNPWRC_cjs.getCustomProviderId(entry.name) === nextProviderId)) {
    ctx.showError(`Provider already exists: ${name}`);
    return;
  }
  const url = await askText(ctx, "Base URL", provider.url);
  if (!url) return;
  if (!isValidUrl(url)) {
    ctx.showError("Invalid URL. Use a full http(s) URL.");
    return;
  }
  const apiKey = await askOptionalText(ctx, "API key", provider.apiKey);
  upsertCustomProviderInSettings(
    settings,
    {
      ...provider,
      name,
      url,
      apiKey
    },
    providerId
  );
  chunkWOKNPWRC_cjs.saveSettings(settings);
  ctx.showInfo(`Updated custom provider: ${name}`);
}
async function addProviderModelFlow(ctx, providerId) {
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  const provider = settings.customProviders.find((entry) => chunkWOKNPWRC_cjs.getCustomProviderId(entry.name) === providerId);
  if (!provider) {
    ctx.showError("Provider not found.");
    return;
  }
  const modelName = await askText(ctx, `Model ID for ${provider.name}`);
  if (!modelName) return;
  const added = addModelToCustomProviderInSettings(settings, providerId, modelName);
  if (!added) {
    ctx.showError("Unable to add model to provider.");
    return;
  }
  chunkWOKNPWRC_cjs.saveSettings(settings);
  ctx.showInfo(`Added model: ${chunkWOKNPWRC_cjs.toCustomProviderModelId(provider.name, modelName)}`);
}
async function removeProviderModelFlow(ctx, providerId) {
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  const provider = settings.customProviders.find((entry) => chunkWOKNPWRC_cjs.getCustomProviderId(entry.name) === providerId);
  if (!provider) {
    ctx.showError("Provider not found.");
    return;
  }
  if (provider.models.length === 0) {
    ctx.showInfo(`No custom models configured for ${provider.name}.`);
    return;
  }
  const modelName = await askSelect(
    ctx,
    `Remove model from ${provider.name}`,
    provider.models.map((model) => ({
      label: model,
      value: model,
      description: chunkWOKNPWRC_cjs.toCustomProviderModelId(provider.name, model)
    }))
  );
  if (!modelName) return;
  const removed = removeModelFromCustomProviderInSettings(settings, providerId, modelName);
  if (!removed) {
    ctx.showError("Unable to remove model from provider.");
    return;
  }
  chunkWOKNPWRC_cjs.saveSettings(settings);
  ctx.showInfo(`Removed model: ${chunkWOKNPWRC_cjs.toCustomProviderModelId(provider.name, modelName)}`);
}
async function manageProviderFlow(ctx, providerId) {
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  const provider = settings.customProviders.find((entry) => chunkWOKNPWRC_cjs.getCustomProviderId(entry.name) === providerId);
  if (!provider) {
    ctx.showError("Provider not found.");
    return;
  }
  const action = await askSelect(ctx, `Manage provider: ${provider.name}`, [
    { label: "Add model", value: "add-model", description: "Attach a model ID to this provider" },
    { label: "Remove model", value: "remove-model", description: "Remove a model ID from this provider" },
    { label: "Edit provider", value: "edit-provider", description: "Rename, change URL, or update API key" },
    { label: "Delete provider", value: "delete-provider", description: "Remove provider and all its model IDs" }
  ]);
  switch (action) {
    case "add-model":
      await addProviderModelFlow(ctx, providerId);
      break;
    case "remove-model":
      await removeProviderModelFlow(ctx, providerId);
      break;
    case "edit-provider":
      await editProviderFlow(ctx, providerId);
      break;
    case "delete-provider": {
      const confirm = await askSelect(ctx, `Delete ${provider.name}?`, [
        { label: "Delete", value: "delete", description: "This cannot be undone" }
      ]);
      if (confirm !== "delete") return;
      const latest = chunkWOKNPWRC_cjs.loadSettings();
      removeCustomProviderFromSettings(latest, providerId);
      chunkWOKNPWRC_cjs.saveSettings(latest);
      ctx.showInfo(`Deleted custom provider: ${provider.name}`);
      break;
    }
  }
}
async function handleCustomProvidersCommand(ctx) {
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  const providerOptions = settings.customProviders.map((provider) => {
    const providerId = chunkWOKNPWRC_cjs.getCustomProviderId(provider.name);
    const modelCount = provider.models.length;
    return {
      label: provider.name,
      value: providerId,
      description: `${provider.url} \xB7 ${modelCount} model${modelCount === 1 ? "" : "s"} \xB7 ${provider.apiKey ? "api key set" : "no api key"}`
    };
  });
  const action = await askSelect(ctx, "Custom providers", [
    { label: "Add provider", value: "add-provider", description: "Create an OpenAI-compatible provider" },
    ...providerOptions
  ]);
  if (!action) return;
  if (action === "add-provider") {
    await createProviderFlow(ctx);
    return;
  }
  await manageProviderFlow(ctx, action);
}
async function showSubagentModelListForScope(ctx, scope, agentType, agentTypeLabel) {
  const availableModels = await ctx.state.harness.listAvailableModels();
  if (availableModels.length === 0) {
    ctx.showInfo("No models available. Check your Mastra configuration.");
    return;
  }
  const currentSubagentModel = await ctx.state.harness.getSubagentModelId({ agentType });
  const scopeLabel = scope === "global" ? `${agentTypeLabel} \xB7 Global` : `${agentTypeLabel} \xB7 Thread`;
  return new Promise((resolve3) => {
    const selector = new ModelSelectorComponent({
      tui: ctx.state.ui,
      models: availableModels,
      currentModelId: currentSubagentModel ?? void 0,
      title: `Select subagent model (${scopeLabel})`,
      onSelect: async (model) => {
        ctx.state.ui.hideOverlay();
        await promptForApiKeyIfNeeded(ctx.state.ui, model, ctx.authStorage);
        try {
          await ctx.state.harness.setSubagentModelId({ modelId: model.id, agentType });
          if (scope === "global") {
            const settings = chunkWOKNPWRC_cjs.loadSettings();
            settings.models.subagentModels[agentType] = model.id;
            chunkWOKNPWRC_cjs.saveSettings(settings);
          }
          ctx.showInfo(`Subagent model set for ${scopeLabel}: ${model.id}`);
        } catch (err) {
          ctx.showError(`Failed to set subagent model: ${err instanceof Error ? err.message : String(err)}`);
        }
        resolve3();
      },
      onCancel: () => {
        ctx.state.ui.hideOverlay();
        resolve3();
      }
    });
    ctx.state.ui.showOverlay(selector, {
      width: "80%",
      maxHeight: "60%",
      anchor: "center"
    });
    selector.focused = true;
  });
}
async function showSubagentScopeThenList(ctx, agentType, agentTypeLabel) {
  const scopes = [
    {
      label: "Thread default",
      description: `Default for ${agentTypeLabel} subagents in this thread`,
      scope: "thread"
    },
    {
      label: "Global default",
      description: `Default for ${agentTypeLabel} subagents in all threads`,
      scope: "global"
    }
  ];
  return new Promise((resolve3) => {
    const questionComponent = new AskQuestionInlineComponent(
      {
        question: `Select scope for ${agentTypeLabel} subagents`,
        options: scopes.map((s) => ({
          label: s.label,
          description: s.description
        })),
        formatResult: (answer) => `${agentTypeLabel} \xB7 ${answer}`,
        onSubmit: async (answer) => {
          ctx.state.activeInlineQuestion = void 0;
          try {
            const selected = scopes.find((s) => s.label === answer);
            if (selected) {
              await showSubagentModelListForScope(ctx, selected.scope, agentType, agentTypeLabel);
            }
          } catch (err) {
            ctx.showError(`Subagent selection failed: ${err instanceof Error ? err.message : String(err)}`);
          }
          resolve3();
        },
        onCancel: () => {
          ctx.state.activeInlineQuestion = void 0;
          resolve3();
        }
      },
      ctx.state.ui
    );
    ctx.state.activeInlineQuestion = questionComponent;
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.chatContainer.addChild(questionComponent);
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}
async function handleSubagentsCommand(ctx) {
  const configuredSubagents = ctx.state.harness.config?.subagents;
  const agentTypes = configuredSubagents?.length ? configuredSubagents.map((subagent) => ({
    id: subagent.id,
    label: subagent.name,
    description: subagent.description
  })) : [
    {
      id: "explore",
      label: "Explore",
      description: "Read-only codebase exploration"
    },
    {
      id: "plan",
      label: "Plan",
      description: "Read-only analysis and planning"
    },
    {
      id: "execute",
      label: "Execute",
      description: "Task execution with write access"
    }
  ];
  return new Promise((resolve3) => {
    const questionComponent = new AskQuestionInlineComponent(
      {
        question: "Select subagent type",
        options: agentTypes.map((t) => ({
          label: t.label,
          description: t.description
        })),
        formatResult: (answer) => `Subagent: ${answer}`,
        onSubmit: async (answer) => {
          ctx.state.activeInlineQuestion = void 0;
          try {
            const selected = agentTypes.find((t) => t.label === answer);
            if (selected) {
              await showSubagentScopeThenList(ctx, selected.id, selected.label);
            }
          } catch (err) {
            ctx.showError(`Subagent selection failed: ${err instanceof Error ? err.message : String(err)}`);
          }
          resolve3();
        },
        onCancel: () => {
          ctx.state.activeInlineQuestion = void 0;
          resolve3();
        }
      },
      ctx.state.ui
    );
    ctx.state.activeInlineQuestion = questionComponent;
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.chatContainer.addChild(questionComponent);
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}
var OBSERVATION_THRESHOLDS = [5e3, 1e4, 15e3, 2e4, 3e4, 5e4, 75e3, 1e5];
var REFLECTION_THRESHOLDS = [1e4, 2e4, 3e4, 4e4, 6e4, 8e4, 1e5, 15e4];
function formatTokens(n) {
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  return String(n);
}
function parseTokenInput(input) {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*k?$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (isNaN(num) || num <= 0) return null;
  if (trimmed.endsWith("k")) {
    return num * 1e3;
  }
  if (num < 500) {
    return num * 1e3;
  }
  return num;
}
var KITTY_CSI_U_REGEX = new RegExp("^\\x1b\\[(\\d+)(?::(\\d*))?(?::(\\d+))?(?:;(\\d+))?(?::(\\d+))?u$");
var KITTY_MOD_SHIFT = 1;
var KITTY_MOD_ALT = 2;
var KITTY_MOD_CTRL = 4;
function decodeKittyPrintable(data) {
  const match = data.match(KITTY_CSI_U_REGEX);
  if (!match) return void 0;
  const codepoint = Number.parseInt(match[1] ?? "", 10);
  if (!Number.isFinite(codepoint)) return void 0;
  const shiftedKey = match[2] && match[2].length > 0 ? Number.parseInt(match[2], 10) : void 0;
  const modValue = match[4] ? Number.parseInt(match[4], 10) : 1;
  const modifier = Number.isFinite(modValue) ? modValue - 1 : 0;
  if ((modifier & -194) !== 0) return void 0;
  if (modifier & (KITTY_MOD_ALT | KITTY_MOD_CTRL)) return void 0;
  let effectiveCodepoint = codepoint;
  if (modifier & KITTY_MOD_SHIFT && typeof shiftedKey === "number") {
    effectiveCodepoint = shiftedKey;
  }
  if (!Number.isFinite(effectiveCodepoint) || effectiveCodepoint < 32) return void 0;
  try {
    return String.fromCodePoint(effectiveCodepoint);
  } catch {
    return void 0;
  }
}
function normalizeSearchInput(data) {
  const kittyPrintable = decodeKittyPrintable(data);
  return kittyPrintable ?? data;
}
var ThresholdSubmenu = class extends piTui.Container {
  input;
  selectList;
  onDone;
  onBack;
  inInputMode = true;
  constructor(title, currentValue, presets, onDone, onBack) {
    super();
    this.onDone = onDone;
    this.onBack = onBack;
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", title)), 0, 0));
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "  _k tokens (type a number, e.g. 30 for 30k):"), 0, 0));
    this.input = new piTui.Input();
    this.addChild(this.input);
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "  Or pick a preset:"), 0, 0));
    const items = presets.map((p) => ({
      value: String(p),
      label: `  ${formatTokens(p)} tokens`
    }));
    this.selectList = new piTui.SelectList(items, Math.min(items.length, 8), chunkWOKNPWRC_cjs.getSelectListTheme());
    const currentIndex = presets.indexOf(currentValue);
    if (currentIndex !== -1) {
      this.selectList.setSelectedIndex(currentIndex);
    }
    this.selectList.onSelect = (item) => {
      this.onDone(parseInt(item.value, 10));
    };
    this.selectList.onCancel = onBack;
    this.addChild(this.selectList);
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "  Enter to confirm \xB7 \u2193 for presets \xB7 Esc to go back"), 0, 0));
  }
  handleInput(data) {
    if (this.inInputMode) {
      if (data === "\r" || data === "\n") {
        const parsed = parseTokenInput(this.input.getValue());
        if (parsed) {
          this.onDone(parsed);
        }
        return;
      }
      if (data === "\x1B" || data === "\x1B\x1B") {
        this.onBack();
        return;
      }
      if (data === "\x1B[B") {
        this.inInputMode = false;
        return;
      }
      this.input.handleInput(data);
    } else {
      this.selectList.handleInput(data);
    }
  }
};
var ModelSelectSubmenu = class extends piTui.Container {
  searchInput;
  listContainer;
  allModels;
  filteredModels;
  selectedIndex = 0;
  currentModelId;
  onSelect;
  onCancel;
  tui;
  constructor(title, models, currentModelId, onSelect, onCancel, tui) {
    super();
    this.allModels = models;
    this.filteredModels = models;
    this.currentModelId = currentModelId;
    this.onSelect = onSelect;
    this.onCancel = onCancel;
    this.tui = tui;
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", title)), 0, 0));
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "Type to search \xB7 \u2191\u2193 navigate \xB7 Enter select \xB7 Esc back"), 0, 0));
    this.addChild(new piTui.Spacer(1));
    this.searchInput = new piTui.Input();
    this.addChild(this.searchInput);
    this.addChild(new piTui.Spacer(1));
    this.listContainer = new piTui.Container();
    this.addChild(this.listContainer);
    const currentIndex = models.findIndex((m) => m.id === currentModelId);
    if (currentIndex !== -1) {
      this.selectedIndex = currentIndex;
    }
    this.updateList();
  }
  filterModels(query) {
    this.filteredModels = query ? piTui.fuzzyFilter(this.allModels, query, (m) => `${m.id} ${m.label}`) : this.allModels;
    this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, this.filteredModels.length - 1));
    this.updateList();
  }
  updateList() {
    this.listContainer.clear();
    const maxVisible = 10;
    const total = this.filteredModels.length;
    const startIndex = Math.max(0, Math.min(this.selectedIndex - Math.floor(maxVisible / 2), total - maxVisible));
    const endIndex = Math.min(startIndex + maxVisible, total);
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.filteredModels[i];
      const isSelected = i === this.selectedIndex;
      const isCurrent = item.id === this.currentModelId;
      const checkmark = isCurrent ? chunkWOKNPWRC_cjs.theme.fg("success", " \u2713") : "";
      const line = isSelected ? chunkWOKNPWRC_cjs.theme.fg("accent", `\u2192 ${item.label}`) + checkmark : `  ${item.label}` + checkmark;
      this.listContainer.addChild(new piTui.Text(line, 0, 0));
    }
    if (startIndex > 0 || endIndex < total) {
      this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", `(${this.selectedIndex + 1}/${total})`), 0, 0));
    }
    if (total === 0) {
      this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "No matching models"), 0, 0));
    }
  }
  handleInput(data) {
    const kb = piTui.getEditorKeybindings();
    const total = this.filteredModels.length;
    if (kb.matches(data, "selectUp")) {
      if (total === 0) return;
      this.selectedIndex = this.selectedIndex === 0 ? total - 1 : this.selectedIndex - 1;
      this.updateList();
      this.tui.requestRender();
    } else if (kb.matches(data, "selectDown")) {
      if (total === 0) return;
      this.selectedIndex = this.selectedIndex === total - 1 ? 0 : this.selectedIndex + 1;
      this.updateList();
      this.tui.requestRender();
    } else if (kb.matches(data, "selectConfirm")) {
      const selected = this.filteredModels[this.selectedIndex];
      if (selected) void this.onSelect(selected.id);
    } else if (kb.matches(data, "selectCancel")) {
      this.onCancel();
    } else {
      const normalized = normalizeSearchInput(data);
      this.searchInput.handleInput(normalized);
      this.filterModels(this.searchInput.getValue());
      this.tui.requestRender();
    }
  }
};
var OMSettingsComponent = class extends piTui.Box {
  settingsList;
  // Focusable implementation
  _focused = false;
  get focused() {
    return this._focused;
  }
  set focused(value) {
    this._focused = value;
  }
  constructor(config, callbacks, models, tui) {
    super(2, 1, (text) => chunkWOKNPWRC_cjs.theme.bg("overlayBg", text));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "Observational Memory Settings")), 0, 0));
    this.addChild(new piTui.Spacer(1));
    const items = [
      {
        id: "observer-model",
        label: "Observer model",
        description: "Model used for observing and summarizing message history",
        currentValue: getShortModelName(config.observerModelId),
        submenu: (_currentValue, done) => new ModelSelectSubmenu(
          "Observer Model",
          models,
          config.observerModelId,
          async (modelId) => {
            await callbacks.onObserverModelChange(modelId);
            config.observerModelId = modelId;
            done(getShortModelName(modelId));
          },
          () => done(),
          tui
        )
      },
      {
        id: "reflector-model",
        label: "Reflector model",
        description: "Model used for compressing observations when they grow too large",
        currentValue: getShortModelName(config.reflectorModelId),
        submenu: (_currentValue, done) => new ModelSelectSubmenu(
          "Reflector Model",
          models,
          config.reflectorModelId,
          async (modelId) => {
            await callbacks.onReflectorModelChange(modelId);
            config.reflectorModelId = modelId;
            done(getShortModelName(modelId));
          },
          () => done(),
          tui
        )
      },
      {
        id: "obs-threshold",
        label: "Observation threshold",
        description: "Token count before triggering observation. Lower = more frequent, higher = more context before observing",
        currentValue: formatTokens(config.observationThreshold),
        submenu: (_currentValue, done) => new ThresholdSubmenu(
          "Observation Threshold",
          config.observationThreshold,
          OBSERVATION_THRESHOLDS,
          (value) => {
            config.observationThreshold = value;
            callbacks.onObservationThresholdChange(value);
            done(formatTokens(value));
          },
          () => done()
        )
      },
      {
        id: "ref-threshold",
        label: "Reflection threshold",
        description: "Token count of observations before triggering compression. Lower = more frequent, higher = more observations before compressing",
        currentValue: formatTokens(config.reflectionThreshold),
        submenu: (_currentValue, done) => new ThresholdSubmenu(
          "Reflection Threshold",
          config.reflectionThreshold,
          REFLECTION_THRESHOLDS,
          (value) => {
            config.reflectionThreshold = value;
            callbacks.onReflectionThresholdChange(value);
            done(formatTokens(value));
          },
          () => done()
        )
      }
    ];
    this.settingsList = new piTui.SettingsList(
      items,
      10,
      chunkWOKNPWRC_cjs.getSettingsListTheme(),
      (_id, _newValue) => {
      },
      callbacks.onClose
    );
    this.addChild(this.settingsList);
  }
  handleInput(data) {
    this.settingsList.handleInput(data);
  }
};
function getShortModelName(modelId) {
  if (!modelId) return "(none)";
  const parts = modelId.split("/");
  return parts.length > 1 ? parts.slice(1).join("/") : modelId;
}

// src/tui/commands/om.ts
function persistOmModelOverride(modelId) {
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  settings.models.activeOmPackId = "custom";
  settings.models.omModelOverride = modelId;
  chunkWOKNPWRC_cjs.saveSettings(settings);
}
function persistOmThresholds({
  observationThreshold,
  reflectionThreshold
}) {
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  if (observationThreshold !== void 0) {
    settings.models.omObservationThreshold = observationThreshold;
  }
  if (reflectionThreshold !== void 0) {
    settings.models.omReflectionThreshold = reflectionThreshold;
  }
  chunkWOKNPWRC_cjs.saveSettings(settings);
}
async function handleOMCommand(ctx) {
  const availableModels = await ctx.state.harness.listAvailableModels();
  const modelById = new Map(availableModels.map((model) => [model.id, model]));
  const modelOptions = availableModels.map((m) => ({
    id: m.id,
    label: m.id
  }));
  const ensureApiKeyForModel = async (modelId) => {
    const model = modelById.get(modelId);
    if (!model) return;
    await promptForApiKeyIfNeeded(ctx.state.ui, model, ctx.authStorage);
  };
  const config = {
    observerModelId: ctx.state.harness.getObserverModelId(),
    reflectorModelId: ctx.state.harness.getReflectorModelId(),
    observationThreshold: ctx.state.harness.getObservationThreshold(),
    reflectionThreshold: ctx.state.harness.getReflectionThreshold()
  };
  return new Promise((resolve3) => {
    const settings = new OMSettingsComponent(
      config,
      {
        onObserverModelChange: async (modelId) => {
          await ensureApiKeyForModel(modelId);
          await ctx.state.harness.switchObserverModel({ modelId });
          persistOmModelOverride(modelId);
          ctx.showInfo(`Observer model \u2192 ${modelId}`);
        },
        onReflectorModelChange: async (modelId) => {
          await ensureApiKeyForModel(modelId);
          await ctx.state.harness.switchReflectorModel({ modelId });
          persistOmModelOverride(modelId);
          ctx.showInfo(`Reflector model \u2192 ${modelId}`);
        },
        onObservationThresholdChange: async (value) => {
          await ctx.state.harness.setState({ observationThreshold: value });
          await ctx.state.harness.setThreadSetting({ key: "observationThreshold", value });
          persistOmThresholds({ observationThreshold: value });
        },
        onReflectionThresholdChange: async (value) => {
          await ctx.state.harness.setState({ reflectionThreshold: value });
          await ctx.state.harness.setThreadSetting({ key: "reflectionThreshold", value });
          persistOmThresholds({ reflectionThreshold: value });
        },
        onClose: () => {
          ctx.state.ui.hideOverlay();
          ctx.updateStatusLine();
          resolve3();
        }
      },
      modelOptions,
      ctx.state.ui
    );
    ctx.state.ui.showOverlay(settings, {
      width: "80%",
      maxHeight: "70%",
      anchor: "center"
    });
    settings.focused = true;
  });
}
var SelectSubmenu = class extends piTui.SelectList {
  constructor(items, currentValue, onSelect, onBack) {
    super(items, Math.min(items.length, 8), chunkWOKNPWRC_cjs.getSelectListTheme());
    const currentIndex = items.findIndex((i) => i.value === currentValue);
    if (currentIndex !== -1) {
      this.setSelectedIndex(currentIndex);
    }
    this.onSelect = (item) => {
      onSelect(item.value);
    };
    this.onCancel = onBack;
  }
};
var StorageBackendSubmenu = class extends piTui.Container {
  phase = "select";
  pendingBackend = "libsql";
  selectList;
  input;
  onDone;
  onBack;
  currentPgConnectionString;
  currentLibsqlUrl;
  constructor(currentBackend, currentPgConnectionString, currentLibsqlUrl, onDone, onBack) {
    super();
    this.onDone = onDone;
    this.onBack = onBack;
    this.currentPgConnectionString = currentPgConnectionString;
    this.currentLibsqlUrl = currentLibsqlUrl;
    const items = [
      {
        value: "libsql",
        label: "  LibSQL",
        description: "Local file-based SQLite or remote Turso URL"
      },
      {
        value: "pg",
        label: "  PostgreSQL",
        description: "Remote PostgreSQL (requires connection string)"
      }
    ];
    this.selectList = new piTui.SelectList(items, items.length, chunkWOKNPWRC_cjs.getSelectListTheme());
    const currentIndex = items.findIndex((i) => i.value === currentBackend);
    if (currentIndex !== -1) this.selectList.setSelectedIndex(currentIndex);
    this.selectList.onSelect = (item) => {
      this.pendingBackend = item.value;
      this.showConnectionInput();
    };
    this.selectList.onCancel = onBack;
    this.addChild(this.selectList);
  }
  showConnectionInput() {
    this.phase = "connection";
    this.clear();
    if (this.pendingBackend === "pg") {
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "PostgreSQL Connection")), 0, 0));
      this.addChild(new piTui.Spacer(1));
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "Enter a connection string:"), 0, 0));
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "e.g. postgresql://user:pass@localhost:5432/mydb"), 0, 0));
    } else {
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "LibSQL Connection")), 0, 0));
      this.addChild(new piTui.Spacer(1));
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "Enter a URL or leave empty for default local file:"), 0, 0));
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "e.g. libsql://your-db.turso.io"), 0, 0));
    }
    this.addChild(new piTui.Spacer(1));
    this.input = new MaskedInput();
    const currentValue = this.pendingBackend === "pg" ? this.currentPgConnectionString : this.currentLibsqlUrl;
    if (currentValue) {
      this.input.setValue(currentValue);
    }
    this.addChild(this.input);
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "Enter to save \xB7 Esc to go back"), 0, 0));
  }
  handleInput(data) {
    if (this.phase === "select") {
      this.selectList.handleInput(data);
      return;
    }
    if (data === "\r" || data === "\n") {
      const value = this.input.getValue().trim();
      if (this.pendingBackend === "pg") {
        if (value) {
          this.onDone("pg", value);
        }
      } else {
        this.onDone("libsql", value || void 0);
      }
      return;
    }
    if (data === "\x1B" || data === "\x1B\x1B") {
      this.onBack();
      return;
    }
    this.input.handleInput(data);
  }
};
function storageLabel(config) {
  if (config.storageBackend === "pg") return "PostgreSQL";
  if (config.libsqlUrl) return `LibSQL (${config.libsqlUrl})`;
  return "LibSQL (local file)";
}
var SettingsComponent = class extends piTui.Box {
  settingsList;
  _focused = false;
  get focused() {
    return this._focused;
  }
  set focused(value) {
    this._focused = value;
  }
  constructor(config, callbacks) {
    super(2, 1, (text) => chunkWOKNPWRC_cjs.theme.bg("overlayBg", text));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "Settings")), 0, 0));
    this.addChild(new piTui.Spacer(1));
    const notificationModes = [
      { value: "off", label: "Off", desc: "No notifications" },
      { value: "bell", label: "Bell", desc: "Terminal bell (\\x07)" },
      { value: "system", label: "System", desc: "Native OS notification" },
      { value: "both", label: "Both", desc: "Bell + system notification" }
    ];
    const thinkingLevels = getThinkingLevelsForModel(config.currentModelId).map((level) => ({
      value: level.id,
      label: level.label,
      desc: level.description
    }));
    const getNotifLabel = (mode) => notificationModes.find((m) => m.value === mode)?.label ?? mode;
    const getThinkingLabel = (level) => thinkingLevels.find((l) => l.value === level)?.label ?? level;
    const items = [
      {
        id: "notifications",
        label: "Notifications",
        description: "How to alert when the agent needs attention",
        currentValue: getNotifLabel(config.notifications),
        submenu: (_currentValue, done) => new SelectSubmenu(
          notificationModes.map((m) => ({
            value: m.value,
            label: `  ${m.label}`,
            description: m.desc
          })),
          config.notifications,
          (value) => {
            config.notifications = value;
            callbacks.onNotificationsChange(config.notifications);
            done(getNotifLabel(config.notifications));
          },
          () => done()
        )
      },
      {
        id: "yolo",
        label: "YOLO mode",
        description: "Auto-approve all tool calls without confirmation",
        currentValue: config.yolo ? "On" : "Off",
        submenu: (_currentValue, done) => new SelectSubmenu(
          [
            {
              value: "on",
              label: "  On",
              description: "Auto-approve all tools"
            },
            {
              value: "off",
              label: "  Off",
              description: "Require approval for tools"
            }
          ],
          config.yolo ? "on" : "off",
          (value) => {
            config.yolo = value === "on";
            callbacks.onYoloChange(config.yolo);
            done(config.yolo ? "On" : "Off");
          },
          () => done()
        )
      },
      {
        id: "thinking",
        label: "Thinking level",
        description: "Reasoning depth level",
        currentValue: getThinkingLabel(config.thinkingLevel),
        submenu: (_currentValue, done) => new SelectSubmenu(
          thinkingLevels.map((l) => ({
            value: l.value,
            label: `  ${l.label}`,
            description: l.desc
          })),
          config.thinkingLevel,
          (value) => {
            config.thinkingLevel = value;
            callbacks.onThinkingLevelChange(value);
            done(getThinkingLabel(value));
          },
          () => done()
        )
      },
      {
        id: "escapeAsCancel",
        label: "Escape cancels",
        description: "Use Escape to cancel/clear (Ctrl+C always works).",
        currentValue: config.escapeAsCancel ? "On" : "Off",
        submenu: (_currentValue, done) => new SelectSubmenu(
          [
            {
              value: "on",
              label: "  On",
              description: "Escape clears input / aborts"
            },
            {
              value: "off",
              label: "  Off",
              description: "Only Ctrl+C clears / aborts"
            }
          ],
          config.escapeAsCancel ? "on" : "off",
          (value) => {
            config.escapeAsCancel = value === "on";
            callbacks.onEscapeAsCancelChange(config.escapeAsCancel);
            done(config.escapeAsCancel ? "On" : "Off");
          },
          () => done()
        )
      },
      {
        id: "quietMode",
        label: "Quiet mode",
        description: "Collapse subagent output to a single line after completion.",
        currentValue: config.quietMode ? "On" : "Off",
        submenu: (_currentValue, done) => new SelectSubmenu(
          [
            {
              value: "on",
              label: "  On",
              description: "Auto-collapse subagent output when done"
            },
            {
              value: "off",
              label: "  Off",
              description: "Keep subagent output visible when done"
            }
          ],
          config.quietMode ? "on" : "off",
          (value) => {
            config.quietMode = value === "on";
            callbacks.onQuietModeChange(config.quietMode);
            done(config.quietMode ? "On" : "Off");
          },
          () => done()
        )
      },
      {
        id: "storageBackend",
        label: "Storage backend",
        description: "Database backend for threads, memory, and agent data (restart required)",
        currentValue: storageLabel(config),
        submenu: (_currentValue, done) => new StorageBackendSubmenu(
          config.storageBackend,
          config.pgConnectionString,
          config.libsqlUrl,
          (backend, connectionUrl) => {
            config.storageBackend = backend;
            if (backend === "pg" && connectionUrl !== void 0) {
              config.pgConnectionString = connectionUrl;
            } else if (backend === "libsql") {
              config.libsqlUrl = connectionUrl ?? "";
            }
            callbacks.onStorageBackendChange(backend, connectionUrl);
            done(storageLabel(config));
          },
          () => done()
        )
      }
    ];
    this.settingsList = new piTui.SettingsList(
      items,
      10,
      chunkWOKNPWRC_cjs.getSettingsListTheme(),
      (_id, _newValue) => {
      },
      callbacks.onClose
    );
    this.addChild(this.settingsList);
  }
  handleInput(data) {
    this.settingsList.handleInput(data);
  }
};

// src/tui/commands/settings.ts
async function handleSettingsCommand(ctx) {
  const state = ctx.state.harness.getState();
  const globalSettings = chunkWOKNPWRC_cjs.loadSettings();
  const config = {
    notifications: state?.notifications ?? "off",
    yolo: state?.yolo === true,
    thinkingLevel: state?.thinkingLevel ?? "off",
    currentModelId: ctx.state.harness.getCurrentModelId() ?? "",
    escapeAsCancel: ctx.state.editor.escapeEnabled,
    quietMode: globalSettings.preferences.quietMode,
    storageBackend: globalSettings.storage.backend,
    pgConnectionString: globalSettings.storage.pg?.connectionString ?? "",
    libsqlUrl: globalSettings.storage.libsql?.url ?? ""
  };
  return new Promise((resolve3) => {
    const settings = new SettingsComponent(config, {
      onNotificationsChange: async (mode) => {
        await ctx.state.harness.setState({ notifications: mode });
        ctx.showInfo(`Notifications: ${mode}`);
      },
      onYoloChange: async (enabled) => {
        await ctx.state.harness.setState({ yolo: enabled });
      },
      onThinkingLevelChange: async (level) => {
        await ctx.state.harness.setState({ thinkingLevel: level });
        const current = chunkWOKNPWRC_cjs.loadSettings();
        current.preferences.thinkingLevel = level;
        chunkWOKNPWRC_cjs.saveSettings(current);
      },
      onEscapeAsCancelChange: async (enabled) => {
        ctx.state.editor.escapeEnabled = enabled;
        await ctx.state.harness.setState({ escapeAsCancel: enabled });
        await ctx.state.harness.setThreadSetting({ key: "escapeAsCancel", value: enabled });
      },
      onQuietModeChange: (enabled) => {
        const current = chunkWOKNPWRC_cjs.loadSettings();
        current.preferences.quietMode = enabled;
        chunkWOKNPWRC_cjs.saveSettings(current);
        ctx.state.quietMode = enabled;
      },
      onStorageBackendChange: (backend, connectionUrl) => {
        const current = chunkWOKNPWRC_cjs.loadSettings();
        current.storage.backend = backend;
        if (backend === "pg" && connectionUrl !== void 0) {
          current.storage.pg = { ...current.storage.pg, connectionString: connectionUrl };
        } else if (backend === "libsql") {
          current.storage.libsql = { ...current.storage.libsql, url: connectionUrl || void 0 };
        }
        chunkWOKNPWRC_cjs.saveSettings(current);
        ctx.state.ui.hideOverlay();
        ctx.stop();
        const label = backend === "pg" ? "PostgreSQL" : "LibSQL";
        console.info(`
Storage backend changed to ${label}. Restarting is required.
`);
        process.exit(0);
      },
      onClose: () => {
        ctx.state.ui.hideOverlay();
        resolve3();
      }
    });
    ctx.state.ui.showOverlay(settings, {
      width: "60%",
      maxHeight: "50%",
      anchor: "center"
    });
    settings.focused = true;
  });
}
var LoginDialogComponent = class extends piTui.Box {
  constructor(tui, providerId, onComplete) {
    super(2, 1, (text) => chunkWOKNPWRC_cjs.theme.bg("overlayBg", text));
    this.onComplete = onComplete;
    this.tui = tui;
    const providerInfo = chunkP2NLJLNZ_cjs.getOAuthProviders().find((p) => p.id === providerId);
    const providerName = providerInfo?.name || providerId;
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("warning", `Login to ${providerName}`)));
    this.addChild(new piTui.Spacer(1));
    this.contentContainer = new piTui.Container();
    this.addChild(this.contentContainer);
    this.input = new MaskedInput();
    this.input.onSubmit = () => {
      if (this.inputResolver) {
        this.inputResolver(this.input.getValue());
        this.inputResolver = void 0;
        this.inputRejecter = void 0;
      }
    };
    this.input.onEscape = () => {
      this.cancel();
    };
  }
  contentContainer;
  input;
  tui;
  abortController = new AbortController();
  inputResolver;
  inputRejecter;
  // Focusable implementation
  _focused = false;
  get focused() {
    return this._focused;
  }
  set focused(value) {
    this._focused = value;
    this.input.focused = value;
  }
  get signal() {
    return this.abortController.signal;
  }
  cancel() {
    try {
      this.abortController.abort();
    } catch {
    }
    if (this.inputRejecter) {
      this.inputRejecter(new Error("Login cancelled"));
      this.inputResolver = void 0;
      this.inputRejecter = void 0;
    }
    this.onComplete(false, "Login cancelled");
  }
  /**
   * Called by onAuth callback - show URL and optional instructions
   */
  showAuth(url, instructions) {
    this.contentContainer.clear();
    this.contentContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("accent", url)));
    const clickHint = process.platform === "darwin" ? "Cmd+click to open" : "Ctrl+click to open";
    const hyperlink = `\x1B]8;;${url}\x07${clickHint}\x1B]8;;\x07`;
    this.contentContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", hyperlink)));
    if (instructions) {
      this.contentContainer.addChild(new piTui.Spacer(1));
      this.contentContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("warning", instructions)));
    }
    const openCmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    child_process.exec(`${openCmd} "${url}"`);
    this.tui.requestRender();
  }
  /**
   * Called by onPrompt callback - show prompt and wait for input
   */
  showPrompt(message, placeholder) {
    this.contentContainer.addChild(new piTui.Spacer(1));
    this.contentContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", message)));
    if (placeholder) {
      this.contentContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", `e.g., ${placeholder}`)));
    }
    this.contentContainer.addChild(this.input);
    this.contentContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "(Escape to cancel, Enter to submit)")));
    this.input.setValue("");
    this.tui.requestRender();
    return new Promise((resolve3, reject) => {
      this.inputResolver = resolve3;
      this.inputRejecter = reject;
    });
  }
  /**
   * Show progress message
   */
  showProgress(message) {
    this.contentContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", message)));
    this.tui.requestRender();
  }
  handleInput(data) {
    const kb = piTui.getEditorKeybindings();
    if (kb.matches(data, "selectCancel")) {
      this.cancel();
      return;
    }
    this.input.handleInput(data);
  }
};

// src/tui/commands/login.ts
async function performLogin(ctx, providerId) {
  const provider = chunkP2NLJLNZ_cjs.getOAuthProviders().find((p) => p.id === providerId);
  const providerName = provider?.name || providerId;
  if (!ctx.authStorage) {
    ctx.showError("Auth storage not configured");
    return;
  }
  return new Promise((resolve3) => {
    const dialog = new LoginDialogComponent(ctx.state.ui, providerId, (success, message) => {
      ctx.state.ui.hideOverlay();
      if (success) {
        ctx.showInfo(`Successfully logged in to ${providerName}`);
      } else if (message) {
        ctx.showInfo(message);
      }
      resolve3();
    });
    ctx.state.ui.showOverlay(dialog, {
      width: "80%",
      maxHeight: "60%",
      anchor: "center"
    });
    dialog.focused = true;
    ctx.authStorage.login(providerId, {
      onAuth: (info) => {
        dialog.showAuth(info.url, info.instructions);
      },
      onPrompt: async (prompt) => {
        return dialog.showPrompt(prompt.message, prompt.placeholder);
      },
      onProgress: (message) => {
        dialog.showProgress(message);
      },
      signal: dialog.signal
    }).then(async () => {
      ctx.state.ui.hideOverlay();
      const defaultModel = chunkP2NLJLNZ_cjs.PROVIDER_DEFAULT_MODELS[providerId];
      if (defaultModel) {
        await ctx.state.harness.switchModel({ modelId: defaultModel });
        ctx.showInfo(`Logged in to ${providerName} - switched to ${defaultModel}`);
      } else {
        ctx.showInfo(`Successfully logged in to ${providerName}`);
      }
      resolve3();
    }).catch((error) => {
      ctx.state.ui.hideOverlay();
      if (error.message !== "Login cancelled") {
        ctx.showError(`Failed to login: ${error.message}`);
      }
      resolve3();
    });
  });
}
async function handleLoginCommand(ctx, mode) {
  const allProviders = chunkP2NLJLNZ_cjs.getOAuthProviders();
  const loggedInIds = allProviders.filter((p) => ctx.authStorage?.isLoggedIn(p.id)).map((p) => p.id);
  if (mode === "logout") {
    if (loggedInIds.length === 0) {
      ctx.showInfo("No OAuth providers logged in. Use /login first.");
      return;
    }
  }
  const providers = mode === "logout" ? allProviders.filter((p) => loggedInIds.includes(p.id)) : allProviders;
  if (providers.length === 0) {
    ctx.showInfo("No OAuth providers available.");
    return;
  }
  const action = mode === "login" ? "Log in to" : "Log out from";
  return new Promise((resolve3) => {
    const questionComponent = new AskQuestionInlineComponent(
      {
        question: `${action} which provider?`,
        options: providers.map((p) => ({
          label: p.name,
          description: loggedInIds.includes(p.id) ? "(logged in)" : ""
        })),
        formatResult: (answer) => mode === "login" ? `Logging in to ${answer}\u2026` : `Logged out from ${answer}`,
        onSubmit: async (answer) => {
          ctx.state.activeInlineQuestion = void 0;
          const provider = providers.find((p) => p.name === answer);
          if (provider) {
            if (mode === "login") {
              await performLogin(ctx, provider.id);
            } else {
              if (ctx.authStorage) {
                ctx.authStorage.logout(provider.id);
                ctx.showInfo(`Logged out from ${provider.name}`);
              } else {
                ctx.showError("Auth storage not configured");
              }
            }
          }
          resolve3();
        },
        onCancel: () => {
          ctx.state.activeInlineQuestion = void 0;
          resolve3();
        }
      },
      ctx.state.ui
    );
    ctx.state.activeInlineQuestion = questionComponent;
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.chatContainer.addChild(questionComponent);
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}

// src/tui/commands/review.ts
async function handleReviewCommand(ctx, args) {
  if (!ctx.state.harness.hasModelSelected()) {
    ctx.showInfo("No model selected. Use /models to select a model, or /login to authenticate.");
    return;
  }
  if (ctx.state.pendingNewThread) {
    await ctx.state.harness.createThread();
    ctx.state.pendingNewThread = false;
  }
  const prNumber = args[0];
  const focusArea = args.slice(1).join(" ");
  let prompt;
  if (!prNumber) {
    prompt = `List the open pull requests for this repository using \`gh pr list --limit 20\`. Present them in a clear table with PR number, title, and author. Then ask me which PR I'd like you to review.`;
  } else {
    prompt = `Do a thorough code review of PR #${prNumber}. Follow these steps:

1. Run \`gh pr view ${prNumber}\` to get the PR description and metadata.
2. Run \`gh pr diff ${prNumber}\` to get the full diff.
3. Run \`gh pr checks ${prNumber}\` to check CI status.
4. Read any relevant source files for full context on the changes.
5. Provide a detailed code review covering:
   - Overview of what the PR does
   - Root cause analysis (if it's a fix)
   - Code quality assessment
   - Potential concerns or edge cases
   - CI status
   - Suggestions for improvement
   - Final verdict (approve/request changes/comment)
`;
    if (focusArea) {
      prompt += `
Pay special attention to: ${focusArea}
`;
    }
  }
  ctx.addUserMessage({
    id: `user-${Date.now()}`,
    role: "user",
    content: [
      {
        type: "text",
        text: prNumber ? `/review ${args.join(" ")}` : "/review"
      }
    ],
    createdAt: /* @__PURE__ */ new Date()
  });
  ctx.state.ui.requestRender();
  ctx.extension.harnessAdapter.sendMessage(ctx.state.harness, { content: prompt }).catch((error) => {
    ctx.showError(error instanceof Error ? error.message : "Review failed");
  });
}

// src/tui/commands/report-issue.ts
var MASTRA_REPO = "mastra-ai/mastra";
var MASTRA_LABEL = "mastracode";
async function handleReportIssueCommand(ctx, args) {
  if (!ctx.state.harness.hasModelSelected()) {
    ctx.showInfo("No model selected. Use /models to select a model, or /login to authenticate.");
    return;
  }
  if (ctx.state.pendingNewThread) {
    await ctx.state.harness.createThread();
    ctx.state.pendingNewThread = false;
  }
  const extraContext = args.join(" ").trim();
  const prompt = `The user wants to report a GitHub issue on ${MASTRA_REPO}. Help them through this process.

` + (extraContext ? `The user provided this initial context: "${extraContext}"

` : "") + `## Step 1: Understand the problem

Ask the user to describe the issue in their own words. Ask follow-up questions to gather:
- What happened / what's wrong
- What they expected to happen
- Steps to reproduce (if applicable)

Also gather environment info by running:
\`\`\`
mastracode --version 2>/dev/null || echo "unknown"
node --version
uname -s
\`\`\`

Use the conversation history for additional context about what the user was working on when they hit this issue.

## Step 2: Check for duplicates

Once you understand the problem, search for similar existing issues:
\`\`\`
gh issue list --repo ${MASTRA_REPO} --label ${MASTRA_LABEL} --state open --limit 50 --json number,title,body
\`\`\`

Also search more broadly:
\`\`\`
gh search issues --repo ${MASTRA_REPO} --state open "<relevant keywords>" --limit 20 --json number,title,body,labels
\`\`\`

If you find similar issue(s):
- Present them with their number, title, and a brief summary
- Ask the user whether they'd like to add a comment on an existing issue instead of opening a new one
- If they choose to comment, draft the comment, show it to the user for approval, then run:
\`\`\`
gh issue comment <number> --repo ${MASTRA_REPO} --body "<comment>"
\`\`\`
Then stop here.

## Step 3: Draft the issue

Based on what you've gathered, write a clear, well-structured issue with:
- A concise, descriptive title
- A body covering: description, expected behavior, steps to reproduce, and environment info

**Show the full title and body to the user and ask for their approval before creating it.** Let them suggest edits.

## Step 4: Create the issue

Only after the user approves, create the issue:
\`\`\`
gh issue create --repo ${MASTRA_REPO} --label ${MASTRA_LABEL} --title "<title>" --body "<body>"
\`\`\`

Report the created issue URL back to the user.`;
  ctx.addUserMessage({
    id: `user-${Date.now()}`,
    role: "user",
    content: [
      {
        type: "text",
        text: extraContext ? `/report-issue ${extraContext}` : "/report-issue"
      }
    ],
    createdAt: /* @__PURE__ */ new Date()
  });
  ctx.state.ui.requestRender();
  ctx.extension.harnessAdapter.sendMessage(ctx.state.harness, { content: prompt }).catch((error) => {
    ctx.showError(error instanceof Error ? error.message : "Report issue command failed");
  });
}

// src/tui/commands/setup.ts
async function handleSetupCommand(ctx) {
  await ctx.showOnboarding();
}

// src/tui/detect-theme.ts
function queryTerminalBackground(timeoutMs = 200) {
  return new Promise((resolve3) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      resolve3(null);
      return;
    }
    let settled = false;
    let buffer = "";
    let wasRaw;
    let wasResumed = false;
    let timer;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      if (timer) {
        clearTimeout(timer);
        timer = void 0;
      }
      process.stdin.removeListener("data", onData);
      try {
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(wasRaw);
        }
      } catch {
      }
      if (wasResumed) {
        process.stdin.pause();
      }
    };
    const onData = (data) => {
      buffer += data.toString();
      const match = buffer.match(/\x1b\]11;rgb:([0-9a-fA-F]+)\/([0-9a-fA-F]+)\/([0-9a-fA-F]+)/);
      if (match) {
        cleanup();
        const rHex = match[1];
        const gHex = match[2];
        const bHex = match[3];
        const normalize = (hex) => {
          const val = parseInt(hex, 16);
          return hex.length <= 2 ? val / 255 : val / 65535;
        };
        const r = normalize(rHex);
        const g = normalize(gHex);
        const b = normalize(bHex);
        const toHexByte = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
        const detectedBgHex = `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
        const luma = chunkWOKNPWRC_cjs.luminance(detectedBgHex);
        resolve3({ mode: luma >= 0.5 ? "light" : "dark", detectedBgHex });
        return;
      }
    };
    timer = setTimeout(() => {
      cleanup();
      resolve3(null);
    }, timeoutMs);
    if (timer.unref) timer.unref();
    try {
      wasRaw = process.stdin.isRaw ?? false;
      process.stdin.setRawMode(true);
      if (process.stdin.isPaused()) {
        process.stdin.resume();
        wasResumed = true;
      }
      process.stdin.on("data", onData);
      process.stdout.write("\x1B]11;?\x07");
    } catch {
      cleanup();
      resolve3(null);
    }
  });
}
function detectFromColorFgBg() {
  const colorFgBg = process.env.COLORFGBG;
  if (!colorFgBg) return null;
  const parts = colorFgBg.split(";");
  const bgPart = parts[parts.length - 1];
  if (bgPart === void 0) return null;
  const bgIndex = parseInt(bgPart, 10);
  if (isNaN(bgIndex)) return null;
  return bgIndex >= 7 ? "light" : "dark";
}
async function detectTerminalTheme() {
  const envTheme = process.env.MASTRA_THEME?.toLowerCase();
  if (envTheme === "light") return { mode: "light" };
  if (envTheme === "dark") return { mode: "dark" };
  const oscResult = await queryTerminalBackground(200);
  if (oscResult) return oscResult;
  const fgbgResult = detectFromColorFgBg();
  if (fgbgResult) return { mode: fgbgResult };
  return { mode: "dark" };
}

// src/tui/commands/theme.ts
async function handleThemeCommand(ctx, args) {
  const arg = args[0]?.toLowerCase();
  if (!arg) {
    const mode = chunkWOKNPWRC_cjs.getThemeMode();
    const settings2 = chunkWOKNPWRC_cjs.loadSettings();
    const pref = settings2.preferences.theme ?? "auto";
    ctx.showInfo(`Theme: ${mode} (preference: ${pref})`);
    return;
  }
  if (arg !== "auto" && arg !== "dark" && arg !== "light") {
    ctx.showError("Usage: /theme [auto|dark|light]");
    return;
  }
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  settings.preferences.theme = arg;
  chunkWOKNPWRC_cjs.saveSettings(settings);
  if (arg === "auto") {
    const detection = await detectTerminalTheme();
    chunkWOKNPWRC_cjs.applyThemeMode(detection.mode, detection.detectedBgHex);
    ctx.showInfo(`Theme set to auto (detected: ${detection.mode})`);
  } else {
    chunkWOKNPWRC_cjs.applyThemeMode(arg);
    ctx.showInfo(`Theme set to ${arg}`);
  }
  ctx.state.ui.requestRender();
}
async function handleUpdateCommand(ctx) {
  const currentVersion = ctx.state.options.version;
  if (!currentVersion) {
    ctx.showError("Could not determine the current version.");
    return;
  }
  ctx.showInfo("Checking for updates\u2026");
  const latestVersion = await fetchLatestVersion();
  if (!latestVersion) {
    ctx.showError("Could not reach the npm registry. Check your network connection.");
    return;
  }
  if (!isNewerVersion(currentVersion, latestVersion)) {
    ctx.showInfo(`You are already on the latest version (v${currentVersion}).`);
    return;
  }
  const pm = await detectPackageManager();
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  if (settings.updateDismissedVersion) {
    settings.updateDismissedVersion = null;
    chunkWOKNPWRC_cjs.saveSettings(settings);
  }
  return new Promise((resolve3) => {
    const questionComponent = new AskQuestionInlineComponent(
      {
        question: `A new version is available: v${latestVersion} (current: v${currentVersion}). Would you like to update now?`,
        options: [
          { label: "Yes", description: "Update and restart" },
          { label: "No", description: "Skip this version" }
        ],
        formatResult: (answer) => answer === "Yes" ? "Updating\u2026" : "Update skipped.",
        onSubmit: async (answer) => {
          ctx.state.activeInlineQuestion = void 0;
          if (answer === "Yes") {
            ctx.showInfo(`Updating to v${latestVersion}\u2026`);
            const ok = await runUpdate(pm, latestVersion);
            if (ok) {
              ctx.showInfo(`Updated to v${latestVersion}. Please restart Mastra Code.`);
              ctx.stop();
              process.exit(0);
            } else {
              const cmd = getInstallCommand(pm, latestVersion);
              ctx.showError(`Auto-update failed. Run \`${cmd}\` manually.`);
            }
          } else {
            const s = chunkWOKNPWRC_cjs.loadSettings();
            s.updateDismissedVersion = latestVersion;
            chunkWOKNPWRC_cjs.saveSettings(s);
            ctx.showInfo("Update skipped.");
          }
          resolve3();
        },
        onCancel: () => {
          ctx.state.activeInlineQuestion = void 0;
          resolve3();
        }
      },
      ctx.state.ui
    );
    ctx.state.activeInlineQuestion = questionComponent;
    ctx.state.chatContainer.addChild(questionComponent);
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}
function askText2(ctx, question, defaultValue) {
  return new Promise((resolve3) => {
    const component = new AskQuestionInlineComponent(
      {
        question,
        allowEmptyInput: false,
        onSubmit: (answer) => {
          ctx.state.activeInlineQuestion = void 0;
          const trimmed = answer.trim();
          resolve3(trimmed.length > 0 ? trimmed : null);
        },
        onCancel: () => {
          ctx.state.activeInlineQuestion = void 0;
          resolve3(null);
        }
      },
      ctx.state.ui
    );
    if (defaultValue) {
      component.input?.setValue?.(defaultValue);
    }
    ctx.state.activeInlineQuestion = component;
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.chatContainer.addChild(component);
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}
function askSelect2(ctx, question, options) {
  return new Promise((resolve3) => {
    const component = new AskQuestionInlineComponent(
      {
        question,
        options: options.map((option) => ({ label: option.label, description: option.description })),
        onSubmit: (answer) => {
          ctx.state.activeInlineQuestion = void 0;
          const selected = options.find((option) => option.label === answer);
          const trimmed = answer.trim();
          resolve3(selected?.value ?? (trimmed.length > 0 ? trimmed : null));
        },
        onCancel: () => {
          ctx.state.activeInlineQuestion = void 0;
          resolve3(null);
        }
      },
      ctx.state.ui
    );
    ctx.state.activeInlineQuestion = component;
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.chatContainer.addChild(component);
    ctx.state.chatContainer.addChild(new piTui.Spacer(1));
    ctx.state.ui.requestRender();
    ctx.state.chatContainer.invalidate();
  });
}
async function refreshGatewayModels(ctx) {
  try {
    await llm.GatewayRegistry.getInstance({ useDynamicLoading: true }).syncGateways(true);
  } catch (error) {
    ctx.showError(`Failed to refresh gateway models: ${error instanceof Error ? error.message : String(error)}`);
  }
}
async function handleMemoryGatewayCommand(ctx) {
  const authStorage = ctx.authStorage;
  if (!authStorage) {
    ctx.showError("Auth storage not available");
    return;
  }
  const currentKey = authStorage.getStoredApiKey(chunkWOKNPWRC_cjs.MEMORY_GATEWAY_PROVIDER) ?? process.env["MASTRA_GATEWAY_API_KEY"];
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  const effectiveUrl = settings.memoryGateway?.baseUrl ?? process.env["MASTRA_GATEWAY_URL"] ?? chunkWOKNPWRC_cjs.MEMORY_GATEWAY_DEFAULT_URL;
  if (currentKey) {
    const masked = currentKey.length > 6 ? `****${currentKey.slice(-4)}` : "****";
    ctx.showInfo(`Current API key: ${masked} | URL: ${effectiveUrl}`);
  } else {
    ctx.showInfo(`No API key set | URL: ${effectiveUrl}`);
  }
  const keyAnswer = await askText2(
    ctx,
    currentKey ? `API key (ENTER to keep current, 'clear' to remove, ESC to skip):` : `API key (or 'clear' to remove, ESC to cancel):`,
    currentKey
  );
  if (keyAnswer === null) {
    if (!currentKey) return;
  } else if (keyAnswer.toLowerCase() === "clear") {
    authStorage.remove(`apikey:${chunkWOKNPWRC_cjs.MEMORY_GATEWAY_PROVIDER}`);
    delete process.env["MASTRA_GATEWAY_API_KEY"];
    delete process.env["MASTRA_GATEWAY_URL"];
    settings.memoryGateway = {};
    chunkWOKNPWRC_cjs.saveSettings(settings);
    await refreshGatewayModels(ctx);
    ctx.showInfo("Memory gateway cleared. Memory mode changes take effect on next restart.");
    return;
  } else if (keyAnswer.length > 0) {
    authStorage.setStoredApiKey(chunkWOKNPWRC_cjs.MEMORY_GATEWAY_PROVIDER, keyAnswer, "MASTRA_GATEWAY_API_KEY");
  }
  const urlChoice = await askSelect2(ctx, "Gateway URL", [
    {
      label: chunkWOKNPWRC_cjs.MEMORY_GATEWAY_DEFAULT_URL,
      value: chunkWOKNPWRC_cjs.MEMORY_GATEWAY_DEFAULT_URL,
      description: effectiveUrl === chunkWOKNPWRC_cjs.MEMORY_GATEWAY_DEFAULT_URL ? "current" : "hosted default"
    },
    {
      label: "http://localhost:4111",
      value: "http://localhost:4111",
      description: effectiveUrl === "http://localhost:4111" ? "current" : "local development"
    }
  ]);
  if (urlChoice === null) {
    return;
  }
  const urlAnswer = urlChoice;
  if (urlAnswer && urlAnswer !== chunkWOKNPWRC_cjs.MEMORY_GATEWAY_DEFAULT_URL) {
    settings.memoryGateway = { baseUrl: urlAnswer };
    process.env["MASTRA_GATEWAY_URL"] = urlAnswer;
  } else {
    settings.memoryGateway = {};
    delete process.env["MASTRA_GATEWAY_URL"];
  }
  chunkWOKNPWRC_cjs.saveSettings(settings);
  await refreshGatewayModels(ctx);
  ctx.showInfo("Memory gateway configured. Memory mode changes take effect on next restart.");
}

// src/tui/command-dispatch.ts
async function dispatchSlashCommand(input, state, buildCtx) {
  const trimmedInput = input.trim();
  const slashMatch = trimmedInput.match(/^(\/\/?)(.*)$/);
  const slashPrefix = slashMatch?.[1] ?? "";
  const withoutSlashes = slashMatch?.[2] ?? trimmedInput;
  if (slashPrefix === "//") {
    const [cmdName, ...cmdArgs] = withoutSlashes.split(" ");
    const customCommand = state.customSlashCommands.find((cmd) => cmd.name === cmdName);
    if (customCommand) {
      await handleCustomSlashCommand(state, customCommand, cmdArgs);
      return true;
    }
    showError(state, `Unknown custom command: ${cmdName}`);
    return true;
  }
  const [command, ...args] = withoutSlashes.split(" ");
  switch (command) {
    case "new":
      handleNewCommand(buildCtx());
      return true;
    case "clone":
      await handleCloneCommand(buildCtx());
      return true;
    case "threads":
      await handleThreadsCommand(buildCtx());
      return true;
    case "thread":
      await handleThreadCommand(buildCtx());
      return true;
    case "skills":
      await handleSkillsCommand(buildCtx());
      return true;
    case "thread:tag-dir":
      await handleThreadTagDirCommand(buildCtx());
      return true;
    case "sandbox":
      await handleSandboxCommand(buildCtx(), args);
      return true;
    case "mode":
      await handleModeCommand(buildCtx(), args);
      return true;
    case "models":
      await handleModelsPackCommand(buildCtx());
      return true;
    case "custom-providers":
      await handleCustomProvidersCommand(buildCtx());
      return true;
    case "subagents":
      await handleSubagentsCommand(buildCtx());
      return true;
    case "om":
      await handleOMCommand(buildCtx());
      return true;
    case "think":
      await handleThinkCommand(buildCtx(), args);
      return true;
    case "permissions":
      await handlePermissionsCommand(buildCtx(), args);
      return true;
    case "yolo":
      handleYoloCommand(buildCtx());
      return true;
    case "settings":
      await handleSettingsCommand(buildCtx());
      return true;
    case "login":
      await handleLoginCommand(buildCtx(), "login");
      return true;
    case "logout":
      await handleLoginCommand(buildCtx(), "logout");
      return true;
    case "cost":
      handleCostCommand(buildCtx());
      return true;
    case "diff":
      await handleDiffCommand(buildCtx(), args[0]);
      return true;
    case "name":
      await handleNameCommand(buildCtx(), args);
      return true;
    case "resource":
      await handleResourceCommand(buildCtx(), args);
      return true;
    case "exit":
      handleExitCommand(buildCtx());
      return true;
    case "help":
      handleHelpCommand(buildCtx());
      return true;
    case "hooks":
      handleHooksCommand(buildCtx(), args);
      return true;
    case "mcp":
      await handleMcpCommand(buildCtx(), args);
      return true;
    case "review":
      await handleReviewCommand(buildCtx(), args);
      return true;
    case "report-issue":
      await handleReportIssueCommand(buildCtx(), args);
      return true;
    case "setup":
      await handleSetupCommand(buildCtx());
      return true;
    case "theme":
      await handleThemeCommand(buildCtx(), args);
      return true;
    case "update":
      await handleUpdateCommand(buildCtx());
      return true;
    case "memory-gateway":
      await handleMemoryGatewayCommand(buildCtx());
      return true;
    default: {
      const customCommand = state.customSlashCommands.find((cmd) => cmd.name === command);
      if (customCommand) {
        await handleCustomSlashCommand(state, customCommand, args);
        return true;
      }
      showError(state, `Unknown command: ${command}`);
      return true;
    }
  }
}
async function handleCustomSlashCommand(state, command, args) {
  try {
    const processedContent = await processSlashCommand(command, args, process.cwd());
    if (processedContent.trim()) {
      const slashComp = new SlashCommandComponent(command.name, processedContent.trim());
      state.allSlashCommandComponents.push(slashComp);
      state.chatContainer.addChild(slashComp);
      state.ui.requestRender();
      const wrapped = `<slash-command name="${command.name}">
${processedContent.trim()}
</slash-command>`;
      await state.extension.harnessAdapter.sendMessage(state.harness, { content: wrapped });
    } else {
      showInfo(state, `Executed //${command.name} (no output)`);
    }
  } catch (error) {
    showError(state, `Error executing //${command.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
function handleAgentStart(ctx) {
  const { state } = ctx;
  const freshBranch = chunkP2NLJLNZ_cjs.getCurrentGitBranch(state.projectInfo.rootPath);
  if (freshBranch) {
    state.projectInfo.gitBranch = freshBranch;
  }
  if (!state.gradientAnimator) {
    state.gradientAnimator = new GradientAnimator(() => {
      ctx.updateStatusLine();
    });
  }
  state.gradientAnimator.start();
}
function handleAgentEnd(ctx) {
  const { state } = ctx;
  if (state.gradientAnimator) {
    state.gradientAnimator.fadeOut();
  }
  const freshBranch = chunkP2NLJLNZ_cjs.getCurrentGitBranch(state.projectInfo.rootPath);
  if (freshBranch) {
    state.projectInfo.gitBranch = freshBranch;
  }
  if (state.streamingComponent) {
    state.streamingComponent = void 0;
    state.streamingMessage = void 0;
  }
  state.followUpComponents = [];
  state.pendingTools.clear();
  ctx.updateStatusLine();
  state.ui.requestRender();
  ctx.notify("agent_done");
  if (state.harness.getFollowUpCount() > 0) {
    return;
  }
  const nextAction = state.pendingQueuedActions.shift();
  ctx.updateStatusLine();
  if (!nextAction) {
    return;
  }
  if (nextAction === "message") {
    const nextMessage = state.pendingFollowUpMessages.shift();
    if (!nextMessage) {
      return;
    }
    ctx.addUserMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: [
        { type: "text", text: nextMessage.content },
        ...nextMessage.images?.map((img) => ({
          type: "image",
          data: img.data,
          mimeType: img.mimeType
        })) ?? []
      ],
      createdAt: /* @__PURE__ */ new Date()
    });
    state.ui.requestRender();
    ctx.fireMessage(nextMessage.content, nextMessage.images);
    return;
  }
  const nextCommand = state.pendingSlashCommands.shift();
  if (!nextCommand) {
    return;
  }
  ctx.handleSlashCommand(nextCommand).catch((error) => {
    ctx.showError(error instanceof Error ? error.message : "Queued slash command failed");
  });
}
function handleAgentAborted(ctx) {
  const { state } = ctx;
  if (state.gradientAnimator) {
    state.gradientAnimator.fadeOut();
  }
  if (state.streamingComponent && state.streamingMessage) {
    state.streamingMessage.stopReason = "aborted";
    state.streamingMessage.errorMessage = "Interrupted";
    state.streamingComponent.updateContent(state.streamingMessage);
    state.streamingComponent = void 0;
    state.streamingMessage = void 0;
  } else if (state.userInitiatedAbort) {
    state.chatContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("error", "Interrupted"), chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    state.chatContainer.addChild(new piTui.Spacer(1));
  }
  state.userInitiatedAbort = false;
  state.followUpComponents = [];
  state.pendingFollowUpMessages = [];
  state.pendingQueuedActions = [];
  state.pendingSlashCommands = [];
  state.pendingTools.clear();
  ctx.updateStatusLine();
  state.ui.requestRender();
}
function handleAgentError(ctx) {
  const { state } = ctx;
  if (state.gradientAnimator) {
    state.gradientAnimator.fadeOut();
  }
  if (state.streamingComponent) {
    state.streamingComponent = void 0;
    state.streamingMessage = void 0;
  }
  state.followUpComponents = [];
  state.pendingFollowUpMessages = [];
  state.pendingQueuedActions = [];
  state.pendingSlashCommands = [];
  state.pendingTools.clear();
  ctx.updateStatusLine();
  state.ui.requestRender();
}
var _compId = 0;
function asmDebugLog(...args) {
  if (!["true", "1"].includes(process.env.MASTRA_TUI_DEBUG)) {
    return;
  }
  const line = `[ASM ${(/* @__PURE__ */ new Date()).toISOString()}] ${args.map((a) => typeof a === "string" ? a : JSON.stringify(a)).join(" ")}
`;
  try {
    fs2__default.default.appendFileSync(path6__namespace.default.join(process.cwd(), "tui-debug.log"), line);
  } catch {
  }
}
var AssistantMessageComponent = class extends piTui.Container {
  contentContainer;
  hideThinkingBlock;
  markdownTheme;
  lastMessage;
  _id;
  constructor(message, hideThinkingBlock = false, markdownTheme = chunkWOKNPWRC_cjs.getMarkdownTheme()) {
    super();
    this._id = ++_compId;
    this.hideThinkingBlock = hideThinkingBlock;
    this.markdownTheme = markdownTheme;
    this.contentContainer = new piTui.Container();
    this.addChild(this.contentContainer);
    this.addChild(new piTui.Spacer(1));
    asmDebugLog(`COMP#${this._id} CREATED`);
    if (message) {
      this.updateContent(message);
    }
  }
  invalidate() {
    super.invalidate();
    if (this.lastMessage) {
      const summary = this.lastMessage.content.map((c) => c.type === "text" ? `text(${c.text.length}ch)` : c.type).join(", ");
      asmDebugLog(`COMP#${this._id} INVALIDATE lastMessage=[${summary}]`);
      this.updateContent(this.lastMessage);
    }
  }
  setHideThinkingBlock(hide) {
    this.hideThinkingBlock = hide;
  }
  updateContent(message) {
    this.lastMessage = {
      ...message,
      content: message.content.map((c) => ({ ...c }))
    };
    this.contentContainer.clear();
    for (let i = 0; i < message.content.length; i++) {
      const content = message.content[i];
      if (content.type === "text" && content.text.trim()) {
        this.contentContainer.addChild(
          new piTui.Markdown(content.text.trim(), chunkWOKNPWRC_cjs.CHAT_INDENT, 0, this.markdownTheme, {
            color: (text) => chunkWOKNPWRC_cjs.theme.fg("text", text)
          })
        );
      } else if (content.type === "thinking" && content.thinking.trim()) {
        const hasTextAfter = message.content.slice(i + 1).some((c) => c.type === "text" && c.text.trim());
        if (this.hideThinkingBlock) {
          this.contentContainer.addChild(
            new piTui.Text(chunkWOKNPWRC_cjs.theme.italic(chunkWOKNPWRC_cjs.theme.fg("thinkingText", "Thinking...")), chunkWOKNPWRC_cjs.CHAT_INDENT, 0)
          );
          if (hasTextAfter) {
            this.contentContainer.addChild(new piTui.Spacer(1));
          }
        } else {
          this.contentContainer.addChild(
            new piTui.Markdown(content.thinking.trim(), chunkWOKNPWRC_cjs.CHAT_INDENT, 0, this.markdownTheme, {
              color: (text) => chunkWOKNPWRC_cjs.theme.fg("thinkingText", text),
              italic: true
            })
          );
          this.contentContainer.addChild(new piTui.Spacer(1));
        }
      }
    }
    if (message.stopReason === "aborted") {
      const abortMessage = message.errorMessage || "Interrupted";
      this.contentContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("error", abortMessage), chunkWOKNPWRC_cjs.CHAT_INDENT, 0));
    } else if (message.stopReason === "error") {
      const errorMsg = message.errorMessage || "Unknown error";
      this.contentContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("error", `Error: ${errorMsg}`), chunkWOKNPWRC_cjs.CHAT_INDENT, 0));
    }
  }
};
var MAX_COLLAPSED_LINES2 = 10;
var GENERIC_DYNAMIC_REMINDER_PREFIX = "When using guidance from a discovered instruction file";
var SystemReminderComponent = class extends piTui.Container {
  messageLines;
  reminderType;
  path;
  expanded = false;
  isExpanded() {
    return this.expanded;
  }
  constructor(options) {
    super();
    const resolvedMessage = resolveReminderMessage(options.message, options.path);
    this.messageLines = resolvedMessage.length ? resolvedMessage.split("\n").map((line) => line.trimEnd()).filter((line) => line.length > 0) : [getLoadingMessage(options.reminderType, options.path)];
    this.reminderType = options.reminderType;
    this.path = options.path;
    this.rebuild();
  }
  setExpanded(expanded) {
    if (this.expanded === expanded) {
      return;
    }
    this.expanded = expanded;
    this.rebuild();
  }
  toggleExpanded() {
    this.setExpanded(!this.expanded);
  }
  rebuild() {
    this.clear();
    const border = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", char));
    const title = chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", getReminderTitle(this.reminderType, this.path)));
    const metadataColor = (text) => chunkWOKNPWRC_cjs.theme.fg("dim", text);
    const bodyColor = (text) => chunkWOKNPWRC_cjs.theme.fg("text", text);
    const hintColor = (text) => chunkWOKNPWRC_cjs.theme.fg("dim", text);
    const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
    const innerWidth = Math.max(20, termWidth - chunkWOKNPWRC_cjs.BOX_INDENT * 2 - 4);
    const horizontal = "\u2500".repeat(innerWidth + 1);
    const metadataLines = [this.path ? formatReminderPath(this.path) : void 0].filter(
      (line) => Boolean(line)
    );
    const wrappedMessageLines = wrapLines(this.messageLines, innerWidth);
    const shouldCollapse = wrappedMessageLines.length > MAX_COLLAPSED_LINES2;
    const visibleMessageLines = shouldCollapse && !this.expanded ? wrappedMessageLines.slice(0, MAX_COLLAPSED_LINES2) : wrappedMessageLines;
    this.addChild(new piTui.Text(`${border("\u256D")}${border(horizontal)}${border("\u256E")}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    this.addChild(new piTui.Text(renderRow(title, innerWidth, border), chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    for (const line of metadataLines) {
      this.addChild(new piTui.Text(renderRow(metadataColor(line), innerWidth, border), chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    }
    if (metadataLines.length > 0 && visibleMessageLines.length > 0) {
      this.addChild(new piTui.Text(renderRow("", innerWidth, border), chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    }
    for (const line of visibleMessageLines) {
      this.addChild(new piTui.Text(renderRow(bodyColor(line), innerWidth, border), chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    }
    if (shouldCollapse && !this.expanded) {
      const remaining = wrappedMessageLines.length - visibleMessageLines.length;
      const hint = hintColor(`... ${remaining} more lines (ctrl+e to expand)`);
      this.addChild(new piTui.Text(renderRow(hint, innerWidth, border), chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    }
    this.addChild(new piTui.Text(`${border("\u2570")}${border(horizontal)}${border("\u256F")}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    this.addChild(new piTui.Spacer(1));
  }
};
function renderRow(text, width, border) {
  const content = padLine(text, width);
  const rightPadding = hasWideGlyph(stripAnsi__default.default(text)) ? " " : "";
  return `${border("\u2502")} ${content}${rightPadding}${border("\u2502")}`;
}
function resolveReminderMessage(message, path7) {
  const trimmedMessage = message?.trim();
  if (trimmedMessage && trimmedMessage !== "undefined" && !trimmedMessage.startsWith(GENERIC_DYNAMIC_REMINDER_PREFIX)) {
    return trimmedMessage;
  }
  if (!path7) {
    return trimmedMessage && trimmedMessage !== "undefined" ? trimmedMessage : "";
  }
  try {
    const fileContent = fs2.readFileSync(path7, "utf-8").trim();
    if (fileContent.length > 0) {
      return fileContent;
    }
  } catch {
  }
  return trimmedMessage && trimmedMessage !== "undefined" ? trimmedMessage : "";
}
function getReminderTitle(reminderType, path7) {
  return reminderType === "dynamic-agents-md" || isAgentsInstructionPath(path7) ? "Loaded AGENTS.md" : "System Reminder";
}
function getLoadingMessage(reminderType, path7) {
  return reminderType === "dynamic-agents-md" || isAgentsInstructionPath(path7) ? "Loading instruction file contents\u2026" : "Loading reminder\u2026";
}
function isAgentsInstructionPath(path7) {
  return typeof path7 === "string" && /(?:^|\/)AGENTS\.md$/i.test(path7);
}
function formatReminderPath(path7) {
  const cwd = process2__default.default.cwd();
  if (path7 === cwd) {
    return ".";
  }
  const cwdPrefix = `${cwd}/`;
  return path7.startsWith(cwdPrefix) ? path7.slice(cwdPrefix.length) : path7;
}
function hasWideGlyph(text) {
  return [...text].some(
    (char) => /[\p{Extended_Pictographic}\u1100-\u115F\u2329\u232A\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/u.test(
      char
    )
  );
}
function wrapLines(lines, maxLineWidth) {
  if (lines.length === 0) {
    return [""];
  }
  const wrappedLines = [];
  for (const line of lines) {
    if (line.length <= maxLineWidth) {
      wrappedLines.push(line);
      continue;
    }
    let remaining = line;
    while (remaining.length > maxLineWidth) {
      const breakAt = remaining.lastIndexOf(" ", maxLineWidth);
      const splitAt = breakAt > 0 ? breakAt : maxLineWidth;
      wrappedLines.push(remaining.slice(0, splitAt));
      remaining = remaining.slice(splitAt).trimStart();
    }
    if (remaining.length > 0) {
      wrappedLines.push(remaining);
    }
  }
  return wrappedLines;
}
function padLine(text, width) {
  const visibleLength = stripAnsi__default.default(text).length;
  if (visibleLength === width) {
    return text;
  }
  if (visibleLength > width) {
    return truncateLine(text, width);
  }
  return text + " ".repeat(width - visibleLength);
}
function truncateLine(text, width) {
  const plain = stripAnsi__default.default(text);
  return plain.length <= width ? text : plain.slice(0, Math.max(0, width - 1)) + "\u2026";
}
var CollapsibleComponent = class extends piTui.Container {
  expanded;
  header;
  summary;
  content = [];
  options;
  ui;
  constructor(options, ui) {
    super();
    this.options = {
      expanded: false,
      collapsedLines: 10,
      expandedLines: 100,
      showLineCount: true,
      ...options
    };
    this.expanded = this.options.expanded ?? false;
    this.header = options.header;
    this.summary = options.summary;
    this.ui = ui;
    this.updateDisplay();
  }
  setContent(content) {
    this.content = Array.isArray(content) ? content : content.split("\n");
    this.updateDisplay();
  }
  isExpanded() {
    return this.expanded;
  }
  setExpanded(expanded) {
    this.expanded = expanded;
    this.updateDisplay();
  }
  toggle() {
    this.expanded = !this.expanded;
    this.updateDisplay();
  }
  updateDisplay() {
    this.clear();
    const lineCount = this.options.showLineCount && this.content.length > 0 ? chunkWOKNPWRC_cjs.theme.fg("muted", ` (${this.content.length} lines)`) : "";
    const headerText = typeof this.header === "string" ? `${this.header}${lineCount}` : this.header;
    if (typeof headerText === "string") {
      this.addChild(new piTui.Text(headerText, 0, 0));
    } else {
      this.addChild(headerText);
    }
    if (!this.expanded && this.summary) {
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", this.summary), 0, 0));
      return;
    }
    if (this.content.length === 0) return;
    const maxLines = this.expanded ? this.options.expandedLines : this.options.collapsedLines;
    if (maxLines === 0 && !this.expanded) {
      return;
    }
    const linesToShow = Math.min(this.content.length, maxLines);
    const hasMore = this.content.length > maxLines;
    for (let i = 0; i < linesToShow; i++) {
      this.addChild(new piTui.Text(this.content[i], 0, 0));
    }
    if (hasMore) {
      const remaining = this.content.length - linesToShow;
      const action = this.expanded ? "collapse" : "expand";
      const hint = chunkWOKNPWRC_cjs.theme.fg("muted", `... ${remaining} more lines (Ctrl+E to ${action} all)`);
      this.addChild(new piTui.Text(hint, 0, 0));
    }
  }
};

// src/tui/components/error-display.ts
function parseErrorInfo(error) {
  if (typeof error === "string") {
    const lines = error.split("\n").filter((line) => line.trim());
    const firstLine = lines[0] || "";
    if (firstLine.includes("command not found")) {
      const cmdMatch = firstLine.match(/(\w+):\s*command not found/);
      return {
        name: "CommandNotFoundError",
        message: cmdMatch ? `'${cmdMatch[1]}' is not a recognized command` : firstLine
      };
    }
    const cleanedError = error.replace(/^Output:\s*/m, "");
    const cleanedLines = cleanedError.split("\n").filter((line) => line.trim());
    const nodeErrorMatch = cleanedError.match(/^([A-Z][a-zA-Z]*Error):\s*(.+)$/m);
    if (nodeErrorMatch) {
      const stackLines = cleanedLines.filter((line) => line.match(/^\s*at\s+/));
      return {
        name: nodeErrorMatch[1],
        message: nodeErrorMatch[2],
        stack: stackLines.length > 0 ? stackLines.join("\n") : void 0
      };
    }
    const errorMatch = firstLine.match(/^([A-Z][a-zA-Z]*Error):\s*(.+)$/);
    if (errorMatch) {
      return {
        name: errorMatch[1],
        message: errorMatch[2],
        stack: lines.slice(1).join("\n")
      };
    }
    const fileMatch = error.match(/at\s+(.+?):(\d+):?(\d+)?/);
    return {
      message: cleanedLines[0] || firstLine,
      stack: cleanedLines.length > 1 ? cleanedLines.slice(1).join("\n") : void 0,
      file: fileMatch?.[1],
      line: fileMatch?.[2] ? parseInt(fileMatch[2]) : void 0,
      column: fileMatch?.[3] ? parseInt(fileMatch[3]) : void 0
    };
  }
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code
  };
}
function formatStackTrace(stack) {
  const lines = stack.split("\n");
  return lines.map((line) => {
    if (line.match(/^\s*at\s+/)) {
      return line.replace(
        /(\s+at\s+)([^(]+)(\s*\()([^)]+)(\))/,
        (match, at, fn, open, loc, close) => `${chunkWOKNPWRC_cjs.theme.fg("muted", at)}${chunkWOKNPWRC_cjs.theme.fg("function", fn)}${chunkWOKNPWRC_cjs.theme.fg("muted", open)}${chunkWOKNPWRC_cjs.theme.fg("path", loc)}${chunkWOKNPWRC_cjs.theme.fg("muted", close)}`
      );
    }
    if (!line.trim() || line.includes("node_modules")) {
      return chunkWOKNPWRC_cjs.theme.fg("muted", line);
    }
    return line;
  });
}
var CollapsibleStackTrace = class extends CollapsibleComponent {
  constructor(stack, options = {}, ui) {
    super(
      {
        header: "Stack Trace",
        expanded: options.expanded ?? false,
        collapsedLines: 5,
        expandedLines: 100,
        showLineCount: true
      },
      ui
    );
    const formattedLines = formatStackTrace(stack);
    this.setContent(formattedLines.join("\n"));
  }
};
var ErrorDisplayComponent = class extends piTui.Container {
  constructor(error, options = {}, ui) {
    super();
    this.error = error;
    this.options = options;
    this.ui = ui;
    this.build();
  }
  build() {
    const info = parseErrorInfo(this.error);
    const box = new piTui.Box(chunkWOKNPWRC_cjs.BOX_INDENT, 0, (text) => text);
    this.addChild(box);
    const borderTop = new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("error", "\u256D\u2500 Error \u2500" + "\u2500".repeat(50) + "\u256E"), 0, 0);
    box.addChild(borderTop);
    const errorContainer = new piTui.Container();
    const errorBg = (text) => chunkWOKNPWRC_cjs.theme.bg("errorBg", text);
    if (info.name && info.name !== "Error") {
      const typeLine = new piTui.Container();
      typeLine.addChild(new piTui.Text("\u2502 ", 0, 0));
      typeLine.addChild(new piTui.Text(errorBg(` ${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("error", info.name))} `), 0, 0));
      errorContainer.addChild(typeLine);
    }
    const msgLine = new piTui.Container();
    msgLine.addChild(new piTui.Text("\u2502 ", 0, 0));
    msgLine.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(info.message), 0, 0));
    errorContainer.addChild(msgLine);
    if (info.file && info.line) {
      const location = `${info.file}:${info.line}${info.column ? `:${info.column}` : ""}`;
      errorContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", `  at ${location}`), 0, 0));
    }
    box.addChild(errorContainer);
    if (this.options.showContext && info.context) {
      box.addChild(new piTui.Spacer(1));
      box.addChild(this.createCodeContext(info.context, info.line));
    }
    if (this.options.showStack && info.stack) {
      box.addChild(new piTui.Spacer(1));
      box.addChild(new CollapsibleStackTrace(info.stack, { expanded: this.options.expanded }, this.ui));
    }
    const borderBottom = new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("error", "\u2570" + "\u2500".repeat(59) + "\u256F"), 0, 0);
    box.addChild(borderBottom);
    this.addChild(new piTui.Spacer(1));
  }
  createCodeContext(context, errorLine) {
    const container = new piTui.Container();
    const codeBlock = new piTui.Container();
    codeBlock.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "Code context:"), 0, 0));
    if (context.before) {
      context.before.forEach((line, i) => {
        const lineNum = errorLine ? errorLine - context.before.length + i : i + 1;
        codeBlock.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", `${lineNum.toString().padStart(4)} \u2502 ${line}`), 0, 0));
      });
    }
    if (context.line && errorLine) {
      codeBlock.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("error", `${errorLine.toString().padStart(4)} \u2502 ${context.line}`), 0, 0));
    }
    if (context.after) {
      context.after.forEach((line, i) => {
        const lineNum = errorLine ? errorLine + i + 1 : i + 1;
        codeBlock.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", `${lineNum.toString().padStart(4)} \u2502 ${line}`), 0, 0));
      });
    }
    container.addChild(codeBlock);
    return container;
  }
};
function parseValidationErrors(error) {
  const errors = [];
  if (typeof error === "string") {
    const zodMatch = error.match(/at "([^"]+)".*?: (.+?)(?:\n|$)/g);
    if (zodMatch) {
      zodMatch.forEach((match) => {
        const [, field, message] = match.match(/at "([^"]+)".*?: (.+?)(?:\n|$)/) || [];
        if (field && message) {
          errors.push({ field, message });
        }
      });
    }
    const missingMatch = error.match(/missing required.*?["`'](\w+)["`']/i);
    if (missingMatch) {
      errors.push({
        field: missingMatch[1],
        message: "Required parameter is missing"
      });
    }
    if (errors.length === 0) {
      errors.push({
        field: "unknown",
        message: error
      });
    }
  } else if (typeof error === "object" && error !== null) {
    const err = error;
    if (err.issues && Array.isArray(err.issues)) {
      err.issues.forEach((issue) => {
        errors.push({
          field: issue.path?.join(".") || "unknown",
          message: issue.message,
          expected: issue.expected,
          received: issue.received
        });
      });
    } else if (err.message) {
      errors.push({
        field: err.field || "unknown",
        message: err.message
      });
    }
  }
  return errors.length > 0 ? errors : [{ field: "unknown", message: String(error) }];
}
function formatArgs(args) {
  if (!args || typeof args !== "object") return [];
  const lines = [];
  const obj = args;
  for (const [key, value] of Object.entries(obj)) {
    let valueStr;
    if (value === null || value === void 0) {
      valueStr = chunkWOKNPWRC_cjs.theme.fg("muted", "undefined");
    } else if (typeof value === "string") {
      valueStr = value.length > 50 ? `"${value.slice(0, 47)}..."` : `"${value}"`;
    } else if (typeof value === "object") {
      valueStr = utils.safeStringify(value);
      if (valueStr.length > 50) {
        valueStr = valueStr.slice(0, 47) + "...";
      }
    } else {
      valueStr = String(value);
    }
    lines.push(`  ${chunkWOKNPWRC_cjs.theme.fg("accent", key)}: ${valueStr}`);
  }
  return lines;
}
var ToolValidationErrorComponent = class extends piTui.Container {
  constructor(options, _ui) {
    super();
    const { toolName, errors, args } = options;
    this.addChild(
      new piTui.Text(
        `${chunkWOKNPWRC_cjs.theme.fg("error", "\u2717 Tool validation failed: ")}${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", toolName))}`,
        0,
        0
      )
    );
    this.addChild(new piTui.Text("", 0, 0));
    errors.forEach((error, index) => {
      if (index > 0) {
        this.addChild(new piTui.Text("", 0, 0));
      }
      if (error.field !== "unknown") {
        this.addChild(new piTui.Text(`${chunkWOKNPWRC_cjs.theme.fg("muted", "  Parameter: ")}${chunkWOKNPWRC_cjs.theme.fg("accent", error.field)}`, 0, 0));
      }
      this.addChild(new piTui.Text(`${chunkWOKNPWRC_cjs.theme.fg("muted", "  Issue: ")}${chunkWOKNPWRC_cjs.theme.fg("error", error.message)}`, 0, 0));
      if (error.expected || error.received) {
        let detail = "";
        if (error.expected) {
          detail += `${chunkWOKNPWRC_cjs.theme.fg("muted", "  Expected: ")}${chunkWOKNPWRC_cjs.theme.fg("success", error.expected)}`;
          if (error.received) detail += chunkWOKNPWRC_cjs.theme.fg("muted", ", ");
        }
        if (error.received) {
          detail += `${chunkWOKNPWRC_cjs.theme.fg("muted", "Received: ")}${chunkWOKNPWRC_cjs.theme.fg("error", error.received)}`;
        }
        this.addChild(new piTui.Text(detail, 0, 0));
      }
    });
    if (args && Object.keys(args).length > 0) {
      this.addChild(new piTui.Text("", 0, 0));
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "Provided arguments:"), 0, 0));
      const argsLines = formatArgs(args);
      argsLines.forEach((line) => {
        this.addChild(new piTui.Text(line, 0, 0));
      });
    }
    const suggestions = this.generateSuggestions(toolName, errors);
    if (suggestions.length > 0) {
      this.addChild(new piTui.Text("", 0, 0));
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "Suggestions:")), 0, 0));
      suggestions.forEach((suggestion) => {
        this.addChild(new piTui.Text(`  \u2022 ${suggestion}`, 0, 0));
      });
    }
  }
  generateSuggestions(toolName, errors) {
    const suggestions = [];
    const missingParams = errors.filter(
      (e) => e.message.toLowerCase().includes("required") || e.message.toLowerCase().includes("missing")
    );
    if (missingParams.length > 0) {
      const params = missingParams.map((e) => e.field).filter((f) => f !== "unknown");
      if (params.length > 0) {
        suggestions.push(`Add the required parameter${params.length > 1 ? "s" : ""}: ${params.join(", ")}`);
      }
    }
    const typeErrors = errors.filter(
      (e) => e.message.toLowerCase().includes("type") || e.message.toLowerCase().includes("expected")
    );
    if (typeErrors.length > 0) {
      suggestions.push("Check that parameter types match the expected format");
    }
    if (toolName === "ask_user" && errors.some((e) => e.field === "question")) {
      suggestions.push('Make sure to provide a "question" parameter with your question text');
    }
    if (toolName === chunkOBFBUWOR_cjs.MC_TOOLS.EXECUTE_COMMAND && errors.some((e) => e.field === "command")) {
      suggestions.push('Provide a "command" parameter with the command to execute');
    }
    if (toolName === chunkOBFBUWOR_cjs.MC_TOOLS.VIEW && errors.some((e) => e.field === "path")) {
      suggestions.push('Provide a "path" parameter with the file or directory path');
    }
    return suggestions;
  }
};

// src/tui/components/tool-execution-enhanced.ts
function shortenPath(path7) {
  const home = os__namespace.homedir();
  if (path7.startsWith(home)) {
    return `~${path7.slice(home.length)}`;
  }
  return path7;
}
function resolveAbsolutePath(filePath) {
  if (filePath.startsWith("/")) return filePath;
  if (filePath.startsWith("~")) {
    return os__namespace.homedir() + filePath.slice(1);
  }
  return process.cwd() + "/" + filePath;
}
function fileLink(displayText, filePath, line) {
  const absPath = resolveAbsolutePath(filePath);
  const lineFragment = line ? `#${line}` : "";
  return `\x1B]8;;file://${absPath}${lineFragment}\x07${displayText}\x1B]8;;\x07`;
}
function isWebSearchTool(name) {
  return name === "web_search" || /^web_search_\d+$/.test(name);
}
function extractContent(text) {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "object" && parsed !== null) {
      if ("content" in parsed) {
        const content = parsed.content;
        let contentStr;
        if (typeof content === "string") {
          contentStr = content;
        } else if (Array.isArray(content)) {
          contentStr = content.filter(
            (part) => typeof part === "object" && part !== null && part.type === "text"
          ).map((part) => part.text || "").join("");
        } else {
          contentStr = JSON.stringify(content, null, 2);
        }
        return {
          content: contentStr,
          isError: Boolean(parsed.isError)
        };
      }
      return { content: JSON.stringify(parsed, null, 2), isError: false };
    }
  } catch {
  }
  return { content: text, isError: false };
}
var ToolExecutionComponentEnhanced = class extends piTui.Container {
  contentBox;
  toolName;
  args;
  expanded = false;
  isPartial = true;
  ui;
  result;
  options;
  startTime = Date.now();
  streamingOutput = "";
  // Buffer for streaming shell output
  constructor(toolName, args, options = {}, ui) {
    super();
    this.toolName = toolName;
    this.args = args;
    this.ui = ui;
    this.options = {
      autoCollapse: true,
      collapsedByDefault: true,
      ...options
    };
    this.expanded = !this.options.collapsedByDefault;
    this.contentBox = new piTui.Box(chunkWOKNPWRC_cjs.BOX_INDENT, 0, (text) => text);
    this.addChild(this.contentBox);
    this.addChild(new piTui.Spacer(2));
    this.rebuild();
  }
  updateArgs(args) {
    this.args = args;
    this.rebuild();
  }
  updateResult(result, isPartial = false) {
    this.result = result;
    this.isPartial = isPartial;
    this.rebuild();
  }
  /**
   * Append streaming shell output.
   * Only for execute_command tool - shows live output while command runs.
   */
  appendStreamingOutput(output) {
    if (this.toolName !== chunkOBFBUWOR_cjs.MC_TOOLS.EXECUTE_COMMAND && this.toolName !== chunkOBFBUWOR_cjs.MC_TOOLS.GET_PROCESS_OUTPUT && this.toolName !== chunkOBFBUWOR_cjs.MC_TOOLS.KILL_PROCESS) {
      return;
    }
    this.streamingOutput += output;
    this.rebuild();
  }
  setExpanded(expanded) {
    this.expanded = expanded;
    this.rebuild();
  }
  toggleExpanded() {
    this.setExpanded(!this.expanded);
  }
  invalidate() {
    super.invalidate();
    this.updateBgColor();
  }
  updateBgColor() {
    this.contentBox.setBgFn((text) => text);
  }
  /**
   * Full clear-and-rebuild. Called when:
   * - args change (updateArgs)
   * - result arrives or changes (updateResult)
   * - expand/collapse on a tool with no collapsible child
   * - initial construction
   */
  rebuild() {
    this.updateBgColor();
    this.contentBox.clear();
    switch (this.toolName) {
      case chunkOBFBUWOR_cjs.MC_TOOLS.VIEW:
        this.renderViewToolEnhanced();
        break;
      case chunkOBFBUWOR_cjs.MC_TOOLS.EXECUTE_COMMAND:
        this.renderBashToolEnhanced();
        break;
      case chunkOBFBUWOR_cjs.MC_TOOLS.STRING_REPLACE_LSP:
        this.renderEditToolEnhanced();
        break;
      case chunkOBFBUWOR_cjs.MC_TOOLS.WRITE_FILE:
        this.renderWriteToolEnhanced();
        break;
      case chunkOBFBUWOR_cjs.MC_TOOLS.FIND_FILES:
        this.renderListFilesEnhanced();
        break;
      case chunkOBFBUWOR_cjs.MC_TOOLS.LSP_INSPECT:
        this.renderLspInspectEnhanced();
        break;
      case chunkOBFBUWOR_cjs.MC_TOOLS.GET_PROCESS_OUTPUT:
      case chunkOBFBUWOR_cjs.MC_TOOLS.KILL_PROCESS:
        this.renderProcessToolEnhanced();
        break;
      case "task_write":
        this.renderTaskWriteEnhanced();
        break;
      default:
        if (isWebSearchTool(this.toolName)) {
          this.renderWebSearchEnhanced();
        } else {
          this.renderGenericToolEnhanced();
        }
    }
  }
  renderViewToolEnhanced() {
    const argsObj = this.args;
    const fullPath = argsObj?.path ? String(argsObj.path) : "";
    const viewRange = argsObj?.view_range;
    const offset = argsObj?.offset;
    const limit = argsObj?.limit;
    const startLine = viewRange?.[0] ?? offset ?? 1;
    let rangeDisplay = "";
    if (viewRange) {
      rangeDisplay = chunkWOKNPWRC_cjs.theme.fg("muted", `:${viewRange[0]}-${viewRange[1]}`);
    } else if (offset || limit) {
      const from = offset ?? 1;
      const to = limit ? from + limit - 1 : void 0;
      rangeDisplay = chunkWOKNPWRC_cjs.theme.fg("muted", to ? `:${from}-${to}` : `:${from}`);
    }
    const border = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolBorderSuccess", char));
    if (!this.result || this.isPartial) {
      const path8 = argsObj?.path ? shortenPath(String(argsObj.path)) : "...";
      const status2 = this.getStatusIndicator();
      const pathDisplay2 = fullPath ? fileLink(chunkWOKNPWRC_cjs.theme.fg("toolArgs", path8), fullPath, startLine) : chunkWOKNPWRC_cjs.theme.fg("toolArgs", path8);
      const footerText2 = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "view"))} ${pathDisplay2}${rangeDisplay}${status2}`;
      this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
      this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText2}`, 0, 0));
      return;
    }
    const status = this.getStatusIndicator();
    const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
    const fixedParts = "\u2570\u2500\u2500 view  " + (rangeDisplay ? `:XXX,XXX` : "") + " \u2713";
    const availableForPath = termWidth - fixedParts.length - 6 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
    let path7 = argsObj?.path ? shortenPath(String(argsObj.path)) : "...";
    if (path7.length > availableForPath && availableForPath > 10) {
      path7 = "\u2026" + path7.slice(-(availableForPath - 1));
    }
    const pathDisplay = fullPath ? fileLink(chunkWOKNPWRC_cjs.theme.fg("toolArgs", path7), fullPath, startLine) : chunkWOKNPWRC_cjs.theme.fg("toolArgs", path7);
    const footerText = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "view"))} ${pathDisplay}${rangeDisplay}${status}`;
    this.contentBox.addChild(new piTui.Text("", 0, 0));
    this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
    const output = this.getFormattedOutput();
    if (output) {
      const termWidth2 = chunkWOKNPWRC_cjs.getTermWidth();
      const maxLineWidth = termWidth2 - 4 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
      const highlighted = highlightCode(output, fullPath, startLine);
      let lines = highlighted.split("\n");
      const collapsedLines = 20;
      const totalLines = lines.length;
      const hasMore = !this.expanded && totalLines > collapsedLines + 1;
      if (hasMore) {
        lines = lines.slice(0, collapsedLines);
      }
      const borderedLines = lines.map((line) => {
        const truncated = truncateAnsi(line, maxLineWidth);
        return border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolOutput", truncated);
      });
      this.contentBox.addChild(new piTui.Text(borderedLines.join("\n"), 0, 0));
      if (hasMore) {
        const remaining = totalLines - collapsedLines;
        this.contentBox.addChild(
          new piTui.Text(border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("muted", `... ${remaining} more lines (ctrl+e to expand)`), 0, 0)
        );
      }
    }
    this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, 0, 0));
  }
  renderBashToolEnhanced() {
    const argsObj = this.args;
    let command = argsObj?.command ? String(argsObj.command) : "...";
    const timeout = argsObj?.timeout;
    const cwd = argsObj?.cwd ? shortenPath(String(argsObj.cwd)) : "";
    const cdPattern = /^cd\s+[^\s]+\s+&&\s+/;
    command = command.replace(cdPattern, "");
    let maxStreamLines;
    const tailMatch = command.match(/\|\s*tail\s+(?:-n\s+)?(-?\d+)\s*$/);
    if (tailMatch) {
      maxStreamLines = Math.abs(parseInt(tailMatch[1], 10));
    }
    const timeoutSuffix = timeout ? chunkWOKNPWRC_cjs.theme.fg("muted", ` (timeout ${timeout}s)`) : "";
    const cwdSuffix = cwd ? chunkWOKNPWRC_cjs.theme.fg("muted", ` in ${cwd}`) : "";
    const timeSuffix = this.isPartial ? timeoutSuffix : this.getDurationSuffix();
    const renderBorderedShell = (status2, outputLines) => {
      const border = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolBorderSuccess", char));
      const footerText = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "$"))} ${chunkWOKNPWRC_cjs.theme.fg("toolArgs", command)}${cwdSuffix}${timeSuffix}${status2}`;
      this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
      const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
      const maxLineWidth = termWidth - 4 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
      const borderedLines = outputLines.map((line) => {
        const truncated = truncateAnsi(line, maxLineWidth);
        return border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolOutput", truncated);
      });
      const displayOutput = borderedLines.join("\n");
      if (displayOutput.trim()) {
        this.contentBox.addChild(new piTui.Text(displayOutput, 0, 0));
      }
      this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, 0, 0));
    };
    if (!this.result || this.isPartial) {
      const status2 = this.getStatusIndicator();
      let lines = this.streamingOutput ? this.streamingOutput.split("\n") : [];
      while (lines.length > 0 && lines[0] === "") {
        lines.shift();
      }
      while (lines.length > 0 && lines[lines.length - 1] === "") {
        lines.pop();
      }
      if (maxStreamLines && lines.length > maxStreamLines) {
        lines = lines.slice(-maxStreamLines);
      }
      renderBorderedShell(status2, lines);
      return;
    }
    const prepareOutputLines = (output2) => {
      let lines = output2.split("\n");
      while (lines.length > 0 && lines[0] === "") {
        lines.shift();
      }
      while (lines.length > 0 && lines[lines.length - 1] === "") {
        lines.pop();
      }
      if (maxStreamLines && lines.length > maxStreamLines) {
        lines = lines.slice(-maxStreamLines);
      }
      return lines;
    };
    if (this.result.isError) {
      const status2 = chunkWOKNPWRC_cjs.theme.fg("error", " \u2717");
      const output2 = this.streamingOutput.trim() || this.getFormattedOutput();
      renderBorderedShell(status2, prepareOutputLines(output2));
      return;
    }
    const outputText = this.getFormattedOutput();
    const looksLikeError = outputText.match(
      /Error:|TypeError:|SyntaxError:|ReferenceError:|command not found|fatal:|error:/i
    );
    if (looksLikeError) {
      const status2 = chunkWOKNPWRC_cjs.theme.fg("error", " \u2717");
      const output2 = this.streamingOutput.trim() || this.getFormattedOutput();
      renderBorderedShell(status2, prepareOutputLines(output2));
      return;
    }
    const status = chunkWOKNPWRC_cjs.theme.fg("success", " \u2713");
    const output = this.streamingOutput.trim() || this.getFormattedOutput();
    renderBorderedShell(status, prepareOutputLines(output));
  }
  renderProcessToolEnhanced() {
    const argsObj = this.args;
    const pid = argsObj?.pid ? Number(argsObj.pid) : 0;
    const isKill = this.toolName === chunkOBFBUWOR_cjs.MC_TOOLS.KILL_PROCESS;
    const isWait = !isKill && argsObj?.wait === true;
    const timeSuffix = this.isPartial ? "" : this.getDurationSuffix();
    const label = isKill ? "kill" : isWait ? "wait" : "output";
    const renderBorderedProcess = (status2, outputLines) => {
      const border = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolBorderSuccess", char));
      const footerText = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", label))} ${chunkWOKNPWRC_cjs.theme.fg("toolArgs", `PID ${pid}`)}${timeSuffix}${status2}`;
      this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
      const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
      const maxLineWidth = termWidth - 4 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
      const borderedLines = outputLines.map((line) => {
        const truncated = truncateAnsi(line, maxLineWidth);
        return border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolOutput", truncated);
      });
      const displayOutput = borderedLines.join("\n");
      if (displayOutput.trim()) {
        this.contentBox.addChild(new piTui.Text(displayOutput, 0, 0));
      }
      this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, 0, 0));
    };
    const prepareOutputLines = (output2) => {
      let lines = output2.split("\n");
      while (lines.length > 0 && lines[0] === "") lines.shift();
      while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
      return lines;
    };
    if (!this.result || this.isPartial) {
      const status2 = this.getStatusIndicator();
      let lines = this.streamingOutput ? this.streamingOutput.split("\n") : [];
      while (lines.length > 0 && lines[0] === "") lines.shift();
      while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
      renderBorderedProcess(status2, lines);
      return;
    }
    const status = this.result.isError ? chunkWOKNPWRC_cjs.theme.fg("error", " \u2717") : chunkWOKNPWRC_cjs.theme.fg("success", " \u2713");
    const output = this.streamingOutput.trim() || this.getFormattedOutput();
    renderBorderedProcess(status, prepareOutputLines(output));
  }
  renderEditToolEnhanced() {
    const argsObj = this.args;
    const fullPath = argsObj?.path ? String(argsObj.path) : "";
    const startLineNum = argsObj?.start_line ? Number(argsObj.start_line) : void 0;
    const startLine = startLineNum ? `:${String(startLineNum)}` : "";
    if (!this.result || this.isPartial) {
      const path8 = argsObj?.path ? shortenPath(String(argsObj.path)) : "...";
      const status2 = this.getStatusIndicator();
      const pathDisplay2 = fullPath ? fileLink(chunkWOKNPWRC_cjs.theme.fg("toolArgs", path8), fullPath, startLineNum) : chunkWOKNPWRC_cjs.theme.fg("toolArgs", path8);
      const oldStr = argsObj?.old_str ?? argsObj?.old_string;
      const newStr = argsObj?.new_str ?? argsObj?.new_string;
      if (oldStr != null && newStr != null) {
        const border2 = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolBorderSuccess", char));
        const termWidth2 = chunkWOKNPWRC_cjs.getTermWidth();
        const maxLineWidth = termWidth2 - 4 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
        const footerText2 = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "edit"))} ${pathDisplay2}${chunkWOKNPWRC_cjs.theme.fg("muted", startLine)}${status2}`;
        this.contentBox.addChild(new piTui.Text("", 0, 0));
        this.contentBox.addChild(new piTui.Text(border2("\u256D\u2500\u2500"), 0, 0));
        const { lines: diffLines } = this.generateDiffLines(String(oldStr), String(newStr));
        const collapsedLines = 15;
        const totalLines = diffLines.length;
        const hasMore = !this.expanded && totalLines > collapsedLines + 1;
        let linesToShow = diffLines;
        let skippedAbove = 0;
        if (hasMore) {
          skippedAbove = totalLines - collapsedLines;
          linesToShow = diffLines.slice(-collapsedLines);
        }
        if (skippedAbove > 0) {
          this.contentBox.addChild(
            new piTui.Text(border2("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("muted", `... ${skippedAbove} lines above (ctrl+e to expand)`), 0, 0)
          );
        }
        const borderedLines = linesToShow.map((line) => {
          const truncated = truncateAnsi(line, maxLineWidth);
          return border2("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolOutput", truncated);
        });
        this.contentBox.addChild(new piTui.Text(borderedLines.join("\n"), 0, 0));
        this.contentBox.addChild(new piTui.Text(`${border2("\u2570\u2500\u2500")} ${footerText2}`, 0, 0));
        return;
      }
      const editBorder = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolBorderSuccess", char));
      const headerText = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "edit"))} ${pathDisplay2}${chunkWOKNPWRC_cjs.theme.fg("muted", startLine)}${status2}`;
      this.contentBox.addChild(new piTui.Text(editBorder("\u256D\u2500\u2500"), 0, 0));
      this.contentBox.addChild(new piTui.Text(`${editBorder("\u2570\u2500\u2500")} ${headerText}`, 0, 0));
      return;
    }
    const border = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolBorderSuccess", char));
    const status = this.getStatusIndicator();
    const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
    const fixedParts = "\u2570\u2500\u2500 edit  " + startLine + " \u2713";
    const availableForPath = termWidth - fixedParts.length - 6 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
    let path7 = argsObj?.path ? shortenPath(String(argsObj.path)) : "...";
    if (path7.length > availableForPath && availableForPath > 10) {
      path7 = "\u2026" + path7.slice(-(availableForPath - 1));
    }
    const pathDisplay = fullPath ? fileLink(chunkWOKNPWRC_cjs.theme.fg("toolArgs", path7), fullPath, startLineNum) : chunkWOKNPWRC_cjs.theme.fg("toolArgs", path7);
    const footerText = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "edit"))} ${pathDisplay}${chunkWOKNPWRC_cjs.theme.fg("muted", startLine)}${status}`;
    this.contentBox.addChild(new piTui.Text("", 0, 0));
    this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
    const finalOldStr = argsObj?.old_str ?? argsObj?.old_string;
    const finalNewStr = argsObj?.new_str ?? argsObj?.new_string;
    if (finalOldStr != null && finalNewStr != null && !this.result.isError) {
      const { lines: diffLines, firstChangeIndex } = this.generateDiffLines(String(finalOldStr), String(finalNewStr));
      const collapsedLines = 15;
      const totalLines = diffLines.length;
      const hasMore = !this.expanded && totalLines > collapsedLines + 1;
      let linesToShow = diffLines;
      let skippedBefore = 0;
      if (hasMore) {
        const contextBefore = 3;
        const start = Math.max(0, firstChangeIndex - contextBefore);
        linesToShow = diffLines.slice(start, start + collapsedLines);
        skippedBefore = start;
      }
      const maxLineWidth = termWidth - 4 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
      if (skippedBefore > 0) {
        this.contentBox.addChild(
          new piTui.Text(border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("muted", `... ${skippedBefore} lines above`), 0, 0)
        );
      }
      const borderedLines = linesToShow.map((line) => {
        const truncated = truncateAnsi(line, maxLineWidth);
        return border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolOutput", truncated);
      });
      this.contentBox.addChild(new piTui.Text(borderedLines.join("\n"), 0, 0));
      if (hasMore) {
        const remaining = totalLines - (skippedBefore + linesToShow.length);
        if (remaining > 0) {
          this.contentBox.addChild(
            new piTui.Text(border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("muted", `... ${remaining} more lines (ctrl+e to expand)`), 0, 0)
          );
        }
      }
    } else if (this.result.isError) {
      const output = this.getFormattedOutput();
      if (output) {
        const maxLineWidth = termWidth - 4 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
        const lines = output.split("\n").map((line) => {
          const truncated = truncateAnsi(line, maxLineWidth);
          return border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("error", truncated);
        });
        this.contentBox.addChild(new piTui.Text(lines.join("\n"), 0, 0));
      }
    }
    this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, 0, 0));
    const diagnostics = this.parseLSPDiagnostics();
    if (diagnostics && !diagnostics.hasIssues) {
      this.contentBox.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", `  \u2713 No LSP issues`), 0, 0));
    } else if (diagnostics && diagnostics.hasIssues) {
      const COLLAPSED_DIAG_LINES = 3;
      const shouldCollapse = !this.expanded && diagnostics.entries.length > COLLAPSED_DIAG_LINES + 1;
      const maxDiags = shouldCollapse ? COLLAPSED_DIAG_LINES : diagnostics.entries.length;
      const entriesToShow = diagnostics.entries.slice(0, maxDiags);
      for (const diag of entriesToShow) {
        const t = chunkWOKNPWRC_cjs.theme.getTheme();
        const color = diag.severity === "error" ? t.error : diag.severity === "warning" ? t.warning : t.muted;
        const icon = diag.severity === "error" ? "\u2717" : diag.severity === "warning" ? "\u26A0" : "\u2139";
        const location = diag.location ? chalk8__default.default.hex(color)(diag.location) + " " : "";
        const line = `  ${chalk8__default.default.hex(color)(icon)} ${location}${chunkWOKNPWRC_cjs.theme.fg("thinkingText", diag.message)}`;
        this.contentBox.addChild(new piTui.Text(line, 0, 0));
      }
      if (shouldCollapse) {
        const remaining = diagnostics.entries.length - COLLAPSED_DIAG_LINES;
        this.contentBox.addChild(
          new piTui.Text(
            chunkWOKNPWRC_cjs.theme.fg("muted", `  ... ${remaining} more diagnostic${remaining > 1 ? "s" : ""} (ctrl+e to expand)`),
            0,
            0
          )
        );
      }
    }
  }
  parseLSPDiagnostics() {
    const output = this.getFormattedOutput();
    const lspIdx = output.indexOf("LSP Diagnostics:");
    if (lspIdx === -1) return null;
    const lspText = output.slice(lspIdx + "LSP Diagnostics:".length);
    if (lspText.includes("No errors or warnings")) {
      return { hasIssues: false, entries: [] };
    }
    const entries = [];
    let currentSeverity = "error";
    for (const line of lspText.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed === "Errors:") {
        currentSeverity = "error";
      } else if (trimmed === "Warnings:") {
        currentSeverity = "warning";
      } else if (trimmed === "Info:") {
        currentSeverity = "info";
      } else if (trimmed === "Hints:") {
        currentSeverity = "hint";
      } else {
        const match = trimmed.match(/^((?:.*:)?\d+:\d+)\s*-\s*(.+)$/);
        if (match) {
          entries.push({
            severity: currentSeverity,
            location: match[1],
            message: match[2]
          });
        }
      }
    }
    return { hasIssues: entries.length > 0, entries };
  }
  generateDiffLines(oldStr, newStr) {
    const oldLines = oldStr.split("\n");
    const newLines = newStr.split("\n");
    const lines = [];
    let firstChangeIndex = -1;
    const removedColor = chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.red);
    const addedColor = chalk8__default.default.hex(chunkWOKNPWRC_cjs.theme.getTheme().success);
    const maxLines = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
      if (i >= oldLines.length) {
        if (firstChangeIndex === -1) firstChangeIndex = lines.length;
        lines.push(addedColor(newLines[i]));
      } else if (i >= newLines.length) {
        if (firstChangeIndex === -1) firstChangeIndex = lines.length;
        lines.push(removedColor(oldLines[i]));
      } else if (oldLines[i] !== newLines[i]) {
        if (firstChangeIndex === -1) firstChangeIndex = lines.length;
        lines.push(removedColor(oldLines[i]));
        lines.push(addedColor(newLines[i]));
      } else {
        lines.push(chunkWOKNPWRC_cjs.theme.fg("muted", oldLines[i]));
      }
    }
    return {
      lines,
      firstChangeIndex: firstChangeIndex === -1 ? 0 : firstChangeIndex
    };
  }
  renderWriteToolEnhanced() {
    const argsObj = this.args;
    const fullPath = argsObj?.path ? String(argsObj.path) : "";
    const content = argsObj?.content ? String(argsObj.content) : "";
    if (!this.result || this.isPartial) {
      if (!content) {
        const writeBorder = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolBorderSuccess", char));
        const path9 = argsObj?.path ? shortenPath(String(argsObj.path)) : "...";
        const status3 = this.getStatusIndicator();
        const pathDisplay3 = fullPath ? fileLink(chunkWOKNPWRC_cjs.theme.fg("toolArgs", path9), fullPath) : chunkWOKNPWRC_cjs.theme.fg("toolArgs", path9);
        const footerText3 = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "write"))} ${pathDisplay3}${status3}`;
        this.contentBox.addChild(new piTui.Text(writeBorder("\u256D\u2500\u2500"), 0, 0));
        this.contentBox.addChild(new piTui.Text(`${writeBorder("\u2570\u2500\u2500")} ${footerText3}`, 0, 0));
        return;
      }
      const border2 = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolBorderSuccess", char));
      const status2 = this.getStatusIndicator();
      const termWidth2 = chunkWOKNPWRC_cjs.getTermWidth();
      const maxLineWidth2 = termWidth2 - 4 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
      let path8 = argsObj?.path ? shortenPath(String(argsObj.path)) : "...";
      const fixedParts2 = "\u2570\u2500\u2500 write   \u22EF";
      const availableForPath2 = termWidth2 - fixedParts2.length - 6 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
      if (path8.length > availableForPath2 && availableForPath2 > 10) {
        path8 = "\u2026" + path8.slice(-(availableForPath2 - 1));
      }
      const pathDisplay2 = fullPath ? fileLink(chunkWOKNPWRC_cjs.theme.fg("toolArgs", path8), fullPath) : chunkWOKNPWRC_cjs.theme.fg("toolArgs", path8);
      const footerText2 = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "write"))} ${pathDisplay2}${status2}`;
      this.contentBox.addChild(new piTui.Text("", 0, 0));
      this.contentBox.addChild(new piTui.Text(border2("\u256D\u2500\u2500"), 0, 0));
      const highlighted = highlightCode(content, fullPath);
      let lines = highlighted.split("\n");
      const collapsedLines = 20;
      const totalLines = lines.length;
      const hasMore = !this.expanded && totalLines > collapsedLines + 1;
      let skippedAbove = 0;
      if (hasMore) {
        skippedAbove = totalLines - collapsedLines;
        lines = lines.slice(-collapsedLines);
      }
      if (skippedAbove > 0) {
        this.contentBox.addChild(
          new piTui.Text(border2("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("muted", `... ${skippedAbove} lines above (ctrl+e to expand)`), 0, 0)
        );
      }
      const borderedLines = lines.map((line) => {
        const truncated = truncateAnsi(line, maxLineWidth2);
        return border2("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolOutput", truncated);
      });
      this.contentBox.addChild(new piTui.Text(borderedLines.join("\n"), 0, 0));
      this.contentBox.addChild(new piTui.Text(`${border2("\u2570\u2500\u2500")} ${footerText2}`, 0, 0));
      return;
    }
    const border = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolBorderSuccess", char));
    const status = this.getStatusIndicator();
    const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
    const maxLineWidth = termWidth - 4 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
    let path7 = argsObj?.path ? shortenPath(String(argsObj.path)) : "...";
    const fixedParts = "\u2570\u2500\u2500 write   \u2713";
    const availableForPath = termWidth - fixedParts.length - 6 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
    if (path7.length > availableForPath && availableForPath > 10) {
      path7 = "\u2026" + path7.slice(-(availableForPath - 1));
    }
    const pathDisplay = fullPath ? fileLink(chunkWOKNPWRC_cjs.theme.fg("toolArgs", path7), fullPath) : chunkWOKNPWRC_cjs.theme.fg("toolArgs", path7);
    const footerText = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "write"))} ${pathDisplay}${status}`;
    this.contentBox.addChild(new piTui.Text("", 0, 0));
    this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
    if (this.result.isError) {
      const output = this.getFormattedOutput();
      if (output) {
        const lines = output.split("\n").map((line) => {
          const truncated = truncateAnsi(line, maxLineWidth);
          return border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("error", truncated);
        });
        this.contentBox.addChild(new piTui.Text(lines.join("\n"), 0, 0));
      }
    } else if (content) {
      const highlighted = highlightCode(content, fullPath);
      let lines = highlighted.split("\n");
      const collapsedLines = 20;
      const totalLines = lines.length;
      const hasMore = !this.expanded && totalLines > collapsedLines + 1;
      let skippedAbove = 0;
      if (hasMore) {
        skippedAbove = totalLines - collapsedLines;
        lines = lines.slice(-collapsedLines);
      }
      if (skippedAbove > 0) {
        this.contentBox.addChild(
          new piTui.Text(border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("muted", `... ${skippedAbove} lines above (ctrl+e to expand)`), 0, 0)
        );
      }
      const borderedLines = lines.map((line) => {
        const truncated = truncateAnsi(line, maxLineWidth);
        return border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolOutput", truncated);
      });
      this.contentBox.addChild(new piTui.Text(borderedLines.join("\n"), 0, 0));
    }
    this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, 0, 0));
  }
  renderListFilesEnhanced() {
    const argsObj = this.args;
    const fullPath = argsObj?.path ? String(argsObj.path) : "";
    const path7 = argsObj?.path ? shortenPath(String(argsObj.path)) : "/";
    const pattern = argsObj?.pattern ? String(argsObj.pattern) : "";
    const patternDisplay = pattern ? " " + chunkWOKNPWRC_cjs.theme.fg("muted", pattern) : "";
    const border = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolBorderSuccess", char));
    const status = this.getStatusIndicator();
    const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
    const maxLineWidth = termWidth - 4 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
    if (!this.result || this.isPartial) {
      const pathDisplay = fullPath ? fileLink(chunkWOKNPWRC_cjs.theme.fg("toolArgs", path7), fullPath) : chunkWOKNPWRC_cjs.theme.fg("toolArgs", path7);
      const footerText = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "list"))} ${pathDisplay}${patternDisplay}${status}`;
      this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
      this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, 0, 0));
      return;
    }
    const output = this.getFormattedOutput();
    if (output) {
      let lines = output.split("\n");
      const lastLine = lines[lines.length - 1]?.trim() || "";
      const summaryMatch = lastLine.match(/^\d+\s+directories?,\s+\d+\s+files?$/);
      const summaryDisplay = summaryMatch ? " " + chunkWOKNPWRC_cjs.theme.fg("muted", lastLine) : "";
      if (summaryMatch) {
        lines = lines.slice(0, -1);
      }
      const collapsedLines = 15;
      const totalLines = lines.length;
      const hasMore = !this.expanded && totalLines > collapsedLines + 1;
      let skippedAbove = 0;
      if (hasMore) {
        skippedAbove = totalLines - collapsedLines;
        lines = lines.slice(-collapsedLines);
      }
      const pathDisplay = fullPath ? fileLink(chunkWOKNPWRC_cjs.theme.fg("toolArgs", path7), fullPath) : chunkWOKNPWRC_cjs.theme.fg("toolArgs", path7);
      const footerText = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "list"))} ${pathDisplay}${patternDisplay}${summaryDisplay}${status}`;
      this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
      if (skippedAbove > 0) {
        this.contentBox.addChild(
          new piTui.Text(border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("muted", `... ${skippedAbove} lines above (ctrl+e to expand)`), 0, 0)
        );
      }
      const borderedLines = lines.map((line) => {
        const truncated = truncateAnsi(line, maxLineWidth);
        return border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolOutput", truncated);
      });
      this.contentBox.addChild(new piTui.Text(borderedLines.join("\n"), 0, 0));
      this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, 0, 0));
    }
  }
  renderLspInspectEnhanced() {
    const border = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolBorderSuccess", char));
    const status = this.getStatusIndicator();
    const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
    const maxLineWidth = termWidth - 4 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
    const argsObj = this.args;
    const path_ = argsObj?.path;
    const line = argsObj?.line;
    const match = argsObj?.match;
    const argsSummary = [
      path_ ? shortenPath(path_.replace(process.cwd() + "/", "")) : null,
      line ? `L${line}` : null,
      match ? truncateAnsi(match.replace(/<<</g, "\u2039\u2039\u2039"), 40) : null
    ].filter(Boolean).join(" ");
    if (!this.result || this.isPartial) {
      const footerText2 = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "lsp_inspect"))}${argsSummary ? " " + chunkWOKNPWRC_cjs.theme.fg("toolArgs", argsSummary) : ""}${status}`;
      this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
      this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText2}`, 0, 0));
      return;
    }
    const rawText = this.result.content.filter((c) => c.type === "text" && c.text).map((c) => c.text).join("\n");
    if (this.result.isError || !rawText.trim()) {
      const footerText2 = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "lsp_inspect"))}${argsSummary ? " " + chunkWOKNPWRC_cjs.theme.fg("toolArgs", argsSummary) : ""}${status}`;
      const output = this.getFormattedOutput();
      this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
      if (output) {
        this.contentBox.addChild(new piTui.Text(border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("error", output), 0, 0));
      }
      this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText2}`, 0, 0));
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      this.renderGenericToolEnhanced();
      return;
    }
    if (parsed.error) {
      const footerText2 = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "lsp_inspect"))}${argsSummary ? " " + chunkWOKNPWRC_cjs.theme.fg("toolArgs", argsSummary) : ""}${status}`;
      this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
      this.contentBox.addChild(new piTui.Text(border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("error", parsed.error), 0, 0));
      this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText2}`, 0, 0));
      return;
    }
    const footerText = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "lsp_inspect"))}${argsSummary ? " " + chunkWOKNPWRC_cjs.theme.fg("toolArgs", argsSummary) : ""}${status}`;
    this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
    if (parsed.hover) {
      const hoverValue = parsed.hover.value || "";
      const hoverLines = hoverValue.split("\n").filter((line2) => line2.trim() !== "");
      if (hoverLines.length > 0) {
        this.contentBox.addChild(new piTui.Text(border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolArgs", "hover:"), 0, 0));
      }
      for (const line2 of hoverLines) {
        const truncated = truncateAnsi(line2, maxLineWidth - 2);
        const prefix = border("\u2502") + " ";
        this.contentBox.addChild(new piTui.Text(prefix + chunkWOKNPWRC_cjs.theme.fg("text", truncated), 0, 0));
      }
    }
    if (parsed.diagnostics && parsed.diagnostics.length > 0) {
      this.contentBox.addChild(new piTui.Text(border("\u2502"), 0, 0));
      this.contentBox.addChild(new piTui.Text(border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolArgs", "diagnostics:"), 0, 0));
      for (const diagnostic of parsed.diagnostics) {
        const label = diagnostic.source ? `${diagnostic.severity} (${diagnostic.source})` : diagnostic.severity;
        const diagLine = `${label}: ${diagnostic.message}`;
        this.contentBox.addChild(
          new piTui.Text(
            border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg(diagnostic.severity === "error" ? "error" : "text", truncateAnsi(diagLine, maxLineWidth - 2)),
            0,
            0
          )
        );
      }
    }
    if (parsed.definition && parsed.definition.length > 0) {
      this.contentBox.addChild(new piTui.Text(border("\u2502"), 0, 0));
      this.contentBox.addChild(new piTui.Text(border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolArgs", "definition:"), 0, 0));
      for (const def of parsed.definition) {
        const location = def.location || "";
        const preview = def.preview || "";
        const parsedLoc = this.parseLspLocation(location);
        const displayLoc = parsedLoc ? fileLink(
          chunkWOKNPWRC_cjs.theme.fg("toolOutput", parsedLoc.shortPath + ":" + parsedLoc.lineCol),
          parsedLoc.absPath,
          parsedLoc.line
        ) : chunkWOKNPWRC_cjs.theme.fg("toolOutput", location);
        const defLine = border("\u2502") + " " + displayLoc;
        this.contentBox.addChild(new piTui.Text(truncateAnsi(defLine, maxLineWidth), 0, 0));
        if (preview) {
          const previewLine = border("\u2502") + "   " + chunkWOKNPWRC_cjs.theme.fg("text", truncateAnsi(preview, maxLineWidth - 3));
          this.contentBox.addChild(new piTui.Text(previewLine, 0, 0));
        }
      }
    }
    if (parsed.implementation && parsed.implementation.length > 0) {
      const implCount = parsed.implementation.length;
      const implLabel = implCount === 1 ? "implementation:" : `implementations (${implCount}):`;
      this.contentBox.addChild(new piTui.Text(border("\u2502"), 0, 0));
      const maxShow = this.expanded ? parsed.implementation.length : 5;
      const shown = parsed.implementation.slice(0, maxShow);
      const remaining = parsed.implementation.length - maxShow;
      this.contentBox.addChild(new piTui.Text(border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolArgs", implLabel), 0, 0));
      for (const loc of shown) {
        const parsedLoc = this.parseLspLocation(loc);
        const displayLoc = parsedLoc ? fileLink(
          chunkWOKNPWRC_cjs.theme.fg("toolOutput", parsedLoc.shortPath + ":" + parsedLoc.lineCol),
          parsedLoc.absPath,
          parsedLoc.line
        ) : chunkWOKNPWRC_cjs.theme.fg("toolOutput", loc);
        const implLine = border("\u2502") + " " + displayLoc;
        this.contentBox.addChild(new piTui.Text(truncateAnsi(implLine, maxLineWidth), 0, 0));
      }
      if (remaining > 0 && !this.expanded) {
        const moreLine = border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolOutput", `... ${remaining} more (ctrl+e to expand)`);
        this.contentBox.addChild(new piTui.Text(moreLine, 0, 0));
      }
    }
    if (!parsed.hover && !parsed.diagnostics?.length && !parsed.definition?.length && !parsed.implementation?.length) {
      this.contentBox.addChild(
        new piTui.Text(
          border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("muted", "No hover, diagnostics, definition, or implementation results"),
          0,
          0
        )
      );
    }
    this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, 0, 0));
  }
  /**
   * Parse an LSP location string like "$cwd/path:Lline:Cchar" into components.
   */
  parseLspLocation(location) {
    const match = location.match(/^(.+?):L(\d+):C(\d+)$/);
    if (!match) return null;
    const rawPath = match[1];
    const line = parseInt(match[2], 10);
    const lineCol = `L${match[2]}:C${match[3]}`;
    let absPath;
    let shortPath;
    if (rawPath.startsWith("$cwd/")) {
      absPath = process.cwd() + "/" + rawPath.slice(5);
      shortPath = rawPath.slice(5);
    } else if (rawPath.startsWith("~")) {
      absPath = os__namespace.homedir() + rawPath.slice(1);
      shortPath = shortenPath(absPath);
    } else if (rawPath.startsWith("/")) {
      absPath = rawPath;
      shortPath = absPath.startsWith(process.cwd() + "/") ? absPath.slice(process.cwd().length + 1) : shortenPath(absPath);
    } else {
      absPath = process.cwd() + "/" + rawPath;
      shortPath = rawPath;
    }
    return { absPath, shortPath, line, lineCol };
  }
  renderTaskWriteEnhanced() {
    const argsObj = this.args;
    const tasks = argsObj?.tasks;
    const status = this.getStatusIndicator();
    const border = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolBorderSuccess", char));
    const count = tasks?.length ?? 0;
    const countSuffix = count > 0 ? chunkWOKNPWRC_cjs.theme.fg("muted", ` (${count} tasks)`) : "";
    const footerText = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "task_write"))}${countSuffix}${status}`;
    this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
    if (!this.isPartial && this.result?.isError) {
      const output = this.getFormattedOutput();
      if (output) {
        this.contentBox.addChild(new piTui.Text(border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("error", output), 0, 0));
      }
    }
    this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, 0, 0));
  }
  renderWebSearchEnhanced() {
    const argsObj = this.args;
    const action = argsObj?.action;
    let query = argsObj?.query ? String(argsObj.query) : action?.query ? String(action.query) : "";
    if (!query && this.result) {
      try {
        const raw = this.getFormattedOutput();
        const parsed = JSON.parse(raw);
        if (parsed?.action?.query) query = String(parsed.action.query);
      } catch {
      }
    }
    const status = this.getStatusIndicator();
    const queryDisplay = query ? ` ${chunkWOKNPWRC_cjs.theme.fg("toolArgs", `"${query}"`)}` : "";
    const footerText = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "web_search"))}${queryDisplay}${status}`;
    const border = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolBorderSuccess", char));
    if (!this.result || this.isPartial) {
      this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
      this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, 0, 0));
      return;
    }
    if (this.result.isError) {
      this.renderErrorResult(footerText);
      return;
    }
    const output = this.formatWebSearchResults();
    if (output) {
      const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
      const maxLineWidth = termWidth - 4 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
      this.contentBox.addChild(new piTui.Text("", 0, 0));
      this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
      let lines = output.split("\n");
      const collapsedLines = 10;
      const totalLines = lines.length;
      const hasMore = !this.expanded && totalLines > collapsedLines + 1;
      if (hasMore) {
        lines = lines.slice(0, collapsedLines);
      }
      const borderedLines = lines.map((line) => {
        const truncated = truncateAnsi(line, maxLineWidth);
        return border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolOutput", truncated);
      });
      this.contentBox.addChild(new piTui.Text(borderedLines.join("\n"), 0, 0));
      if (hasMore) {
        const remaining = totalLines - collapsedLines;
        this.contentBox.addChild(
          new piTui.Text(border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("muted", `... ${remaining} more lines (ctrl+e to expand)`), 0, 0)
        );
      }
      this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, 0, 0));
    } else {
      this.contentBox.addChild(new piTui.Text(footerText, 0, 0));
    }
  }
  /**
   * Format web search results as a clean list of titles + URLs.
   * Handles both Anthropic provider results (JSON array with encryptedContent)
   * and Tavily results (markdown-formatted text).
   */
  formatWebSearchResults() {
    const raw = this.getFormattedOutput();
    if (!raw) return "";
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const lines = [];
        for (const item of parsed) {
          if (typeof item !== "object" || item === null) continue;
          const url = typeof item.url === "string" ? item.url : "";
          if (!url) continue;
          const title = typeof item.title === "string" && item.title ? item.title : "";
          const age = typeof item.pageAge === "string" && item.pageAge ? chunkWOKNPWRC_cjs.theme.fg("muted", ` (${item.pageAge})`) : "";
          if (title) {
            lines.push(`  ${chunkWOKNPWRC_cjs.theme.fg("toolOutput", title)}${age}`);
            lines.push(`  ${chunkWOKNPWRC_cjs.theme.fg("muted", url)}`);
          } else {
            lines.push(`  ${chunkWOKNPWRC_cjs.theme.fg("toolOutput", url)}${age}`);
          }
        }
        if (lines.length > 0) return lines.join("\n");
        const stripped = parsed.map((item) => {
          if (typeof item !== "object" || item === null) return item;
          const { encryptedContent, ...rest } = item;
          return rest;
        });
        return JSON.stringify(stripped, null, 2);
      }
      if (typeof parsed === "object" && parsed !== null && Array.isArray(parsed.sources)) {
        const lines = [];
        for (const source of parsed.sources) {
          if (typeof source !== "object" || source === null) continue;
          const url = typeof source.url === "string" ? source.url : "";
          if (!url) continue;
          const title = typeof source.title === "string" && source.title ? source.title : "";
          if (title) {
            lines.push(`  ${chunkWOKNPWRC_cjs.theme.fg("toolOutput", title)}`);
            lines.push(`  ${chunkWOKNPWRC_cjs.theme.fg("muted", url)}`);
          } else {
            lines.push(`  ${chunkWOKNPWRC_cjs.theme.fg("toolOutput", url)}`);
          }
        }
        if (lines.length > 0) return lines.join("\n");
      }
    } catch {
    }
    return raw;
  }
  renderGenericToolEnhanced() {
    const border = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolBorderSuccess", char));
    const status = this.getStatusIndicator();
    const argsSummary = this.formatArgsSummary();
    const footerText = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", this.toolName))}${argsSummary}${status}`;
    if (!this.result || this.isPartial) {
      const preview = this.formatArgsPreview();
      this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
      if (preview.length > 0) {
        const previewLines = preview.map((line) => border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolOutput", line));
        this.contentBox.addChild(new piTui.Text(previewLines.join("\n"), 0, 0));
      }
      this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, 0, 0));
      return;
    }
    if (this.result.isError) {
      this.renderErrorResult(footerText);
      return;
    }
    const output = this.getFormattedOutput();
    if (output) {
      const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
      const maxLineWidth = termWidth - 4 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
      this.contentBox.addChild(new piTui.Text("", 0, 0));
      this.contentBox.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
      let lines = output.split("\n");
      const collapsedLines = 10;
      const totalLines = lines.length;
      const hasMore = !this.expanded && totalLines > collapsedLines + 1;
      if (hasMore) {
        lines = lines.slice(0, collapsedLines);
      }
      const borderedLines = lines.map((line) => {
        const truncated = truncateAnsi(line, maxLineWidth);
        return border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("toolOutput", truncated);
      });
      this.contentBox.addChild(new piTui.Text(borderedLines.join("\n"), 0, 0));
      if (hasMore) {
        const remaining = totalLines - collapsedLines;
        this.contentBox.addChild(
          new piTui.Text(border("\u2502") + " " + chunkWOKNPWRC_cjs.theme.fg("muted", `... ${remaining} more lines (ctrl+e to expand)`), 0, 0)
        );
      }
      this.contentBox.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, 0, 0));
    } else {
      this.contentBox.addChild(new piTui.Text(footerText, 0, 0));
    }
  }
  /**
   * Format a compact args preview as key="value" pairs.
   * Long values are truncated, multiline values show first line + count.
   * Returns an array of formatted lines.
   */
  formatArgsPreview(maxLines = 4, maxValueLen = 60) {
    if (!this.args || typeof this.args !== "object") return [];
    const argsObj = this.args;
    const keys = Object.keys(argsObj);
    if (keys.length === 0) return [];
    const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
    const maxLineWidth = termWidth - 4 - chunkWOKNPWRC_cjs.BOX_INDENT * 2 - 2;
    const lines = [];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (lines.length >= maxLines) {
        const remaining = keys.length - i;
        lines.push(chunkWOKNPWRC_cjs.theme.fg("muted", `  ... ${remaining} more`));
        break;
      }
      const raw = argsObj[key];
      let val;
      if (typeof raw === "string") {
        const strLines = raw.split("\n");
        if (strLines.length > 1) {
          val = strLines[0].slice(0, maxValueLen) + chunkWOKNPWRC_cjs.theme.fg("muted", ` (${strLines.length} lines)`);
        } else {
          val = raw.length > maxValueLen ? raw.slice(0, maxValueLen) + "\u2026" : raw;
        }
        val = `"${val}"`;
      } else if (raw === void 0) {
        continue;
      } else if (Array.isArray(raw)) {
        val = `[${raw.length} items]`;
      } else if (typeof raw === "object" && raw !== null) {
        const objKeys = Object.keys(raw);
        val = `{${objKeys.slice(0, 3).join(", ")}${objKeys.length > 3 ? ", \u2026" : ""}}`;
      } else {
        val = String(raw);
      }
      const line = truncateAnsi(`  ${chunkWOKNPWRC_cjs.theme.fg("muted", key + "=")}${val}`, maxLineWidth);
      lines.push(line);
    }
    return lines;
  }
  /**
   * Compact inline args summary for the footer line.
   * Shows key=value pairs truncated to fit on one line.
   */
  formatArgsSummary() {
    if (!this.args || typeof this.args !== "object") return "";
    const argsObj = this.args;
    const entries = Object.entries(argsObj).filter(([, v]) => v !== void 0);
    if (entries.length === 0) return "";
    const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
    const maxLen = Math.max(20, termWidth - this.toolName.length - 15 - chunkWOKNPWRC_cjs.BOX_INDENT * 2);
    const parts = [];
    let currentLen = 0;
    for (const [key, raw] of entries) {
      let val;
      if (typeof raw === "string") {
        const firstLine = raw.split("\n")[0];
        val = firstLine.length > 40 ? firstLine.slice(0, 40) + "\u2026" : firstLine;
        val = `"${val}"`;
      } else if (Array.isArray(raw)) {
        val = `[${raw.length}]`;
      } else if (typeof raw === "object" && raw !== null) {
        val = "{\u2026}";
      } else {
        val = String(raw);
      }
      const part = `${key}=${val}`;
      if (currentLen + part.length + 2 > maxLen && parts.length > 0) {
        parts.push("\u2026");
        break;
      }
      parts.push(part);
      currentLen += part.length + 2;
    }
    return " " + chunkWOKNPWRC_cjs.theme.fg("toolArgs", parts.join(", "));
  }
  getStatusIndicator() {
    return this.isPartial ? chunkWOKNPWRC_cjs.theme.fg("muted", " \u22EF") : this.result?.isError ? chunkWOKNPWRC_cjs.theme.fg("error", " \u2717") : chunkWOKNPWRC_cjs.theme.fg("success", " \u2713");
  }
  getDurationSuffix() {
    if (this.isPartial) return "";
    const ms = Date.now() - this.startTime;
    if (ms < 1e3) return chunkWOKNPWRC_cjs.theme.fg("muted", ` ${ms}ms`);
    return chunkWOKNPWRC_cjs.theme.fg("muted", ` ${(ms / 1e3).toFixed(1)}s`);
  }
  getFormattedOutput() {
    if (!this.result) return "";
    const textContent = this.result.content.filter((c) => c.type === "text" && c.text).map((c) => c.text).join("\n");
    if (!textContent) return "";
    const { content } = extractContent(textContent);
    return content.trim().replace(/\n\s*\n\s*\n/g, "\n\n");
  }
  /**
   * Render an error result using the enhanced error display component
   */
  renderErrorResult(header) {
    if (!this.result) return;
    this.contentBox.addChild(new piTui.Text(header, 0, 0));
    const errorText = this.result.content.filter((c) => c.type === "text" && c.text).map((c) => c.text).join("\n");
    if (!errorText) return;
    const isValidationError = errorText.toLowerCase().includes("validation") || errorText.toLowerCase().includes("required parameter") || errorText.toLowerCase().includes("missing required") || errorText.match(/at "\w+"/i) || // Zod-style errors
    errorText.includes("Expected") && errorText.includes("Received");
    if (isValidationError) {
      const validationErrors = parseValidationErrors(errorText);
      const validationDisplay = new ToolValidationErrorComponent(
        {
          toolName: this.toolName,
          errors: validationErrors,
          args: this.args
        },
        this.ui
      );
      this.contentBox.addChild(validationDisplay);
      return;
    }
    let error = errorText;
    try {
      const { content } = extractContent(errorText);
      error = content;
      const errorMatch = content.match(/^([A-Z][a-zA-Z]*Error):\s*(.+)$/m);
      if (errorMatch) {
        const err = new Error(errorMatch[2]);
        err.name = errorMatch[1];
        const stackMatch = content.match(/\n\s+at\s+.+/g);
        if (stackMatch) {
          err.stack = `${err.name}: ${err.message}
${stackMatch.join("\n")}`;
        }
        error = err;
      }
    } catch {
    }
    const errorDisplay = new ErrorDisplayComponent(
      error,
      {
        showStack: true,
        showContext: true,
        expanded: this.expanded
      },
      this.ui
    );
    this.contentBox.addChild(errorDisplay);
  }
};
function getLanguageFromPath(path7) {
  const ext = path7.split(".").pop()?.toLowerCase();
  const langMap = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    json: "json",
    md: "markdown",
    py: "python",
    rb: "ruby",
    rs: "rust",
    go: "go",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    php: "php",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    fish: "bash",
    yml: "yaml",
    yaml: "yaml",
    toml: "ini",
    ini: "ini",
    xml: "xml",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "scss",
    less: "less",
    sql: "sql",
    graphql: "graphql",
    gql: "graphql",
    dockerfile: "dockerfile",
    makefile: "makefile",
    cmake: "cmake",
    vue: "vue",
    svelte: "xml"
  };
  return ext ? langMap[ext] : void 0;
}
function highlightCode(content, path7, startLine) {
  let lines = content.split("\n").map((line) => line.trimEnd());
  while (lines.length > 0 && (lines[0].includes("Here's the result of running") || lines[0].match(/^\[Truncated \d+ tokens\]$/) || lines[0].match(/^.*\(\d+ bytes\)$/) || lines[0].match(/^.*\(lines \d+-\d+ of \d+, \d+ bytes\)$/))) {
    lines = lines.slice(1);
  }
  let expectedLineNum = startLine ?? 1;
  const codeLines = lines.map((line) => {
    const numStr = String(expectedLineNum);
    const match = line.match(/^(\s*)(\d+)[\t→]?(.*)$/);
    if (match && match[2] === numStr) {
      expectedLineNum++;
      return match[3];
    }
    return line;
  });
  while (codeLines.length > 0 && codeLines[codeLines.length - 1] === "") {
    codeLines.pop();
  }
  try {
    return cliHighlight.highlight(codeLines.join("\n"), {
      language: getLanguageFromPath(path7),
      ignoreIllegals: true
    });
  } catch {
    return codeLines.join("\n");
  }
}
function truncateAnsi(str, maxWidth) {
  const ansiRegex = /\x1b\[[0-9;]*m|\x1b\]8;[^\x07]*\x07/g;
  let visibleLength = 0;
  let result = "";
  let lastIndex = 0;
  let match;
  while ((match = ansiRegex.exec(str)) !== null) {
    const textBefore = str.slice(lastIndex, match.index);
    const remaining2 = maxWidth - visibleLength;
    if (textBefore.length <= remaining2) {
      result += textBefore;
      visibleLength += textBefore.length;
    } else {
      result += textBefore.slice(0, remaining2 - 1) + "\u2026";
      result += "\x1B]8;;\x07\x1B[0m";
      return result;
    }
    result += match[0];
    lastIndex = match.index + match[0].length;
  }
  const remaining = str.slice(lastIndex);
  const spaceLeft = maxWidth - visibleLength;
  if (remaining.length <= spaceLeft) {
    result += remaining;
  } else {
    result += remaining.slice(0, spaceLeft - 1) + "\u2026";
    result += "\x1B]8;;\x07\x1B[0m";
  }
  return result;
}

// src/tui/handlers/message.ts
function getTrailingContentParts(message) {
  let lastToolIndex = -1;
  for (let i = message.content.length - 1; i >= 0; i--) {
    const c = message.content[i];
    if (isInlineBoundary(c)) {
      lastToolIndex = i;
      break;
    }
  }
  if (lastToolIndex === -1) {
    return message.content;
  }
  return message.content.slice(lastToolIndex + 1);
}
function isInlineBoundary(part) {
  return part.type === "tool_call" || part.type === "tool_result" || part.type === "system_reminder";
}
function isSystemReminderPart(part) {
  return part.type === "system_reminder";
}
function toStreamedSystemReminderPart(part) {
  if (!isSystemReminderPart(part)) return void 0;
  const reminder = part;
  return {
    type: "system_reminder",
    message: typeof reminder.message === "string" ? reminder.message : void 0,
    reminderType: reminder.reminderType,
    path: reminder.path
  };
}
function addInlineReminder(ctx, reminder) {
  const { state } = ctx;
  const component = new SystemReminderComponent({
    message: reminder.message,
    reminderType: reminder.reminderType,
    path: reminder.path
  });
  component.setExpanded(state.toolOutputExpanded);
  state.allSystemReminderComponents.push(component);
  if (state.streamingComponent) {
    const idx = state.chatContainer.children.indexOf(state.streamingComponent);
    if (idx >= 0) {
      state.chatContainer.children.splice(idx, 0, component);
      state.chatContainer.invalidate();
      return;
    }
  }
  ctx.addChildBeforeFollowUps(component);
}
function getContentBeforeToolCall(message, toolCallId, seenToolCallIds) {
  const idx = message.content.findIndex((c) => c.type === "tool_call" && c.id === toolCallId);
  if (idx === -1) return message.content;
  let startIdx = 0;
  for (let i = idx - 1; i >= 0; i--) {
    const c = message.content[i];
    if (c.type === "tool_call" && "id" in c && seenToolCallIds.has(c.id) || c.type === "tool_result" && "id" in c && seenToolCallIds.has(c.id)) {
      startIdx = i + 1;
      break;
    }
  }
  return message.content.slice(startIdx, idx).filter((c) => c.type === "text" || c.type === "thinking");
}
function handleMessageStart(ctx, message) {
  const { state } = ctx;
  if (message.role === "user") {
    ctx.addUserMessage(message);
  } else if (message.role === "assistant") {
    state.lastAskUserComponent = void 0;
    state.lastSubmitPlanComponent = void 0;
    if (!state.streamingComponent) {
      state.streamingComponent = new AssistantMessageComponent(void 0, state.hideThinkingBlock, chunkWOKNPWRC_cjs.getMarkdownTheme());
      ctx.addChildBeforeFollowUps(state.streamingComponent);
      state.streamingMessage = message;
      const trailingParts = getTrailingContentParts(message);
      state.streamingComponent.updateContent({
        ...message,
        content: trailingParts
      });
    }
    state.ui.requestRender();
  }
}
function handleMessageUpdate(ctx, message) {
  const { state } = ctx;
  if (message.role !== "assistant") return;
  const systemReminderParts = message.content.map(toStreamedSystemReminderPart).filter((part) => part !== void 0);
  for (const reminder of systemReminderParts) {
    const reminderKey = `${message.id}:${reminder.reminderType ?? ""}:${reminder.path ?? ""}:${reminder.message}`;
    if (!state.currentRunSystemReminderKeys.has(reminderKey)) {
      state.currentRunSystemReminderKeys.add(reminderKey);
      addInlineReminder(ctx, reminder);
    }
  }
  if (!state.streamingComponent) {
    if (systemReminderParts.length > 0) {
      state.ui.requestRender();
    }
    return;
  }
  state.streamingMessage = message;
  for (const content of message.content) {
    if (content.type === "tool_call") {
      if (content.name === "subagent" && !state.subagentToolCallIds.has(content.id)) {
        state.seenToolCallIds.add(content.id);
        state.subagentToolCallIds.add(content.id);
        const preContent = getContentBeforeToolCall(message, content.id, state.seenToolCallIds);
        state.streamingComponent.updateContent({
          ...message,
          content: preContent
        });
        state.streamingComponent = new AssistantMessageComponent(
          void 0,
          state.hideThinkingBlock,
          chunkWOKNPWRC_cjs.getMarkdownTheme()
        );
        ctx.addChildBeforeFollowUps(state.streamingComponent);
        continue;
      }
      if (!state.seenToolCallIds.has(content.id)) {
        state.seenToolCallIds.add(content.id);
        const component = new ToolExecutionComponentEnhanced(
          content.name,
          content.args,
          { showImages: false, collapsedByDefault: !state.toolOutputExpanded },
          state.ui
        );
        component.setExpanded(state.toolOutputExpanded);
        ctx.addChildBeforeFollowUps(component);
        state.pendingTools.set(content.id, component);
        state.allToolComponents.push(component);
        state.streamingComponent = new AssistantMessageComponent(
          void 0,
          state.hideThinkingBlock,
          chunkWOKNPWRC_cjs.getMarkdownTheme()
        );
        ctx.addChildBeforeFollowUps(state.streamingComponent);
      } else {
        const component = state.pendingTools.get(content.id);
        if (component) {
          component.updateArgs(content.args);
        }
      }
    }
  }
  const trailingParts = getTrailingContentParts(message);
  if (trailingParts.length > 0) {
    state.streamingComponent.updateContent({
      ...message,
      content: trailingParts
    });
  }
  state.ui.requestRender();
}
function handleMessageEnd(ctx, message) {
  const { state } = ctx;
  if (message.role === "user") return;
  if (state.streamingComponent && message.role === "assistant") {
    state.streamingMessage = message;
    const trailingParts = getTrailingContentParts(message);
    if (trailingParts.length > 0 || message.stopReason === "aborted" || message.stopReason === "error") {
      state.streamingComponent.updateContent({
        ...message,
        content: trailingParts
      });
    }
    if (message.stopReason === "aborted" || message.stopReason === "error") {
      const errorMessage = message.errorMessage || "Operation aborted";
      for (const [, component] of state.pendingTools) {
        component.updateResult(
          {
            content: [{ type: "text", text: errorMessage }],
            isError: true
          },
          false
        );
      }
      state.pendingTools.clear();
    }
    state.streamingComponent = void 0;
    state.streamingMessage = void 0;
    state.seenToolCallIds.clear();
    state.subagentToolCallIds.clear();
    state.currentRunSystemReminderKeys.clear();
  }
  state.ui.requestRender();
}
function formatTokens2(tokens) {
  if (tokens === 0) return "0";
  const k = tokens / 1e3;
  return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
}
var OMMarkerComponent = class extends piTui.Container {
  textChild;
  constructor(data) {
    super();
    this.textChild = new piTui.Text(formatMarker(data), chunkWOKNPWRC_cjs.BOX_INDENT, 0);
    this.addChild(this.textChild);
    this.addChild(new piTui.Spacer(1));
  }
  /**
   * Update the marker in-place (e.g., from start → end).
   */
  update(data) {
    this.textChild.setText(formatMarker(data));
  }
};
function formatMarker(data) {
  const isReflection = "operationType" in data && data.operationType === "reflection";
  const label = isReflection ? "Reflection" : "Observation";
  switch (data.type) {
    case "om_observation_start": {
      const tokens = data.tokensToObserve > 0 ? ` ~${formatTokens2(data.tokensToObserve)} tokens` : "";
      return chunkWOKNPWRC_cjs.theme.fg("muted", `  \u{1F9E0} ${label} in progress${tokens}...`);
    }
    case "om_observation_end": {
      const observed = formatTokens2(data.tokensObserved);
      const compressed = formatTokens2(data.observationTokens);
      const ratio = data.tokensObserved > 0 && data.observationTokens > 0 ? `${Math.round(data.tokensObserved / data.observationTokens)}x` : "";
      const duration = (data.durationMs / 1e3).toFixed(1);
      const ratioStr = ratio ? ` (${ratio} compression)` : "";
      return chunkWOKNPWRC_cjs.theme.fg("success", `  \u{1F9E0} Observed: ${observed} \u2192 ${compressed} tokens${ratioStr} in ${duration}s \u2713`);
    }
    case "om_observation_failed": {
      const tokens = data.tokensAttempted ? ` (${formatTokens2(data.tokensAttempted)} tokens)` : "";
      return chunkWOKNPWRC_cjs.theme.fg("error", `  \u2717 ${label} failed${tokens}: ${data.error}`);
    }
    case "om_buffering_start": {
      const tokens = data.tokensToBuffer > 0 ? ` ~${formatTokens2(data.tokensToBuffer)} tokens` : "";
      return chunkWOKNPWRC_cjs.theme.fg("muted", `  \u27F3 Buffering ${label.toLowerCase()}${tokens}...`);
    }
    case "om_buffering_end": {
      const input = formatTokens2(data.tokensBuffered);
      const outputTokens = data.operationType === "observation" && data.observations ? Math.round(data.observations.length / 4) : data.bufferedTokens;
      const output = formatTokens2(outputTokens);
      const ratio = data.tokensBuffered > 0 && outputTokens > 0 ? ` (${Math.round(data.tokensBuffered / outputTokens)}x)` : "";
      return chunkWOKNPWRC_cjs.theme.fg("success", `  \u2713 Buffered ${label.toLowerCase()}: ${input} \u2192 ${output} tokens${ratio}`);
    }
    case "om_buffering_failed": {
      return chunkWOKNPWRC_cjs.theme.fg("error", `  \u2717 Buffering ${label.toLowerCase()} failed: ${data.error}`);
    }
    case "om_activation": {
      const kind = data.operationType === "reflection" ? "reflection" : "observations";
      const msgTokens = formatTokens2(data.tokensActivated);
      const obsTokens = formatTokens2(data.observationTokens);
      return chunkWOKNPWRC_cjs.theme.fg("success", `  \u2713 Activated ${kind}: -${msgTokens} msg tokens, +${obsTokens} obs tokens`);
    }
    case "om_thread_title_updated": {
      return chunkWOKNPWRC_cjs.theme.fg("muted", `  thread title updated: ${data.newTitle}`);
    }
  }
}
var getObserverColor2 = () => chunkWOKNPWRC_cjs.mastra.orange;
var getReflectorColor2 = () => chunkWOKNPWRC_cjs.mastra.red;
var COLLAPSED_LINES = 10;
function formatTokens3(tokens) {
  if (tokens === 0) return "0";
  const k = tokens / 1e3;
  return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
}
function truncateAnsi2(str, maxWidth) {
  const ansiRegex = /\x1b\[[0-9;]*m/g;
  let visibleLength = 0;
  let result = "";
  let lastIndex = 0;
  let match;
  while ((match = ansiRegex.exec(str)) !== null) {
    const textBefore = str.slice(lastIndex, match.index);
    for (const char of textBefore) {
      if (visibleLength >= maxWidth) break;
      result += char;
      visibleLength++;
    }
    if (visibleLength >= maxWidth) break;
    result += match[0];
    lastIndex = match.index + match[0].length;
  }
  const remaining = str.slice(lastIndex);
  for (const char of remaining) {
    if (visibleLength >= maxWidth) break;
    result += char;
    visibleLength++;
  }
  if (visibleLength >= maxWidth) {
    result += "\x1B[0m";
  }
  return result;
}
function softWrapLines(lines, maxWidth) {
  const groups = [];
  const flat = [];
  for (const line of lines) {
    if (line.length <= maxWidth) {
      groups.push([line]);
      flat.push(line);
      continue;
    }
    const group = [];
    let remaining = line;
    while (remaining.length > maxWidth) {
      let breakAt = remaining.lastIndexOf(" ", maxWidth);
      if (breakAt <= 0) {
        breakAt = maxWidth;
      }
      const segment = remaining.slice(0, breakAt);
      group.push(segment);
      flat.push(segment);
      remaining = remaining.slice(breakAt).replace(/^ /, "");
    }
    if (remaining.length > 0) {
      group.push(remaining);
      flat.push(remaining);
    }
    groups.push(group);
  }
  return { groups, flat };
}
var OMOutputComponent = class extends piTui.Container {
  data;
  expanded = false;
  constructor(data) {
    super();
    this.data = data;
    this.rebuild();
  }
  setExpanded(expanded) {
    this.expanded = expanded;
    this.rebuild();
  }
  toggleExpanded() {
    this.setExpanded(!this.expanded);
  }
  rebuild() {
    this.clear();
    const isReflection = this.data.type === "reflection";
    const color = isReflection ? getReflectorColor2() : getObserverColor2();
    const border = (char) => chalk8__default.default.bold.hex(color)(char);
    const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
    const maxLineWidth = termWidth - 6 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
    const originalLines = this.data.observations.split("\n");
    const { groups, flat: wrappedLines } = softWrapLines(originalLines, maxLineWidth);
    const originalLineCount = originalLines.length;
    const wrappedLineCount = wrappedLines.length;
    const footerText = this.buildFooterText(color);
    this.addChild(new piTui.Text(border("\u256D\u2500\u2500"), chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    let truncated = false;
    const borderedLines = [];
    if (!this.expanded && wrappedLineCount > COLLAPSED_LINES + 1) {
      const headBudget = Math.ceil(COLLAPSED_LINES / 2);
      const headLines = [];
      let headGroupCount = 0;
      for (const group of groups) {
        if (headLines.length + group.length > headBudget && headLines.length > 0) break;
        headLines.push(...group);
        headGroupCount++;
      }
      const tailBudget = COLLAPSED_LINES - headLines.length;
      const tailLines = [];
      let tailGroupStart = groups.length;
      for (let i = groups.length - 1; i >= headGroupCount; i--) {
        if (tailLines.length + groups[i].length > tailBudget && tailLines.length > 0) break;
        tailLines.unshift(...groups[i]);
        tailGroupStart = i;
      }
      const hiddenGroups = tailGroupStart - headGroupCount;
      truncated = hiddenGroups > 0;
      if (truncated) {
        for (const line of headLines) {
          borderedLines.push(border("\u2502") + " " + chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.specialGray)(line));
        }
        borderedLines.push(
          border("\u2502") + " " + chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.mainGray)(`... ${originalLineCount} lines total (ctrl+e to expand)`)
        );
        for (const line of tailLines) {
          borderedLines.push(border("\u2502") + " " + chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.specialGray)(line));
        }
      } else {
        for (const line of wrappedLines) {
          borderedLines.push(border("\u2502") + " " + chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.specialGray)(line));
        }
      }
    } else {
      for (const line of wrappedLines) {
        borderedLines.push(border("\u2502") + " " + chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.specialGray)(line));
      }
    }
    const displayOutput = borderedLines.join("\n");
    if (displayOutput.trim()) {
      this.addChild(new piTui.Text(displayOutput, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    }
    if (this.data.currentTask && (this.expanded || !truncated)) {
      const taskLine = border("\u2502") + " " + chalk8__default.default.hex(color).bold("Current task: ") + chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.specialGray)(this.data.currentTask);
      this.addChild(new piTui.Text(truncateAnsi2(taskLine, termWidth - 2 - chunkWOKNPWRC_cjs.BOX_INDENT * 2), chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    }
    if (this.data.suggestedResponse && (this.expanded || !truncated)) {
      const sugLine = border("\u2502") + " " + chalk8__default.default.hex(color).bold("Suggested response: ") + chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.specialGray)(this.data.suggestedResponse);
      this.addChild(new piTui.Text(truncateAnsi2(sugLine, termWidth - 2 - chunkWOKNPWRC_cjs.BOX_INDENT * 2), chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    }
    this.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    this.addChild(new piTui.Spacer(1));
  }
  buildFooterText(color) {
    const isReflection = this.data.type === "reflection";
    const emoji = "\u{1F9E0}";
    if (isReflection) {
      const observed = formatTokens3(this.data.tokensObserved ?? 0);
      const compressed = formatTokens3(this.data.compressedTokens ?? this.data.observationTokens ?? 0);
      const ratio = (this.data.tokensObserved ?? 0) > 0 && (this.data.compressedTokens ?? this.data.observationTokens ?? 0) > 0 ? `${Math.round((this.data.tokensObserved ?? 0) / (this.data.compressedTokens ?? this.data.observationTokens ?? 1))}x` : "";
      const durationStr = this.data.durationMs ? ` in ${(this.data.durationMs / 1e3).toFixed(1)}s` : "";
      const ratioStr = ratio ? ` (${ratio} compression)` : "";
      return `${emoji} ${chalk8__default.default.hex(color)(`Reflected: ${observed} \u2192 ${compressed} tokens${ratioStr}${durationStr}`)} ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.green)("\u2713")}`;
    } else {
      const observed = formatTokens3(this.data.tokensObserved ?? 0);
      const compressed = formatTokens3(this.data.observationTokens ?? 0);
      const ratio = (this.data.tokensObserved ?? 0) > 0 && (this.data.observationTokens ?? 0) > 0 ? `${Math.round((this.data.tokensObserved ?? 0) / (this.data.observationTokens ?? 1))}x` : "";
      const durationStr = this.data.durationMs ? ` in ${(this.data.durationMs / 1e3).toFixed(1)}s` : "";
      const ratioStr = ratio ? ` (${ratio} compression)` : "";
      return `${emoji} ${chalk8__default.default.hex(color)(`Observed: ${observed} \u2192 ${compressed} tokens${ratioStr}${durationStr}`)} ${chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.green)("\u2713")}`;
    }
  }
};

// src/tui/handlers/om.ts
function addChildBeforeStreaming(ctx, child) {
  const { state } = ctx;
  if (state.streamingComponent) {
    const idx = state.chatContainer.children.indexOf(state.streamingComponent);
    if (idx >= 0) {
      state.chatContainer.children.splice(idx, 0, child);
      state.chatContainer.invalidate();
      return;
    }
  }
  state.chatContainer.addChild(child);
}
function handleOMObservationStart(ctx, cycleId, tokensToObserve) {
  const { state } = ctx;
  state.activeOMMarker = new OMMarkerComponent({
    type: "om_observation_start",
    tokensToObserve,
    operationType: "observation"
  });
  addChildBeforeStreaming(ctx, state.activeOMMarker);
  state.ui.requestRender();
}
function handleOMObservationEnd(ctx, _cycleId, durationMs, tokensObserved, observationTokens, observations, currentTask, suggestedResponse) {
  const { state } = ctx;
  if (state.activeOMMarker) {
    const idx = state.chatContainer.children.indexOf(state.activeOMMarker);
    if (idx >= 0) {
      state.chatContainer.children.splice(idx, 1);
      state.chatContainer.invalidate();
    }
    state.activeOMMarker = void 0;
  }
  const outputComponent = new OMOutputComponent({
    type: "observation",
    observations: observations ?? "",
    currentTask,
    suggestedResponse,
    durationMs,
    tokensObserved,
    observationTokens
  });
  addChildBeforeStreaming(ctx, outputComponent);
  state.ui.requestRender();
}
function handleOMReflectionStart(ctx, cycleId, tokensToReflect) {
  const { state } = ctx;
  state.activeOMMarker = new OMMarkerComponent({
    type: "om_observation_start",
    tokensToObserve: tokensToReflect,
    operationType: "reflection"
  });
  addChildBeforeStreaming(ctx, state.activeOMMarker);
  state.ui.requestRender();
}
function handleOMReflectionEnd(ctx, _cycleId, durationMs, compressedTokens, observations) {
  const { state } = ctx;
  const ds = state.harness.getDisplayState();
  if (state.activeOMMarker) {
    const idx = state.chatContainer.children.indexOf(state.activeOMMarker);
    if (idx >= 0) {
      state.chatContainer.children.splice(idx, 1);
      state.chatContainer.invalidate();
    }
    state.activeOMMarker = void 0;
  }
  const outputComponent = new OMOutputComponent({
    type: "reflection",
    observations: observations ?? "",
    durationMs,
    compressedTokens,
    // preReflectionTokens captures observationTokens before compression started
    tokensObserved: ds.omProgress.preReflectionTokens
  });
  addChildBeforeStreaming(ctx, outputComponent);
  state.ui.requestRender();
}
function handleOMFailed(ctx, _cycleId, error, operation) {
  const { state } = ctx;
  const failData = {
    type: "om_observation_failed",
    error,
    operationType: operation
  };
  if (state.activeOMMarker) {
    state.activeOMMarker.update(failData);
    state.activeOMMarker = void 0;
  } else {
    addChildBeforeStreaming(ctx, new OMMarkerComponent(failData));
  }
  state.ui.requestRender();
}
function handleOMBufferingStart(ctx, operationType, tokensToBuffer) {
  const { state } = ctx;
  state.activeActivationMarker = void 0;
  state.activeBufferingMarker = new OMMarkerComponent({
    type: "om_buffering_start",
    operationType,
    tokensToBuffer
  });
  addChildBeforeStreaming(ctx, state.activeBufferingMarker);
  state.ui.requestRender();
}
function handleOMBufferingEnd(ctx, operationType, tokensBuffered, bufferedTokens, observations) {
  const { state } = ctx;
  if (state.activeBufferingMarker) {
    state.activeBufferingMarker.update({
      type: "om_buffering_end",
      operationType,
      tokensBuffered,
      bufferedTokens,
      observations
    });
  }
  state.activeBufferingMarker = void 0;
  state.ui.requestRender();
}
function handleOMBufferingFailed(ctx, operationType, error) {
  const { state } = ctx;
  if (state.activeBufferingMarker) {
    state.activeBufferingMarker.update({
      type: "om_buffering_failed",
      operationType,
      error
    });
  }
  state.activeBufferingMarker = void 0;
  state.ui.requestRender();
}
function handleOMActivation(ctx, operationType, tokensActivated, observationTokens) {
  const { state } = ctx;
  const activationData = {
    type: "om_activation",
    operationType,
    tokensActivated,
    observationTokens
  };
  state.activeActivationMarker = new OMMarkerComponent(activationData);
  addChildBeforeStreaming(ctx, state.activeActivationMarker);
  state.activeBufferingMarker = void 0;
  state.ui.requestRender();
}
function handleOMThreadTitleUpdated(ctx, newTitle, oldTitle) {
  const marker = new OMMarkerComponent({
    type: "om_thread_title_updated",
    newTitle,
    oldTitle
  });
  addChildBeforeStreaming(ctx, marker);
  ctx.state.ui.requestRender();
}
function slugify(str) {
  const slug = str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "untitled";
}
async function savePlanToDisk(opts) {
  const { title, plan, resourceId } = opts;
  const plansDir = opts.plansDir ?? process.env.MASTRA_PLANS_DIR ?? path6__namespace.default.join(chunkP2NLJLNZ_cjs.getAppDataDir(), "plans");
  const dir = path6__namespace.default.join(plansDir, resourceId);
  await fs5__default.default.mkdir(dir, { recursive: true });
  const now = /* @__PURE__ */ new Date();
  const timestamp = now.toISOString().replace(/:/g, "-");
  const slug = slugify(title);
  const filename = `${timestamp}-${slug}.md`;
  const content = `# ${title}

Approved: ${now.toISOString()}

${plan}
`;
  await fs5__default.default.writeFile(path6__namespace.default.join(dir, filename), content, "utf-8");
}
var AskQuestionDialogComponent = class _AskQuestionDialogComponent extends piTui.Box {
  static CUSTOM_RESPONSE_VALUE = "__custom_response__";
  selectList;
  input;
  onSubmit;
  onCancel;
  /** Children added by buildSelectMode/buildInputMode, tracked for removal on mode switch */
  modeChildren = [];
  _focused = false;
  get focused() {
    return this._focused;
  }
  set focused(value) {
    this._focused = value;
    if (this.input) this.input.focused = value;
  }
  constructor(options) {
    super(2, 1, (text) => chunkWOKNPWRC_cjs.theme.bg("overlayBg", text));
    this.onSubmit = options.onSubmit;
    this.onCancel = options.onCancel;
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "Question")), 0, 0));
    this.addChild(new piTui.Spacer(1));
    for (const line of options.question.split("\n")) {
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", line), 0, 0));
    }
    this.addChild(new piTui.Spacer(1));
    if (options.options && options.options.length > 0) {
      this.buildSelectMode(options.options);
    } else {
      this.buildInputMode();
    }
  }
  buildSelectMode(opts) {
    const items = opts.map((opt) => ({
      value: opt.label,
      label: opt.description ? `  ${opt.label}  ${chunkWOKNPWRC_cjs.theme.fg("dim", opt.description)}` : `  ${opt.label}`
    }));
    items.push({
      value: _AskQuestionDialogComponent.CUSTOM_RESPONSE_VALUE,
      label: `  ${chunkWOKNPWRC_cjs.theme.fg("dim", "\u270E Custom response...")}`
    });
    this.selectList = new piTui.SelectList(items, Math.min(items.length, 8), chunkWOKNPWRC_cjs.getSelectListTheme());
    this.selectList.onSelect = (item) => {
      if (item.value === _AskQuestionDialogComponent.CUSTOM_RESPONSE_VALUE) {
        this.switchToCustomInput();
        return;
      }
      this.onSubmit(item.value);
    };
    this.selectList.onCancel = this.onCancel;
    this.modeChildren = [];
    const selectChild = this.selectList;
    this.addChild(selectChild);
    this.modeChildren.push(selectChild);
    const spacer = new piTui.Spacer(1);
    this.addChild(spacer);
    this.modeChildren.push(spacer);
    const hint = new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "  \u2191\u2193 to navigate \xB7 Enter to select \xB7 Esc to skip"), 0, 0);
    this.addChild(hint);
    this.modeChildren.push(hint);
  }
  buildInputMode() {
    this.input = new piTui.Input();
    this.input.onSubmit = (value) => {
      const trimmed = value.trim();
      if (trimmed) {
        this.onSubmit(trimmed);
      }
    };
    this.modeChildren = [];
    const inputChild = this.input;
    this.addChild(inputChild);
    this.modeChildren.push(inputChild);
    const spacer = new piTui.Spacer(1);
    this.addChild(spacer);
    this.modeChildren.push(spacer);
    const hint = new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "  Enter to submit \xB7 Esc to skip"), 0, 0);
    this.addChild(hint);
    this.modeChildren.push(hint);
  }
  switchToCustomInput() {
    for (const child of this.modeChildren) {
      this.removeChild(child);
    }
    this.selectList = void 0;
    this.buildInputMode();
    if (this.input) this.input.focused = this._focused;
  }
  handleInput(data) {
    if (this.selectList) {
      this.selectList.handleInput(data);
    } else if (this.input) {
      const kb = piTui.getEditorKeybindings();
      if (kb.matches(data, "selectCancel")) {
        this.onCancel();
        return;
      }
      this.input.handleInput(data);
    }
  }
};
var PlanApprovalInlineComponent = class extends piTui.Container {
  contentBox;
  selectList;
  feedbackInput;
  onApprove;
  onReject;
  resolved = false;
  mode = "select";
  planTitle;
  planContent;
  _focused = false;
  get focused() {
    return this._focused;
  }
  set focused(value) {
    this._focused = value;
    if (this.mode === "feedback" && this.feedbackInput) {
      this.feedbackInput.focused = value;
    }
  }
  constructor(options, _ui) {
    super();
    this.onApprove = options.onApprove;
    this.onReject = options.onReject;
    this.planTitle = options.title;
    this.planContent = options.plan;
    this.contentBox = new piTui.Box(chunkWOKNPWRC_cjs.BOX_INDENT, 0, (text) => text);
    this.addChild(this.contentBox);
    this.addChild(new piTui.Spacer(1));
    this.contentBox.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", `Plan: ${options.title}`)), 0, 0));
    this.contentBox.addChild(new piTui.Spacer(1));
    const md = new piTui.Markdown(options.plan, 1, 0, chunkWOKNPWRC_cjs.getMarkdownTheme(), {
      color: (text) => chunkWOKNPWRC_cjs.theme.fg("text", text)
    });
    this.contentBox.addChild(md);
    this.contentBox.addChild(new piTui.Spacer(1));
    const items = [
      {
        value: "approve",
        label: `  ${chunkWOKNPWRC_cjs.theme.fg("success", "Approve")} ${chunkWOKNPWRC_cjs.theme.fg("dim", "\u2014 switch to Build mode and implement")}`
      },
      {
        value: "reject",
        label: `  ${chunkWOKNPWRC_cjs.theme.fg("error", "Reject")} ${chunkWOKNPWRC_cjs.theme.fg("dim", "\u2014 stay in Plan mode")}`
      },
      {
        value: "edit",
        label: `  ${chunkWOKNPWRC_cjs.theme.fg("warning", "Request changes")} ${chunkWOKNPWRC_cjs.theme.fg("dim", "\u2014 provide feedback")}`
      }
    ];
    this.selectList = new piTui.SelectList(items, items.length, chunkWOKNPWRC_cjs.getSelectListTheme());
    this.selectList.onSelect = (item) => {
      this.handleSelection(item.value);
    };
    this.selectList.onCancel = () => {
      this.handleReject();
    };
    this.contentBox.addChild(this.selectList);
    this.contentBox.addChild(new piTui.Spacer(1));
    this.contentBox.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "Up/Down navigate  Enter select  Esc reject"), 0, 0));
  }
  handleSelection(value) {
    if (this.resolved) return;
    switch (value) {
      case "approve":
        this.handleApprove();
        break;
      case "reject":
        this.handleReject();
        break;
      case "edit":
        this.switchToFeedbackMode();
        break;
    }
  }
  handleApprove() {
    if (this.resolved) return;
    this.resolved = true;
    this.showResult("Approved", true);
    this.onApprove();
  }
  handleReject(feedback) {
    if (this.resolved) return;
    this.resolved = true;
    this.showResult(feedback ? `Rejected \u2014 ${feedback}` : "Rejected", false);
    this.onReject(feedback);
  }
  switchToFeedbackMode() {
    this.mode = "feedback";
    this.selectList = void 0;
    this.contentBox.clear();
    this.contentBox.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", `Plan: ${this.planTitle}`)), 0, 0));
    this.contentBox.addChild(new piTui.Spacer(1));
    const md = new piTui.Markdown(this.planContent, 1, 0, chunkWOKNPWRC_cjs.getMarkdownTheme(), {
      color: (text) => chunkWOKNPWRC_cjs.theme.fg("text", text)
    });
    this.contentBox.addChild(md);
    this.contentBox.addChild(new piTui.Spacer(1));
    this.contentBox.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("accent", "Provide feedback for revision:"), 0, 0));
    this.contentBox.addChild(new piTui.Spacer(1));
    this.feedbackInput = new piTui.Input();
    this.feedbackInput.focused = this._focused;
    this.feedbackInput.onSubmit = (value) => {
      const trimmed = value.trim();
      this.handleReject(trimmed || void 0);
    };
    this.feedbackInput.onEscape = () => {
      this.handleReject();
    };
    this.contentBox.addChild(this.feedbackInput);
    this.contentBox.addChild(new piTui.Spacer(1));
    this.contentBox.addChild(
      new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("dim", "Enter to submit feedback  Esc to reject without feedback"), 0, 0)
    );
  }
  showResult(status, isApproved) {
    this.contentBox.clear();
    const icon = isApproved ? chunkWOKNPWRC_cjs.theme.fg("success", "\u2713") : chunkWOKNPWRC_cjs.theme.fg("error", "\u2717");
    this.contentBox.addChild(
      new piTui.Text(
        `${icon} ${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", `Plan: ${this.planTitle}`))} ${chunkWOKNPWRC_cjs.theme.fg("dim", `\u2014 ${status}`)}`,
        0,
        0
      )
    );
    this.contentBox.addChild(new piTui.Spacer(1));
    const md = new piTui.Markdown(this.planContent, 1, 0, chunkWOKNPWRC_cjs.getMarkdownTheme(), {
      color: (text) => chunkWOKNPWRC_cjs.theme.fg("text", text)
    });
    this.contentBox.addChild(md);
  }
  handleInput(data) {
    if (this.resolved) return;
    if (this.mode === "feedback" && this.feedbackInput) {
      const kb = piTui.getEditorKeybindings();
      if (kb.matches(data, "selectCancel")) {
        this.handleReject();
        return;
      }
      this.feedbackInput.handleInput(data);
    } else if (this.selectList) {
      this.selectList.handleInput(data);
    }
  }
};
var PlanResultComponent = class extends piTui.Container {
  constructor(options) {
    super();
    const contentBox = new piTui.Box(chunkWOKNPWRC_cjs.BOX_INDENT, 0, (text) => text);
    this.addChild(contentBox);
    const icon = options.isApproved ? chunkWOKNPWRC_cjs.theme.fg("success", "\u2713") : chunkWOKNPWRC_cjs.theme.fg("error", "\u2717");
    const status = options.isApproved ? "Approved" : options.feedback ? `Rejected \u2014 ${options.feedback}` : "Rejected";
    contentBox.addChild(
      new piTui.Text(
        `${icon} ${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", `Plan: ${options.title}`))} ${chunkWOKNPWRC_cjs.theme.fg("dim", `\u2014 ${status}`)}`,
        0,
        0
      )
    );
    contentBox.addChild(new piTui.Spacer(1));
    const md = new piTui.Markdown(options.plan, 1, 0, chunkWOKNPWRC_cjs.getMarkdownTheme(), {
      color: (text) => chunkWOKNPWRC_cjs.theme.fg("text", text)
    });
    contentBox.addChild(md);
    this.addChild(new piTui.Spacer(1));
  }
};
var TeamModelPickerComponent = class extends piTui.Box {
  searchInput;
  listContainer;
  members;
  allModels;
  filteredModels;
  selectedIndex = 0;
  focusedMemberIndex = 0;
  selections = {};
  tui;
  onSelectCallback;
  onCancelCallback;
  // Focusable implementation
  _focused = false;
  get focused() {
    return this._focused;
  }
  set focused(value) {
    this._focused = value;
    this.searchInput.focused = value;
  }
  constructor(options) {
    super(2, 1, (text) => chunkWOKNPWRC_cjs.theme.bg("overlayBg", text));
    this.tui = options.tui;
    this.members = options.members;
    this.allModels = this.sortModels(options.availableModels);
    this.filteredModels = this.allModels;
    this.onSelectCallback = options.onSelect;
    this.onCancelCallback = options.onCancel;
    for (const member of this.members) {
      if (member.defaultModelId) {
        this.selections[member.id] = member.defaultModelId;
      }
    }
    this.buildUI();
  }
  buildUI() {
    const titleText = chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "Select Models for Team Members"));
    this.addChild(new piTui.Text(titleText, 0, 0));
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "Tab switch member \u2022 \u2191\u2193 navigate \u2022 Enter select/confirm \u2022 Esc cancel"), 0, 0));
    this.addChild(new piTui.Spacer(1));
    this.buildMemberList();
    this.addChild(new piTui.Spacer(1));
    this.searchInput = new piTui.Input();
    this.searchInput.onSubmit = () => {
      this.handleEnter();
    };
    this.addChild(this.searchInput);
    this.addChild(new piTui.Spacer(1));
    this.listContainer = new piTui.Container();
    this.addChild(this.listContainer);
    this.updateList();
  }
  buildMemberList() {
    const memberContainer = new piTui.Container();
    for (let i = 0; i < this.members.length; i++) {
      const member = this.members[i];
      const isFocused = i === this.focusedMemberIndex;
      const hasSelection = this.selections[member.id] !== void 0;
      const selectedModel = hasSelection ? this.selections[member.id] : void 0;
      let line;
      if (isFocused) {
        const cursor = chunkWOKNPWRC_cjs.theme.fg("accent", "\u25B8 ");
        const name = chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", member.name));
        const model = hasSelection ? chunkWOKNPWRC_cjs.theme.fg("success", ` \u2192 ${selectedModel}`) : chunkWOKNPWRC_cjs.theme.fg("muted", " \u2192 (no model)");
        line = cursor + name + model;
      } else {
        const cursor = "  ";
        const name = hasSelection ? member.name : chunkWOKNPWRC_cjs.theme.fg("muted", member.name);
        const model = hasSelection ? chunkWOKNPWRC_cjs.theme.fg("dim", ` \u2192 ${selectedModel}`) : chunkWOKNPWRC_cjs.theme.fg("muted", " \u2192 (no model)");
        line = cursor + name + model;
      }
      memberContainer.addChild(new piTui.Text(line, 0, 0));
    }
    this.addChild(memberContainer);
  }
  sortModels(models) {
    const sorted = [...models];
    sorted.sort((a, b) => {
      if (a.hasApiKey && !b.hasApiKey) return -1;
      if (!a.hasApiKey && b.hasApiKey) return 1;
      const aCount = a.useCount ?? 0;
      const bCount = b.useCount ?? 0;
      if (aCount !== bCount) return bCount - aCount;
      const providerCompare = a.provider.localeCompare(b.provider);
      if (providerCompare !== 0) return providerCompare;
      return a.modelName.localeCompare(b.modelName);
    });
    return sorted;
  }
  filterModels(query) {
    this.filteredModels = query ? piTui.fuzzyFilter(this.allModels, query, (m) => `${m.id} ${m.provider} ${m.modelName}`) : this.allModels;
    this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, this.filteredModels.length - 1));
    this.updateList();
  }
  getCurrentMemberModelId() {
    const member = this.members[this.focusedMemberIndex];
    return member ? this.selections[member.id] ?? member.defaultModelId : void 0;
  }
  updateList() {
    this.listContainer.clear();
    const maxVisible = 8;
    const totalItems = this.filteredModels.length;
    const startIndex = Math.max(0, Math.min(this.selectedIndex - Math.floor(maxVisible / 2), totalItems - maxVisible));
    const endIndex = Math.min(startIndex + maxVisible, totalItems);
    const currentModelId = this.getCurrentMemberModelId();
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.filteredModels[i];
      if (!item) continue;
      const isSelected = i === this.selectedIndex;
      const isCurrent = item.id === currentModelId;
      const checkmark = isCurrent ? chunkWOKNPWRC_cjs.theme.fg("success", " \u2713") : "";
      const noKeyIndicator = !item.hasApiKey ? chunkWOKNPWRC_cjs.theme.fg("error", " \u2717") + chunkWOKNPWRC_cjs.theme.fg("muted", " (no key)") : "";
      let line;
      if (isSelected) {
        line = chunkWOKNPWRC_cjs.theme.fg("accent", "\u2192 " + item.id) + checkmark + noKeyIndicator;
      } else {
        const modelText = item.hasApiKey ? item.id : chunkWOKNPWRC_cjs.theme.fg("muted", item.id);
        line = "  " + modelText + checkmark + noKeyIndicator;
      }
      this.listContainer.addChild(new piTui.Text(line, 0, 0));
    }
    if (startIndex > 0 || endIndex < totalItems) {
      const scrollInfo = chunkWOKNPWRC_cjs.theme.fg("muted", `(${this.selectedIndex + 1}/${totalItems})`);
      this.listContainer.addChild(new piTui.Text(scrollInfo, 0, 0));
    }
    if (totalItems === 0) {
      this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "No matching models"), 0, 0));
    }
  }
  handleEnter() {
    const selected = this.filteredModels[this.selectedIndex];
    if (!selected) return;
    const member = this.members[this.focusedMemberIndex];
    if (!member) return;
    if (this.selections[member.id] === selected.id) {
      if (this.allMembersSelected()) {
        this.onSelectCallback(this.selections);
        return;
      }
    }
    this.selections[member.id] = selected.id;
    const nextIndex = this.findNextUnselectedMember();
    if (nextIndex !== -1) {
      this.focusedMemberIndex = nextIndex;
    } else if (this.focusedMemberIndex < this.members.length - 1) {
      this.focusedMemberIndex++;
    }
    this.searchInput.setValue("");
    this.filteredModels = this.allModels;
    this.selectedIndex = 0;
    this.rebuildUI();
    this.tui.requestRender();
  }
  findNextUnselectedMember() {
    for (let i = this.focusedMemberIndex + 1; i < this.members.length; i++) {
      if (!this.selections[this.members[i].id]) return i;
    }
    for (let i = 0; i < this.focusedMemberIndex; i++) {
      if (!this.selections[this.members[i].id]) return i;
    }
    return -1;
  }
  allMembersSelected() {
    return this.members.every((m) => this.selections[m.id] !== void 0);
  }
  rebuildUI() {
    this.clear();
    const titleText = chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "Select Models for Team Members"));
    this.addChild(new piTui.Text(titleText, 0, 0));
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "Tab switch member \u2022 \u2191\u2193 navigate \u2022 Enter select/confirm \u2022 Esc cancel"), 0, 0));
    this.addChild(new piTui.Spacer(1));
    this.buildMemberList();
    this.addChild(new piTui.Spacer(1));
    this.searchInput = new piTui.Input();
    this.searchInput.onSubmit = () => {
      this.handleEnter();
    };
    this.addChild(this.searchInput);
    this.addChild(new piTui.Spacer(1));
    this.listContainer = new piTui.Container();
    this.addChild(this.listContainer);
    this.updateList();
  }
  handleInput(keyData) {
    const kb = piTui.getEditorKeybindings();
    const totalItems = this.filteredModels.length;
    if (keyData === "	") {
      this.focusedMemberIndex = (this.focusedMemberIndex + 1) % this.members.length;
      this.searchInput.setValue("");
      this.filteredModels = this.allModels;
      this.selectedIndex = 0;
      this.rebuildUI();
      this.tui.requestRender();
    } else if (keyData === "\x1B[Z") {
      this.focusedMemberIndex = (this.focusedMemberIndex - 1 + this.members.length) % this.members.length;
      this.searchInput.setValue("");
      this.filteredModels = this.allModels;
      this.selectedIndex = 0;
      this.rebuildUI();
      this.tui.requestRender();
    } else if (kb.matches(keyData, "selectUp")) {
      if (totalItems === 0) return;
      this.selectedIndex = this.selectedIndex === 0 ? totalItems - 1 : this.selectedIndex - 1;
      this.updateList();
      this.tui.requestRender();
    } else if (kb.matches(keyData, "selectDown")) {
      if (totalItems === 0) return;
      this.selectedIndex = this.selectedIndex === totalItems - 1 ? 0 : this.selectedIndex + 1;
      this.updateList();
      this.tui.requestRender();
    } else if (kb.matches(keyData, "selectConfirm")) {
      this.handleEnter();
    } else if (kb.matches(keyData, "selectCancel")) {
      this.onCancelCallback();
    } else {
      this.searchInput.handleInput(keyData);
      this.filterModels(this.searchInput.getValue());
      this.tui.requestRender();
    }
  }
};

// src/tui/handlers/prompts.ts
function processNextInlineQuestion(state) {
  const next = state.pendingInlineQuestions.shift();
  if (next) {
    next();
  }
}
async function handleAskQuestion(ctx, questionId, question, options) {
  const { state } = ctx;
  return new Promise((resolve3) => {
    if (state.options.inlineQuestions) {
      const askUserComponent = state.lastAskUserComponent;
      const activate = () => {
        try {
          let questionComponent;
          if (askUserComponent) {
            askUserComponent.activate({
              question,
              options,
              onSubmit: (answer) => {
                state.activeInlineQuestion = void 0;
                state.harness.respondToQuestion({ questionId, answer });
                resolve3();
                processNextInlineQuestion(state);
              },
              onCancel: () => {
                state.activeInlineQuestion = void 0;
                state.harness.respondToQuestion({ questionId, answer: "(skipped)" });
                resolve3();
                processNextInlineQuestion(state);
              }
            });
            questionComponent = askUserComponent;
          } else {
            questionComponent = new AskQuestionInlineComponent(
              {
                question,
                options,
                onSubmit: (answer) => {
                  state.activeInlineQuestion = void 0;
                  state.harness.respondToQuestion({ questionId, answer });
                  resolve3();
                  processNextInlineQuestion(state);
                },
                onCancel: () => {
                  state.activeInlineQuestion = void 0;
                  state.harness.respondToQuestion({ questionId, answer: "(skipped)" });
                  resolve3();
                  processNextInlineQuestion(state);
                }
              },
              state.ui
            );
            state.chatContainer.addChild(questionComponent);
          }
          state.activeInlineQuestion = questionComponent;
          state.ui.requestRender();
          state.chatContainer.invalidate();
          questionComponent.focused = true;
        } catch {
          state.activeInlineQuestion = void 0;
          state.harness.respondToQuestion({ questionId, answer: "(skipped)" });
          resolve3();
          processNextInlineQuestion(state);
        }
      };
      if (state.activeInlineQuestion) {
        state.pendingInlineQuestions.push(activate);
      } else {
        activate();
      }
    } else {
      const dialog = new AskQuestionDialogComponent({
        question,
        options,
        onSubmit: (answer) => {
          state.ui.hideOverlay();
          state.harness.respondToQuestion({ questionId, answer });
          resolve3();
        },
        onCancel: () => {
          state.ui.hideOverlay();
          state.harness.respondToQuestion({ questionId, answer: "(skipped)" });
          resolve3();
        }
      });
      state.ui.showOverlay(dialog, { width: "70%", anchor: "center" });
      dialog.focused = true;
    }
    ctx.notify("ask_question", question);
  });
}
async function handleSandboxAccessRequest(ctx, questionId, requestedPath, reason) {
  const { state } = ctx;
  return new Promise((resolve3) => {
    const activate = () => {
      const questionComponent = new AskQuestionInlineComponent(
        {
          question: `Grant sandbox access to "${requestedPath}"?
${chunkWOKNPWRC_cjs.theme.fg("dim", `Reason: ${reason}`)}`,
          options: [
            { label: "Yes", description: "Allow access to this directory" },
            { label: "No", description: "Deny access" }
          ],
          onSubmit: (answer) => {
            state.activeInlineQuestion = void 0;
            state.harness.respondToQuestion({ questionId, answer });
            resolve3();
            processNextInlineQuestion(state);
          },
          onCancel: () => {
            state.activeInlineQuestion = void 0;
            state.harness.respondToQuestion({ questionId, answer: "No" });
            resolve3();
            processNextInlineQuestion(state);
          },
          formatResult: (answer) => {
            const approved = answer.toLowerCase().startsWith("y");
            return approved ? `Granted access to ${requestedPath}` : `Denied access to ${requestedPath}`;
          },
          isNegativeAnswer: (answer) => !answer.toLowerCase().startsWith("y")
        },
        state.ui
      );
      state.activeInlineQuestion = questionComponent;
      state.chatContainer.addChild(questionComponent);
      questionComponent.focused = true;
      state.ui.requestRender();
      state.chatContainer.invalidate();
    };
    if (state.activeInlineQuestion) {
      state.pendingInlineQuestions.push(activate);
    } else {
      activate();
    }
    ctx.notify("sandbox_access", `Sandbox access requested: ${requestedPath}`);
  });
}
async function handlePlanApproval(ctx, planId, title, plan) {
  const { state } = ctx;
  return new Promise((resolve3) => {
    const approvalComponent = new PlanApprovalInlineComponent(
      {
        planId,
        title,
        plan,
        onApprove: async () => {
          state.activeInlinePlanApproval = void 0;
          await state.harness.setState({
            activePlan: {
              title,
              plan,
              approvedAt: (/* @__PURE__ */ new Date()).toISOString()
            }
          });
          savePlanToDisk({
            title,
            plan,
            resourceId: state.harness.getResourceId()
          }).catch(() => {
          });
          await state.harness.respondToPlanApproval({
            planId,
            response: { action: "approved" }
          });
          setTimeout(() => {
            const reminderText = "<system-reminder>The user has approved the plan, begin executing.</system-reminder>";
            ctx.addUserMessage({
              id: `system-${Date.now()}`,
              role: "user",
              content: [{ type: "text", text: reminderText }],
              createdAt: /* @__PURE__ */ new Date()
            });
            ctx.fireMessage(reminderText);
          }, 50);
          resolve3();
        },
        onReject: async (feedback) => {
          state.activeInlinePlanApproval = void 0;
          await state.harness.respondToPlanApproval({
            planId,
            response: { action: "rejected", feedback }
          });
          resolve3();
        }
      },
      state.ui
    );
    state.activeInlinePlanApproval = approvalComponent;
    if (state.lastSubmitPlanComponent) {
      const children = [...state.chatContainer.children];
      const submitPlanIndex = children.indexOf(state.lastSubmitPlanComponent);
      if (submitPlanIndex >= 0) {
        state.chatContainer.clear();
        for (let i = 0; i <= submitPlanIndex; i++) {
          state.chatContainer.addChild(children[i]);
        }
        state.chatContainer.addChild(approvalComponent);
        for (let i = submitPlanIndex + 1; i < children.length; i++) {
          state.chatContainer.addChild(children[i]);
        }
      } else {
        state.chatContainer.addChild(approvalComponent);
      }
    } else {
      state.chatContainer.addChild(approvalComponent);
    }
    state.ui.requestRender();
    state.chatContainer.invalidate();
    approvalComponent.focused = true;
    ctx.notify("plan_approval", `Plan "${title}" requires approval`);
  });
}
async function handleTeamModelSelect(ctx, questionId, teamName, members, availableModels) {
  const { state } = ctx;
  return new Promise((resolve3) => {
    const picker = new TeamModelPickerComponent({
      tui: state.ui,
      members,
      availableModels: availableModels.map((m) => ({
        ...m,
        useCount: 0
      })),
      onSelect: (selections) => {
        state.ui.hideOverlay();
        state.harness.respondToQuestion({ questionId, answer: JSON.stringify(selections) });
        resolve3();
      },
      onCancel: () => {
        state.ui.hideOverlay();
        state.harness.respondToQuestion({ questionId, answer: "{}" });
        resolve3();
      }
    });
    state.ui.showOverlay(picker, { width: "70%", anchor: "center" });
    picker.focused = true;
    ctx.notify("ask_question", `Select models for team "${teamName}"`);
  });
}
var MAX_ACTIVITY_LINES = 15;
var COLLAPSED_LINES2 = 15;
var SubagentExecutionComponent = class extends piTui.Container {
  ui;
  // State
  agentType;
  task;
  modelId;
  toolCalls = [];
  done = false;
  isError = false;
  startTime = Date.now();
  durationMs = 0;
  finalResult;
  expanded = false;
  collapseOnComplete;
  constructor(agentType, task, ui, modelId, options) {
    super();
    this.agentType = agentType;
    this.task = task;
    this.modelId = modelId;
    this.ui = ui;
    this.collapseOnComplete = options?.collapseOnComplete ?? false;
    this.rebuild();
  }
  // ── Mutation API ──────────────────────────────────────────────────────
  addToolStart(name, args) {
    this.toolCalls.push({ name, args, done: false });
    this.rebuild();
  }
  addToolEnd(name, result, isError) {
    for (let i = this.toolCalls.length - 1; i >= 0; i--) {
      const toolCall = this.toolCalls[i];
      if (toolCall.name === name && !toolCall.done) {
        toolCall.done = true;
        toolCall.isError = isError;
        toolCall.result = typeof result === "string" ? result : utils.safeStringify(result ?? "");
        break;
      }
    }
    this.rebuild();
  }
  finish(isError, durationMs, result) {
    this.done = true;
    this.isError = isError;
    this.durationMs = durationMs;
    this.finalResult = result;
    if (this.collapseOnComplete) {
      this.expanded = false;
    }
    this.rebuild();
  }
  setExpanded(expanded) {
    this.expanded = expanded;
    this.rebuild();
  }
  toggleExpanded() {
    this.expanded = !this.expanded;
    this.rebuild();
  }
  // IToolExecutionComponent interface methods
  updateArgs(_args) {
  }
  updateResult(_result, _isPartial) {
  }
  // ── Rendering ──────────────────────────────────────────────────────────
  rebuild() {
    this.clear();
    const border = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", char));
    const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
    const maxLineWidth = termWidth - 6 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
    const typeLabel = chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", this.agentType));
    const modelLabel = this.modelId ? chunkWOKNPWRC_cjs.theme.fg("muted", ` ${this.modelId}`) : "";
    const statusIcon = this.done ? this.isError ? chunkWOKNPWRC_cjs.theme.fg("error", " \u2717") : chunkWOKNPWRC_cjs.theme.fg("success", " \u2713") : chunkWOKNPWRC_cjs.theme.fg("muted", " \u22EF");
    const durationStr = this.done ? chunkWOKNPWRC_cjs.theme.fg("muted", ` ${formatDuration(this.durationMs)}`) : "";
    const footerText = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "subagent"))} ${typeLabel}${modelLabel}${durationStr}${statusIcon}`;
    if (this.collapseOnComplete && this.done && !this.expanded) {
      this.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      this.invalidate();
      this.ui.requestRender();
      return;
    }
    this.addChild(new piTui.Text(border("\u256D\u2500\u2500"), chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    const taskLines = this.task.split("\n");
    const wrappedTaskLines = [];
    for (const line of taskLines) {
      if (line.length > maxLineWidth) {
        let remaining = line;
        while (remaining.length > maxLineWidth) {
          const breakAt = remaining.lastIndexOf(" ", maxLineWidth);
          const splitAt = breakAt > 0 ? breakAt : maxLineWidth;
          wrappedTaskLines.push(remaining.slice(0, splitAt));
          remaining = remaining.slice(splitAt).trimStart();
        }
        if (remaining) wrappedTaskLines.push(remaining);
      } else {
        wrappedTaskLines.push(line);
      }
    }
    const maxTaskLines = 5;
    const taskTruncated = !this.expanded && wrappedTaskLines.length > maxTaskLines + 1;
    const displayTaskLines = taskTruncated ? wrappedTaskLines.slice(0, maxTaskLines) : wrappedTaskLines;
    const taskContent = displayTaskLines.map((line) => `${border("\u2502")} ${line}`).join("\n");
    this.addChild(new piTui.Text(taskContent, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    if (taskTruncated) {
      const moreText = chunkWOKNPWRC_cjs.theme.fg("muted", `... ${wrappedTaskLines.length - maxTaskLines} more lines (ctrl+e to expand)`);
      this.addChild(new piTui.Text(`${border("\u2502")} ${moreText}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    }
    if (this.toolCalls.length > 0) {
      this.addChild(new piTui.Text(`${border("\u2502")} ${chunkWOKNPWRC_cjs.theme.fg("muted", "\u2500\u2500\u2500")}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      const activityLines = this.toolCalls.map((tc) => formatToolCallLine(tc));
      const cap = this.done ? COLLAPSED_LINES2 : MAX_ACTIVITY_LINES;
      let displayLines = activityLines;
      let hiddenCount = 0;
      const minHidden = this.done ? 2 : 1;
      if (!this.expanded && activityLines.length > cap + minHidden - 1) {
        hiddenCount = activityLines.length - cap;
        if (this.done) {
          displayLines = activityLines.slice(0, cap);
        } else {
          displayLines = activityLines.slice(-cap);
        }
      }
      if (!this.done && hiddenCount > 0) {
        const hiddenText = chunkWOKNPWRC_cjs.theme.fg("muted", `  ... ${hiddenCount} more above`);
        this.addChild(new piTui.Text(`${border("\u2502")} ${hiddenText}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      }
      const activityContent = displayLines.map((line) => `${border("\u2502")} ${line}`).join("\n");
      this.addChild(new piTui.Text(activityContent, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      if (this.done && hiddenCount > 0) {
        const moreText = chunkWOKNPWRC_cjs.theme.fg("muted", `... ${hiddenCount} more (ctrl+e to expand)`);
        this.addChild(new piTui.Text(`${border("\u2502")} ${moreText}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      }
    }
    if (this.done && this.finalResult && this.expanded) {
      this.addChild(new piTui.Text(`${border("\u2502")} ${chunkWOKNPWRC_cjs.theme.fg("muted", "\u2500\u2500\u2500")}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      const resultLines = this.finalResult.split("\n");
      const resultContent = resultLines.map((line) => {
        const truncatedLine = line.length > maxLineWidth ? line.slice(0, maxLineWidth - 1) + "\u2026" : line;
        return `${border("\u2502")} ${chunkWOKNPWRC_cjs.theme.fg("muted", truncatedLine)}`;
      }).join("\n");
      if (resultContent.trim()) {
        this.addChild(new piTui.Text(resultContent, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      }
    }
    this.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    this.addChild(new piTui.Spacer(1));
    this.invalidate();
    this.ui.requestRender();
  }
};
function formatToolCallLine(tc, _maxWidth) {
  const icon = tc.done ? tc.isError ? chunkWOKNPWRC_cjs.theme.fg("error", "\u2717") : chunkWOKNPWRC_cjs.theme.fg("success", "\u2713") : chunkWOKNPWRC_cjs.theme.fg("muted", "\u22EF");
  const name = chunkWOKNPWRC_cjs.theme.fg("toolTitle", tc.name);
  const argsSummary = summarizeArgs(tc.args);
  return `${icon} ${name} ${argsSummary}`;
}
function formatDuration(ms) {
  if (ms < 1e3) return `${ms}ms`;
  const s = (ms / 1e3).toFixed(1);
  return `${s}s`;
}
function summarizeArgs(args) {
  if (!args || typeof args !== "object") return "";
  const obj = args;
  const parts = [];
  if (obj.tasks && Array.isArray(obj.tasks)) {
    const tasks = obj.tasks;
    const taskSummaries = tasks.map((t) => {
      const icon = t.status === "completed" ? "\u2713" : t.status === "in_progress" ? "\u2192" : "\u25CB";
      const content = t.content || t.activeForm || "task";
      return `${icon} ${content}`;
    });
    return chunkWOKNPWRC_cjs.theme.fg("muted", taskSummaries.join(", "));
  }
  for (const [_key, val] of Object.entries(obj)) {
    if (typeof val === "string") {
      const short = val.length > 40 ? val.slice(0, 40) + "\u2026" : val;
      parts.push(chunkWOKNPWRC_cjs.theme.fg("muted", short));
    } else if (Array.isArray(val)) {
      parts.push(chunkWOKNPWRC_cjs.theme.fg("muted", `${val.length} items`));
    } else if (typeof val === "object" && val !== null) {
      parts.push(chunkWOKNPWRC_cjs.theme.fg("muted", "{...}"));
    }
  }
  return parts.join(" ");
}

// src/tui/handlers/subagent.ts
function handleSubagentStart(ctx, toolCallId, agentType, task, modelId) {
  const { state } = ctx;
  const component = new SubagentExecutionComponent(agentType, task, state.ui, modelId, {
    collapseOnComplete: state.quietMode
  });
  state.pendingSubagents.set(toolCallId, component);
  state.allToolComponents.push(component);
  if (state.streamingComponent) {
    const idx = state.chatContainer.children.indexOf(state.streamingComponent);
    if (idx >= 0) {
      state.chatContainer.children.splice(idx, 0, component);
      state.chatContainer.invalidate();
    } else {
      state.chatContainer.addChild(component);
    }
  } else {
    state.chatContainer.addChild(component);
  }
  state.ui.requestRender();
}
function handleSubagentToolStart(ctx, toolCallId, subToolName, subToolArgs) {
  const component = ctx.state.pendingSubagents.get(toolCallId);
  if (component) {
    component.addToolStart(subToolName, subToolArgs);
    ctx.state.ui.requestRender();
  }
}
function handleSubagentToolEnd(ctx, toolCallId, subToolName, subToolResult, isError) {
  const component = ctx.state.pendingSubagents.get(toolCallId);
  if (component) {
    component.addToolEnd(subToolName, subToolResult, isError);
    ctx.state.ui.requestRender();
  }
}
function handleSubagentEnd(ctx, toolCallId, isError, durationMs, result) {
  const component = ctx.state.pendingSubagents.get(toolCallId);
  if (component) {
    component.finish(isError, durationMs, result);
    ctx.state.pendingSubagents.delete(toolCallId);
    ctx.state.ui.requestRender();
  }
}
var MAX_MESSAGES = 20;
var MAX_ACTIVITY_LINES2 = 15;
var TeamActivityComponent = class extends piTui.Container {
  ui;
  // Team info
  teamId;
  task;
  startTime = Date.now();
  done = false;
  durationMs = 0;
  // Members keyed by id
  members = /* @__PURE__ */ new Map();
  memberOrder = [];
  // preserves insertion order
  // Inter-member messages
  messages = [];
  // Focus
  focus = "overview";
  // Expand
  expanded = false;
  constructor(teamId, task, ui) {
    super();
    this.teamId = teamId;
    this.task = task;
    this.ui = ui;
    this.rebuild();
  }
  // ── Mutation API ──────────────────────────────────────────────────────
  addMember(memberId, name, modelId) {
    if (!this.members.has(memberId)) {
      this.memberOrder.push(memberId);
    }
    this.members.set(memberId, {
      id: memberId,
      name,
      modelId,
      status: "running",
      text: "",
      toolCalls: []
    });
    this.rebuild();
  }
  appendTextDelta(memberId, delta) {
    const m = this.members.get(memberId);
    if (m) {
      m.text += delta;
      if (this.focus === memberId) {
        this.rebuild();
      }
    }
  }
  addToolCall(memberId, toolName, args) {
    const m = this.members.get(memberId);
    if (m) {
      m.toolCalls.push({ name: toolName, args, done: false });
      this.rebuild();
    }
  }
  addToolResult(memberId, toolName, result, isError) {
    const m = this.members.get(memberId);
    if (m) {
      for (let i = m.toolCalls.length - 1; i >= 0; i--) {
        const tc = m.toolCalls[i];
        if (tc.name === toolName && !tc.done) {
          tc.done = true;
          tc.result = result;
          tc.isError = isError;
          break;
        }
      }
      this.rebuild();
    }
  }
  addMessage(from, to, content) {
    this.messages.push({ from, to, content });
    if (this.messages.length > MAX_MESSAGES) {
      this.messages.shift();
    }
    this.rebuild();
  }
  finishMember(memberId, isError, durationMs) {
    const m = this.members.get(memberId);
    if (m) {
      m.status = isError ? "error" : "done";
      m.durationMs = durationMs;
      this.rebuild();
    }
  }
  finish(_results) {
    this.done = true;
    this.durationMs = Date.now() - this.startTime;
    this.rebuild();
  }
  setExpanded(expanded) {
    this.expanded = expanded;
    this.rebuild();
  }
  /** Cycle focus: overview → member1 → member2 → … → overview */
  focusNextMember() {
    if (this.focus === "overview") {
      this.focus = this.memberOrder[0] ?? "overview";
    } else {
      const idx = this.memberOrder.indexOf(this.focus);
      if (idx >= 0 && idx < this.memberOrder.length - 1) {
        this.focus = this.memberOrder[idx + 1];
      } else {
        this.focus = "overview";
      }
    }
    this.rebuild();
  }
  get isDone() {
    return this.done;
  }
  // ── Rendering ──────────────────────────────────────────────────────────
  rebuild() {
    this.clear();
    const b = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", char));
    const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
    const maxLineWidth = termWidth - 6 - chunkWOKNPWRC_cjs.BOX_INDENT * 2;
    const teamLabel = chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "team"));
    const durationStr = this.done ? chunkWOKNPWRC_cjs.theme.fg("muted", ` ${formatDuration2(this.durationMs)}`) : "";
    const statusIcon = this.done ? this.anyError() ? chunkWOKNPWRC_cjs.theme.fg("error", " \u2717") : chunkWOKNPWRC_cjs.theme.fg("success", " \u2713") : chunkWOKNPWRC_cjs.theme.fg("muted", " \u22EF");
    const focusLabel = this.focus !== "overview" ? chunkWOKNPWRC_cjs.theme.fg("muted", ` [${this.getMemberName(this.focus)}]`) : "";
    const footerText = `${teamLabel} ${chunkWOKNPWRC_cjs.theme.fg("accent", this.teamId)}${durationStr}${statusIcon}${focusLabel}`;
    if (this.done && !this.expanded) {
      const summary = this.buildMemberSummary();
      this.addChild(new piTui.Text(`${b("\u2570\u2500\u2500")} ${footerText}  ${summary}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      this.invalidate();
      this.ui.requestRender();
      return;
    }
    this.addChild(new piTui.Text(b("\u256D\u2500\u2500"), chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    const taskPreview = this.task.length > maxLineWidth ? this.task.slice(0, maxLineWidth - 1) + "\u2026" : this.task;
    this.addChild(new piTui.Text(`${b("\u2502")} ${chunkWOKNPWRC_cjs.theme.fg("muted", taskPreview)}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    if (this.focus !== "overview") {
      this.renderMemberDetail(b, maxLineWidth);
    } else {
      this.renderOverview(b, maxLineWidth);
    }
    this.addChild(new piTui.Text(`${b("\u2570\u2500\u2500")} ${footerText}  ${chunkWOKNPWRC_cjs.theme.fg("muted", "(ctrl+t to focus)")}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    this.addChild(new piTui.Spacer(1));
    this.invalidate();
    this.ui.requestRender();
  }
  renderOverview(b, _maxLineWidth) {
    this.addChild(new piTui.Text(`${b("\u2502")} ${chunkWOKNPWRC_cjs.theme.fg("muted", "\u2500\u2500\u2500 members \u2500\u2500\u2500")}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    for (const id of this.memberOrder) {
      const m = this.members.get(id);
      if (!m) continue;
      const icon = m.status === "done" ? chunkWOKNPWRC_cjs.theme.fg("success", "\u2713") : m.status === "error" ? chunkWOKNPWRC_cjs.theme.fg("error", "\u2717") : chunkWOKNPWRC_cjs.theme.fg("muted", "\u22EF");
      const modelLabel = m.modelId ? chunkWOKNPWRC_cjs.theme.fg("muted", ` (${shortModel(m.modelId)})`) : "";
      const durLabel = m.durationMs != null ? chunkWOKNPWRC_cjs.theme.fg("muted", ` ${formatDuration2(m.durationMs)}`) : "";
      const toolLabel = m.toolCalls.length > 0 ? chunkWOKNPWRC_cjs.theme.fg("muted", ` [${m.toolCalls.length} tools]`) : "";
      const line = `${icon} ${chunkWOKNPWRC_cjs.theme.bold(m.name)}${modelLabel}${durLabel}${toolLabel}`;
      this.addChild(new piTui.Text(`${b("\u2502")} ${line}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    }
    if (this.messages.length > 0) {
      this.addChild(new piTui.Text(`${b("\u2502")} ${chunkWOKNPWRC_cjs.theme.fg("muted", "\u2500\u2500\u2500 messages \u2500\u2500\u2500")}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      const visibleMessages = this.expanded ? this.messages : this.messages.slice(-5);
      for (const msg of visibleMessages) {
        const toLabel = msg.to === "__broadcast__" ? "all" : msg.to;
        const headerLine = `${chunkWOKNPWRC_cjs.theme.fg("muted", `${msg.from} \u2192 ${toLabel}:`)}`;
        const contentLines = msg.content.split("\n");
        const firstContent = contentLines[0].length > _maxLineWidth - 20 ? contentLines[0].slice(0, _maxLineWidth - 21) + "\u2026" : contentLines[0];
        this.addChild(new piTui.Text(`${b("\u2502")} ${headerLine} ${firstContent}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
        for (let i = 1; i < contentLines.length; i++) {
          const cl = contentLines[i].length > _maxLineWidth - 4 ? contentLines[i].slice(0, _maxLineWidth - 5) + "\u2026" : contentLines[i];
          if (cl.trim()) {
            this.addChild(new piTui.Text(`${b("\u2502")}   ${cl}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
          }
        }
      }
    }
  }
  renderMemberDetail(b, maxLineWidth) {
    const m = this.members.get(this.focus);
    if (!m) {
      this.focus = "overview";
      this.rebuild();
      return;
    }
    const modelLabel = m.modelId ? chunkWOKNPWRC_cjs.theme.fg("muted", ` (${shortModel(m.modelId)})`) : "";
    this.addChild(new piTui.Text(`${b("\u2502")} ${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", m.name))}${modelLabel}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    if (m.toolCalls.length > 0) {
      this.addChild(new piTui.Text(`${b("\u2502")} ${chunkWOKNPWRC_cjs.theme.fg("muted", "\u2500\u2500\u2500")}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      const activityLines = m.toolCalls.map((tc) => formatToolCallLine2(tc));
      const cap = MAX_ACTIVITY_LINES2;
      let displayLines = activityLines;
      let hiddenCount = 0;
      if (!this.expanded && activityLines.length > cap + 1) {
        hiddenCount = activityLines.length - cap;
        displayLines = activityLines.slice(-cap);
      }
      if (hiddenCount > 0) {
        this.addChild(new piTui.Text(`${b("\u2502")} ${chunkWOKNPWRC_cjs.theme.fg("muted", `  ... ${hiddenCount} more above`)}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      }
      const activityContent = displayLines.map((line) => `${b("\u2502")} ${line}`).join("\n");
      this.addChild(new piTui.Text(activityContent, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
    }
    if (m.text) {
      this.addChild(new piTui.Text(`${b("\u2502")} ${chunkWOKNPWRC_cjs.theme.fg("muted", "\u2500\u2500\u2500 output \u2500\u2500\u2500")}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      const rawLines = m.text.split("\n");
      const wrappedLines = [];
      const innerWidth = maxLineWidth - 4;
      for (const line of rawLines) {
        if (line.length > innerWidth) {
          let remaining = line;
          while (remaining.length > innerWidth) {
            const breakAt = remaining.lastIndexOf(" ", innerWidth);
            const splitAt = breakAt > 0 ? breakAt : innerWidth;
            wrappedLines.push(remaining.slice(0, splitAt));
            remaining = remaining.slice(splitAt).trimStart();
          }
          if (remaining) wrappedLines.push(remaining);
        } else {
          wrappedLines.push(line);
        }
      }
      const visibleLines = this.expanded ? wrappedLines : wrappedLines.slice(-MAX_ACTIVITY_LINES2);
      if (!this.expanded && wrappedLines.length > MAX_ACTIVITY_LINES2) {
        this.addChild(new piTui.Text(`${b("\u2502")} ${chunkWOKNPWRC_cjs.theme.fg("muted", `... ${wrappedLines.length - MAX_ACTIVITY_LINES2} lines above`)}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      }
      const textContent = visibleLines.map((line) => `${b("\u2502")} ${line}`).join("\n");
      if (textContent.trim()) {
        this.addChild(new piTui.Text(textContent, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
      }
    }
  }
  buildMemberSummary() {
    const parts = [];
    for (const id of this.memberOrder) {
      const m = this.members.get(id);
      if (!m) continue;
      const icon = m.status === "done" ? "\u2713" : m.status === "error" ? "\u2717" : "\u22EF";
      parts.push(`${icon}${m.name}`);
    }
    return chunkWOKNPWRC_cjs.theme.fg("muted", parts.join(" "));
  }
  anyError() {
    for (const m of this.members.values()) {
      if (m.status === "error") return true;
    }
    return false;
  }
  getMemberName(id) {
    return this.members.get(id)?.name ?? id;
  }
};
function formatToolCallLine2(tc, _maxWidth) {
  const icon = tc.done ? tc.isError ? chunkWOKNPWRC_cjs.theme.fg("error", "\u2717") : chunkWOKNPWRC_cjs.theme.fg("success", "\u2713") : chunkWOKNPWRC_cjs.theme.fg("muted", "\u22EF");
  const name = chunkWOKNPWRC_cjs.theme.fg("toolTitle", tc.name);
  const argsSummary = summarizeArgs2(tc.args);
  return `${icon} ${name} ${argsSummary}`;
}
function formatDuration2(ms) {
  if (ms < 1e3) return `${ms}ms`;
  const s = (ms / 1e3).toFixed(1);
  return `${s}s`;
}
function shortModel(modelId) {
  return modelId.replace(/claude-3[-_]5[-_]/, "claude-3.5-").replace(/-20\d{6}$/, "").replace(/^anthropic\//, "").replace(/^openai\//, "").slice(0, 30);
}
function summarizeArgs2(args) {
  if (!args || typeof args !== "object") return "";
  const obj = args;
  const parts = [];
  if (obj.tasks && Array.isArray(obj.tasks)) {
    const tasks = obj.tasks;
    const taskSummaries = tasks.map((t) => {
      const icon = t.status === "completed" ? "\u2713" : t.status === "in_progress" ? "\u2192" : "\u25CB";
      const content = t.content || t.activeForm || "task";
      return `${icon} ${content}`;
    });
    return chunkWOKNPWRC_cjs.theme.fg("muted", taskSummaries.join(", "));
  }
  for (const [_key, val] of Object.entries(obj)) {
    if (typeof val === "string") {
      const short = val.length > 40 ? val.slice(0, 40) + "\u2026" : val;
      parts.push(chunkWOKNPWRC_cjs.theme.fg("muted", short));
    } else if (Array.isArray(val)) {
      parts.push(chunkWOKNPWRC_cjs.theme.fg("muted", `${val.length} items`));
    } else if (typeof val === "object" && val !== null) {
      parts.push(chunkWOKNPWRC_cjs.theme.fg("muted", "{...}"));
    }
  }
  return parts.join(" ");
}

// src/tui/handlers/team.ts
function handleTeamStart(ctx, teamId, task) {
  const { state } = ctx;
  const component = new TeamActivityComponent(teamId, task, state.ui);
  state.pendingTeams.set(teamId, component);
  state.activeTeamId = teamId;
  state.allToolComponents.push(component);
  if (state.streamingComponent) {
    const idx = state.chatContainer.children.indexOf(state.streamingComponent);
    if (idx >= 0) {
      state.chatContainer.children.splice(idx, 0, component);
      state.chatContainer.invalidate();
    } else {
      state.chatContainer.addChild(component);
    }
  } else {
    state.chatContainer.addChild(component);
  }
  state.ui.requestRender();
}
function handleTeamMemberStart(ctx, teamId, memberId, name, modelId) {
  const component = ctx.state.pendingTeams.get(teamId);
  if (component) {
    component.addMember(memberId, name, modelId);
    ctx.state.ui.requestRender();
  }
}
function handleTeamMemberTextDelta(ctx, teamId, memberId, textDelta) {
  const component = ctx.state.pendingTeams.get(teamId);
  if (component) {
    component.appendTextDelta(memberId, textDelta);
    ctx.state.ui.requestRender();
  }
}
function handleTeamMemberToolCall(ctx, teamId, memberId, toolName, toolArgs) {
  const component = ctx.state.pendingTeams.get(teamId);
  if (component) {
    component.addToolCall(memberId, toolName, toolArgs);
    ctx.state.ui.requestRender();
  }
}
function handleTeamMemberToolResult(ctx, teamId, memberId, toolName, result, isError) {
  const component = ctx.state.pendingTeams.get(teamId);
  if (component) {
    component.addToolResult(memberId, toolName, result, isError);
    ctx.state.ui.requestRender();
  }
}
function handleTeamMessageSent(ctx, teamId, from, to, content) {
  const component = ctx.state.pendingTeams.get(teamId);
  if (component) {
    component.addMessage(from, to, content);
    ctx.state.ui.requestRender();
  }
}
function handleTeamMemberEnd(ctx, teamId, memberId, _result, isError) {
  const component = ctx.state.pendingTeams.get(teamId);
  if (component) {
    component.finishMember(memberId, isError, Date.now());
    ctx.state.ui.requestRender();
  }
}
function handleTeamEnd(ctx, teamId, results) {
  const component = ctx.state.pendingTeams.get(teamId);
  if (component) {
    component.finish(results);
    ctx.state.ui.requestRender();
  }
}
var ToolApprovalDialogComponent = class extends piTui.Box {
  toolName;
  args;
  categoryLabel;
  onAction;
  // Focusable implementation
  _focused = false;
  get focused() {
    return this._focused;
  }
  set focused(value) {
    this._focused = value;
  }
  constructor(options) {
    super(2, 1, (text) => chunkWOKNPWRC_cjs.theme.bg("overlayBg", text));
    this.toolName = options.toolName;
    this.args = options.args;
    this.categoryLabel = options.categoryLabel;
    this.onAction = options.onAction;
    this.buildUI();
  }
  buildUI() {
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("warning", "\u26A0 Tool Approval Required"), 0, 0));
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("accent", `Tool: `) + chunkWOKNPWRC_cjs.theme.fg("text", this.toolName), 0, 0));
    if (this.categoryLabel) {
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("accent", `Category: `) + chunkWOKNPWRC_cjs.theme.fg("text", this.categoryLabel), 0, 0));
    }
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "Arguments:"), 0, 0));
    const argsText = this.formatArgs(this.args);
    for (const line of argsText.split("\n").slice(0, 10)) {
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", "  " + line), 0, 0));
    }
    if (argsText.split("\n").length > 10) {
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "  ... (truncated)"), 0, 0));
    }
    this.addChild(new piTui.Spacer(1));
    const categoryHint = this.categoryLabel ? `lways allow ${this.categoryLabel.toLowerCase()}` : "lways allow category";
    const dimColor = chalk8__default.default.hex(chunkWOKNPWRC_cjs.theme.getTheme().dim);
    const key = chalk8__default.default.hex(chunkWOKNPWRC_cjs.theme.getTheme().text).bold;
    this.addChild(
      new piTui.Text(
        chunkWOKNPWRC_cjs.theme.fg("accent", "Allow? ") + key("y") + dimColor("es  ") + key("n") + dimColor("o  ") + key("a") + dimColor(categoryHint + "  ") + key("Y") + dimColor("olo"),
        0,
        0
      )
    );
  }
  formatArgs(args) {
    if (args === null || args === void 0) {
      return "(none)";
    }
    if (typeof args !== "object") {
      return String(args);
    }
    const entries = Object.entries(args);
    if (entries.length === 0) return "(none)";
    const lines = [];
    for (const [key, value] of entries) {
      let str;
      if (typeof value === "string") {
        str = value;
      } else {
        str = utils.safeStringify(value);
      }
      const maxLen = 120;
      const firstLine = str.split("\n")[0] ?? "";
      const lineCount = typeof value === "string" ? str.split("\n").length : 0;
      const suffix = lineCount > 1 ? ` (${lineCount} lines)` : "";
      const display = firstLine.length > maxLen ? firstLine.slice(0, maxLen) + "\u2026" : firstLine;
      lines.push(`${key}: ${display}${suffix}`);
    }
    return lines.join("\n");
  }
  handleInput(data) {
    const kb = piTui.getEditorKeybindings();
    if (kb.matches(data, "selectCancel")) {
      this.onAction({ type: "decline" });
      return;
    }
    if (data === "y") {
      this.onAction({ type: "approve" });
    } else if (data === "n") {
      this.onAction({ type: "decline" });
    } else if (data === "a") {
      this.onAction({ type: "always_allow_category" });
    } else if (data === "Y") {
      this.onAction({ type: "yolo" });
    }
  }
  render(maxWidth) {
    return super.render(maxWidth);
  }
};

// src/tui/handlers/tool.ts
function formatToolResult(result) {
  if (result === null || result === void 0) {
    return "";
  }
  if (typeof result === "string") {
    return result;
  }
  if (typeof result === "object") {
    const obj = result;
    if ("content" in obj && typeof obj.content === "string") {
      return obj.content;
    }
    if ("content" in obj && Array.isArray(obj.content)) {
      const textParts = obj.content.filter(
        (part) => typeof part === "object" && part !== null && part.type === "text"
      ).map((part) => part.text || "");
      if (textParts.length > 0) {
        return textParts.join("\n");
      }
    }
    try {
      return utils.safeStringify(result, 2);
    } catch {
      return String(result);
    }
  }
  return String(result);
}
function handleToolApprovalRequired(ctx, toolCallId, toolName, args) {
  const { state } = ctx;
  const category = chunkOBFBUWOR_cjs.getToolCategory(toolName);
  const categoryLabel = category ? chunkOBFBUWOR_cjs.TOOL_CATEGORIES[category]?.label : void 0;
  ctx.notify("tool_approval", `Approve ${toolName}?`);
  const dialog = new ToolApprovalDialogComponent({
    toolCallId,
    toolName,
    args,
    categoryLabel,
    onAction: (action) => {
      state.ui.hideOverlay();
      state.pendingApprovalDismiss = null;
      if (action.type === "approve") {
        state.harness.respondToToolApproval({ decision: "approve" });
      } else if (action.type === "always_allow_category") {
        state.harness.respondToToolApproval({ decision: "always_allow_category" });
      } else if (action.type === "yolo") {
        state.harness.setState({ yolo: true });
        state.harness.respondToToolApproval({ decision: "approve" });
      } else {
        state.harness.respondToToolApproval({ decision: "decline" });
      }
    }
  });
  state.pendingApprovalDismiss = () => {
    state.ui.hideOverlay();
    state.pendingApprovalDismiss = null;
    state.harness.respondToToolApproval({ decision: "decline" });
  };
  state.ui.showOverlay(dialog, {
    width: "70%",
    anchor: "center"
  });
  dialog.focused = true;
  state.ui.requestRender();
}
function handleToolStart(ctx, toolCallId, toolName, args) {
  const { state } = ctx;
  const existingComponent = state.pendingTools.get(toolCallId);
  if (existingComponent) {
    existingComponent.updateArgs(args);
  } else if (!state.seenToolCallIds.has(toolCallId)) {
    state.seenToolCallIds.add(toolCallId);
    if (toolName === "subagent") {
      return;
    }
    if (toolName === "ask_user") {
      return;
    }
    const component2 = new ToolExecutionComponentEnhanced(
      toolName,
      args,
      { showImages: false, collapsedByDefault: !state.toolOutputExpanded },
      state.ui
    );
    component2.setExpanded(state.toolOutputExpanded);
    ctx.addChildBeforeFollowUps(component2);
    state.pendingTools.set(toolCallId, component2);
    state.allToolComponents.push(component2);
    state.streamingComponent = new AssistantMessageComponent(void 0, state.hideThinkingBlock, chunkWOKNPWRC_cjs.getMarkdownTheme());
    ctx.addChildBeforeFollowUps(state.streamingComponent);
    state.ui.requestRender();
  }
  const component = state.pendingTools.get(toolCallId);
  if (component && toolName === "submit_plan") {
    state.lastSubmitPlanComponent = component;
  }
}
function handleToolUpdate(ctx, toolCallId, partialResult) {
  const { state } = ctx;
  const component = state.pendingTools.get(toolCallId);
  if (component) {
    const result = {
      content: [{ type: "text", text: formatToolResult(partialResult) }],
      isError: false
    };
    component.updateResult(result, true);
    state.ui.requestRender();
  }
}
function handleShellOutput(ctx, toolCallId, output, _stream) {
  const { state } = ctx;
  const component = state.pendingTools.get(toolCallId);
  if (component?.appendStreamingOutput) {
    component.appendStreamingOutput(output);
    state.ui.requestRender();
  }
}
function handleToolInputStart(ctx, toolCallId, toolName) {
  const { state } = ctx;
  if (!state.seenToolCallIds.has(toolCallId)) {
    state.seenToolCallIds.add(toolCallId);
  }
  if (toolName === "ask_user") {
    const askComponent = AskQuestionInlineComponent.createStreaming();
    ctx.addChildBeforeFollowUps(askComponent);
    state.lastAskUserComponent = askComponent;
    state.pendingAskUserComponents.set(toolCallId, askComponent);
    state.streamingComponent = new AssistantMessageComponent(void 0, state.hideThinkingBlock, chunkWOKNPWRC_cjs.getMarkdownTheme());
    ctx.addChildBeforeFollowUps(state.streamingComponent);
    state.ui.requestRender();
  } else if (toolName === "task_write") {
    state.taskWriteInsertIndex = state.chatContainer.children.length;
    state.streamingComponent = new AssistantMessageComponent(void 0, state.hideThinkingBlock, chunkWOKNPWRC_cjs.getMarkdownTheme());
    ctx.addChildBeforeFollowUps(state.streamingComponent);
    state.ui.requestRender();
  } else if (toolName !== "subagent") {
    const component = new ToolExecutionComponentEnhanced(
      toolName,
      {},
      { showImages: false, collapsedByDefault: !state.toolOutputExpanded },
      state.ui
    );
    component.setExpanded(state.toolOutputExpanded);
    ctx.addChildBeforeFollowUps(component);
    state.pendingTools.set(toolCallId, component);
    state.allToolComponents.push(component);
    state.streamingComponent = new AssistantMessageComponent(void 0, state.hideThinkingBlock, chunkWOKNPWRC_cjs.getMarkdownTheme());
    ctx.addChildBeforeFollowUps(state.streamingComponent);
    state.ui.requestRender();
  }
}
function handleToolInputDelta(ctx, toolCallId, _argsTextDelta) {
  const { state } = ctx;
  const ds = state.harness.getDisplayState();
  const buffer = ds.toolInputBuffers.get(toolCallId);
  if (buffer === void 0) return;
  const updatedText = buffer.text;
  try {
    const partialArgs = partialJson.parse(updatedText);
    if (partialArgs && typeof partialArgs === "object") {
      const component = state.pendingTools.get(toolCallId);
      if (component) {
        component.updateArgs(partialArgs);
      }
      if (buffer.toolName === "ask_user") {
        const askComponent = state.pendingAskUserComponents.get(toolCallId);
        if (askComponent) {
          try {
            askComponent.updateArgs(partialArgs);
          } catch {
          }
        }
      }
      if (buffer.toolName === "task_write" && state.taskProgress) {
        const tasks = partialArgs.tasks;
        if (tasks && tasks.length > 0) {
          const existing = state.taskProgress.getTasks();
          const allExistingDone = existing.length === 0 || existing.every((t) => t.status === "completed");
          if (allExistingDone) {
            state.taskProgress.updateTasks(tasks);
          } else if (tasks.length > 1) {
            const merged = [...existing];
            for (const task of tasks.slice(0, -1)) {
              if (!task.content) continue;
              const idx = merged.findIndex((t) => t.content === task.content);
              if (idx >= 0) {
                merged[idx] = task;
              } else {
                merged.push(task);
              }
            }
            state.taskProgress.updateTasks(merged);
          }
        }
      }
      state.ui.requestRender();
    }
  } catch {
  }
}
function handleToolEnd(ctx, toolCallId, result, isError) {
  const { state } = ctx;
  const subagentComponent = state.pendingSubagents.get(toolCallId);
  if (subagentComponent) {
    const resultText = formatToolResult(result);
    subagentComponent._pendingResult = resultText;
  }
  state.pendingAskUserComponents.delete(toolCallId);
  const component = state.pendingTools.get(toolCallId);
  if (component) {
    const toolResult = {
      content: [{ type: "text", text: formatToolResult(result) }],
      isError
    };
    component.updateResult(toolResult, false);
    state.pendingTools.delete(toolCallId);
    state.ui.requestRender();
  }
}

// src/tui/event-dispatch.ts
async function dispatchEvent(event, ectx, state) {
  switch (event.type) {
    case "agent_start":
      handleAgentStart(ectx);
      break;
    case "agent_end":
      if (event.reason === "aborted") {
        handleAgentAborted(ectx);
      } else if (event.reason === "error") {
        handleAgentError(ectx);
      } else {
        handleAgentEnd(ectx);
      }
      break;
    case "message_start":
      handleMessageStart(ectx, event.message);
      break;
    case "message_update":
      handleMessageUpdate(ectx, event.message);
      break;
    case "message_end":
      handleMessageEnd(ectx, event.message);
      break;
    case "tool_start":
      handleToolStart(ectx, event.toolCallId, event.toolName, event.args);
      break;
    case "tool_approval_required":
      handleToolApprovalRequired(ectx, event.toolCallId, event.toolName, event.args);
      break;
    case "tool_update":
      handleToolUpdate(ectx, event.toolCallId, event.partialResult);
      break;
    case "shell_output":
      handleShellOutput(ectx, event.toolCallId, event.output);
      break;
    case "tool_input_start":
      handleToolInputStart(ectx, event.toolCallId, event.toolName);
      break;
    case "tool_input_delta":
      handleToolInputDelta(ectx, event.toolCallId);
      break;
    case "tool_input_end":
      break;
    case "tool_end":
      handleToolEnd(ectx, event.toolCallId, event.result, event.isError);
      break;
    case "info":
      ectx.showInfo(event.message);
      break;
    case "error":
      ectx.showFormattedError(event);
      break;
    case "mode_changed":
      await ectx.refreshModelAuthStatus();
      break;
    case "model_changed":
      await ectx.refreshModelAuthStatus();
      break;
    case "thread_changed": {
      ectx.showInfo(`Switched to thread: ${event.threadId}`);
      await ectx.renderExistingMessages();
      await state.harness.loadOMProgress();
      const freshBranch = chunkP2NLJLNZ_cjs.getCurrentGitBranch(state.projectInfo.rootPath);
      if (freshBranch) {
        state.projectInfo.gitBranch = freshBranch;
      }
      const threads = await state.harness.listThreads();
      const currentThread = threads.find((t) => t.id === event.threadId);
      if (currentThread) {
        state.currentThreadTitle = currentThread.title;
      }
      const threadState = state.harness.getState();
      if (state.taskProgress) {
        state.taskProgress.updateTasks(threadState.tasks ?? []);
        state.ui.requestRender();
      }
      break;
    }
    case "thread_created": {
      ectx.showInfo(`Created thread: ${event.thread.id}`);
      state.currentThreadTitle = event.thread.title;
      const tState = state.harness.getState();
      if (typeof tState?.escapeAsCancel === "boolean") {
        state.editor.escapeEnabled = tState.escapeAsCancel;
      }
      if (state.taskProgress) {
        state.taskProgress.updateTasks([]);
      }
      state.taskWriteInsertIndex = -1;
      break;
    }
    case "usage_update":
      break;
    // Observational Memory events
    case "om_status":
      break;
    case "om_observation_start":
      handleOMObservationStart(ectx, event.cycleId, event.tokensToObserve);
      break;
    case "om_observation_end":
      handleOMObservationEnd(
        ectx,
        event.cycleId,
        event.durationMs,
        event.tokensObserved,
        event.observationTokens,
        event.observations,
        event.currentTask,
        event.suggestedResponse
      );
      break;
    case "om_observation_failed":
      handleOMFailed(ectx, event.cycleId, event.error, "observation");
      break;
    case "om_reflection_start":
      handleOMReflectionStart(ectx, event.cycleId, event.tokensToReflect);
      break;
    case "om_reflection_end":
      handleOMReflectionEnd(ectx, event.cycleId, event.durationMs, event.compressedTokens, event.observations);
      break;
    case "om_reflection_failed":
      handleOMFailed(ectx, event.cycleId, event.error, "reflection");
      break;
    case "om_buffering_start":
      handleOMBufferingStart(ectx, event.operationType, event.tokensToBuffer);
      break;
    case "om_buffering_end":
      handleOMBufferingEnd(ectx, event.operationType, event.tokensBuffered, event.bufferedTokens, event.observations);
      break;
    case "om_buffering_failed":
      handleOMBufferingFailed(ectx, event.operationType, event.error);
      break;
    case "om_activation":
      handleOMActivation(ectx, event.operationType, event.tokensActivated, event.observationTokens);
      break;
    case "om_thread_title_updated":
      state.currentThreadTitle = event.newTitle;
      handleOMThreadTitleUpdated(ectx, event.newTitle, event.oldTitle);
      ectx.updateStatusLine();
      break;
    case "follow_up_queued": {
      ectx.updateStatusLine();
      break;
    }
    case "workspace_ready":
      break;
    case "workspace_error":
      ectx.showError(`Workspace: ${event.error.message}`);
      break;
    case "workspace_status_changed":
      if (event.status === "error" && event.error) {
        ectx.showError(`Workspace: ${event.error.message}`);
      }
      break;
    // Subagent / Task delegation events
    case "subagent_start":
      handleSubagentStart(ectx, event.toolCallId, event.agentType, event.task, event.modelId);
      break;
    case "subagent_tool_start":
      handleSubagentToolStart(ectx, event.toolCallId, event.subToolName, event.subToolArgs);
      break;
    case "subagent_tool_end":
      handleSubagentToolEnd(ectx, event.toolCallId, event.subToolName, event.subToolResult, event.isError);
      break;
    case "subagent_text_delta":
      break;
    case "subagent_end":
      handleSubagentEnd(ectx, event.toolCallId, event.isError, event.durationMs, event.result);
      break;
    case "task_updated": {
      const tasks = event.tasks;
      if (state.taskProgress) {
        state.taskProgress.updateTasks(tasks ?? []);
        let insertIndex = -1;
        for (let i = state.allToolComponents.length - 1; i >= 0; i--) {
          const comp = state.allToolComponents[i];
          if (comp.toolName === "task_write") {
            insertIndex = state.chatContainer.children.indexOf(comp);
            state.chatContainer.removeChild(comp);
            state.allToolComponents.splice(i, 1);
            break;
          }
        }
        if (insertIndex === -1 && state.taskWriteInsertIndex >= 0) {
          insertIndex = state.taskWriteInsertIndex;
          state.taskWriteInsertIndex = -1;
        }
        const allCompleted = tasks && tasks.length > 0 && tasks.every((t) => t.status === "completed");
        if (allCompleted) {
          ectx.renderCompletedTasksInline(tasks, insertIndex, true);
        } else if (state.harness.getDisplayState().previousTasks.length > 0 && (!tasks || tasks.length === 0)) {
          ectx.renderClearedTasksInline(state.harness.getDisplayState().previousTasks, insertIndex);
        }
        state.ui.requestRender();
      }
      break;
    }
    case "ask_question":
      await handleAskQuestion(ectx, event.questionId, event.question, event.options);
      break;
    case "sandbox_access_request":
      await handleSandboxAccessRequest(ectx, event.questionId, event.path, event.reason);
      break;
    case "plan_approval_required":
      await handlePlanApproval(ectx, event.planId, event.title, event.plan);
      break;
    case "plan_approved":
      break;
    case "display_state_changed":
      ectx.updateStatusLine();
      break;
    // Team events (not in HarnessEvent union — emitted as TeamEvent)
    default: {
      const e = event;
      switch (e.type) {
        case "team_start":
          handleTeamStart(ectx, e.teamId, e.task);
          break;
        case "team_member_start":
          handleTeamMemberStart(ectx, e.teamId, e.memberId, e.name, e.modelId);
          break;
        case "team_member_text_delta":
          handleTeamMemberTextDelta(ectx, e.teamId, e.memberId, e.textDelta);
          break;
        case "team_member_tool_call":
          handleTeamMemberToolCall(ectx, e.teamId, e.memberId, e.toolName, e.toolArgs);
          break;
        case "team_member_tool_result":
          handleTeamMemberToolResult(ectx, e.teamId, e.memberId, e.toolName, e.result, e.isError);
          break;
        case "team_message_sent":
          handleTeamMessageSent(ectx, e.teamId, e.from, e.to, e.content);
          break;
        case "team_member_end":
          handleTeamMemberEnd(ectx, e.teamId, e.memberId, e.result, e.isError);
          break;
        case "team_end":
          handleTeamEnd(ectx, e.teamId, e.results);
          break;
        case "team_model_select":
          await handleTeamModelSelect(
            ectx,
            e.questionId,
            e.teamName,
            e.members,
            e.availableModels
          );
          break;
      }
      break;
    }
  }
}
function stripAnsi2(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}
var BorderedBox = class {
  child;
  constructor(child) {
    this.child = child;
  }
  invalidate() {
    this.child.invalidate?.();
  }
  render(width) {
    const borderColor = (s) => chalk8__default.default.hex(chunkWOKNPWRC_cjs.tintHex(chunkWOKNPWRC_cjs.mastra.green, 1))(s);
    const maxInnerWidth = Math.max(1, width - 6 - 2 - chunkWOKNPWRC_cjs.BOX_INDENT_STR.length - 1);
    const childLines = this.child.render(maxInnerWidth);
    if (childLines.length === 0) {
      return [];
    }
    const trimmedLines = [];
    let maxContentWidth = 0;
    for (const line of childLines) {
      const trimmed = line.replace(/\s+$/, "");
      trimmedLines.push(trimmed);
      const w = piTui.visibleWidth(stripAnsi2(trimmed));
      if (w > maxContentWidth) maxContentWidth = w;
    }
    const boxInner = Math.min(maxInnerWidth, maxContentWidth + 2);
    const boxWidth = boxInner + 4;
    const lines = [];
    const promptPrefix = chalk8__default.default.hex(chunkWOKNPWRC_cjs.tintHex(chunkWOKNPWRC_cjs.mastra.green, 1))("\xBB") + " ";
    const promptWidth = 2;
    lines.push(borderColor(`\u256D${"\u2500".repeat(boxWidth - 2)}\u256E`));
    for (let i = 0; i < trimmedLines.length; i++) {
      const trimmed = trimmedLines[i];
      const vis = piTui.visibleWidth(stripAnsi2(trimmed));
      if (i === 0) {
        const padNeeded = Math.max(0, boxInner - vis - promptWidth);
        lines.push(borderColor("\u2502") + " " + promptPrefix + trimmed + " ".repeat(padNeeded) + " " + borderColor("\u2502"));
      } else {
        const padNeeded = Math.max(0, boxInner - vis);
        lines.push(borderColor("\u2502") + " " + trimmed + " ".repeat(padNeeded) + " " + borderColor("\u2502"));
      }
    }
    lines.push(borderColor(`\u2570${"\u2500".repeat(boxWidth - 2)}\u256F`));
    return lines.map((l) => chunkWOKNPWRC_cjs.BOX_INDENT_STR + l);
  }
};
var UserMessageComponent = class extends piTui.Container {
  constructor(text, markdownTheme = chunkWOKNPWRC_cjs.getMarkdownTheme()) {
    super();
    const md = new piTui.Markdown(text, 0, 0, markdownTheme, {
      color: (text2) => chunkWOKNPWRC_cjs.theme.fg("text", text2),
      italic: false
    });
    this.addChild(new BorderedBox(md));
    this.addChild(new piTui.Spacer(1));
  }
};

// src/tui/render-messages.ts
function renderCompletedTasksInline(state, tasks, insertIndex = -1, collapsed = false) {
  const headerText = chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "Tasks")) + chunkWOKNPWRC_cjs.theme.fg("dim", ` [${tasks.length}/${tasks.length} completed]`);
  const container = new piTui.Container();
  container.addChild(new piTui.Text(headerText, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
  const MAX_VISIBLE = 4;
  const shouldCollapse = collapsed && tasks.length > MAX_VISIBLE + 1;
  const visible = shouldCollapse ? tasks.slice(0, MAX_VISIBLE) : tasks;
  const remaining = shouldCollapse ? tasks.length - MAX_VISIBLE : 0;
  for (const task of visible) {
    const icon = chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.green)("\u2713");
    const text = chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.green)(task.content);
    container.addChild(new piTui.Text(`  ${icon} ${text}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
  }
  if (remaining > 0) {
    container.addChild(
      new piTui.Text(
        chunkWOKNPWRC_cjs.theme.fg("dim", `  ... ${remaining} more completed task${remaining > 1 ? "s" : ""} (ctrl+e to expand)`),
        chunkWOKNPWRC_cjs.BOX_INDENT,
        0
      )
    );
  }
  container.addChild(new piTui.Spacer(1));
  if (insertIndex >= 0) {
    state.chatContainer.children.splice(insertIndex, 0, container);
    state.chatContainer.invalidate();
  } else {
    state.chatContainer.addChild(container);
  }
}
function renderClearedTasksInline(state, clearedTasks, insertIndex = -1) {
  const container = new piTui.Container();
  const count = clearedTasks.length;
  const label = count === 1 ? "Task" : "Tasks";
  container.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("accent", `${label} cleared`), chunkWOKNPWRC_cjs.BOX_INDENT, 0));
  for (const task of clearedTasks) {
    const icon = task.status === "completed" ? chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.green)("\u2713") : chalk8__default.default.hex(chunkWOKNPWRC_cjs.mastra.darkGray)("\u25CB");
    const text = chalk8__default.default.hex(chunkWOKNPWRC_cjs.theme.getTheme().dim).strikethrough(task.content);
    container.addChild(new piTui.Text(`  ${icon} ${text}`, chunkWOKNPWRC_cjs.BOX_INDENT, 0));
  }
  container.addChild(new piTui.Spacer(1));
  if (insertIndex >= 0) {
    state.chatContainer.children.splice(insertIndex, 0, container);
    state.chatContainer.invalidate();
  } else {
    state.chatContainer.addChild(container);
  }
}
function addChildBeforeFollowUps(state, child) {
  if (state.followUpComponents.length > 0) {
    const firstFollowUp = state.followUpComponents[0];
    const idx = state.chatContainer.children.indexOf(firstFollowUp);
    if (idx >= 0) {
      state.chatContainer.children.splice(idx, 0, child);
      state.chatContainer.invalidate();
      return;
    }
  }
  state.chatContainer.addChild(child);
}
function addUserMessage(state, message) {
  const textContent = message.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
  const imageCount = message.content.filter((c) => c.type === "image").length;
  const displayText = imageCount > 0 ? textContent.replace(/\[image\]\s*/g, "").trim() : textContent.trim();
  const systemReminderMatch = displayText.match(
    /<system-reminder(?<attrs>\s+[^>]*)?>(?<body>[\s\S]*?)<\/system-reminder>/
  );
  if (systemReminderMatch?.groups?.body) {
    const reminderText = systemReminderMatch.groups.body.trim();
    const attrs = systemReminderMatch.groups.attrs ?? "";
    const reminderType = attrs.match(/\btype="([^"]*)"/)?.[1];
    const path7 = attrs.match(/\bpath="([^"]*)"/)?.[1];
    const reminderComponent = new SystemReminderComponent({
      message: reminderText,
      reminderType,
      path: path7
    });
    reminderComponent.setExpanded(state.toolOutputExpanded);
    state.allSystemReminderComponents.push(reminderComponent);
    addChildBeforeFollowUps(state, reminderComponent);
    state.ui.requestRender();
    return;
  }
  const slashCommandMatch = displayText.match(/<slash-command\s+name="([^"]*)">([\s\S]*?)<\/slash-command>/);
  if (slashCommandMatch) {
    const commandName = slashCommandMatch[1];
    const commandContent = slashCommandMatch[2].trim();
    const slashComp = new SlashCommandComponent(commandName, commandContent);
    state.allSlashCommandComponents.push(slashComp);
    state.chatContainer.addChild(slashComp);
    state.ui.requestRender();
    return;
  }
  const prefix = imageCount > 0 ? `[${imageCount} image${imageCount > 1 ? "s" : ""}] ` : "";
  if (displayText || prefix) {
    const userComponent = new UserMessageComponent(prefix + displayText);
    state.chatContainer.addChild(userComponent);
    if (state.harness.getDisplayState().isRunning && state.streamingComponent) {
      state.followUpComponents.push(userComponent);
    }
  }
}
async function renderExistingMessages(state) {
  const messages = await state.harness.listMessages({ limit: 40 });
  state.chatContainer.clear();
  state.pendingTools.clear();
  state.allToolComponents = [];
  state.allSlashCommandComponents = [];
  state.allSystemReminderComponents = [];
  let previousTasksAcc = [];
  for (const message of messages) {
    if (message.role === "user") {
      addUserMessage(state, message);
    } else if (message.role === "assistant") {
      let accumulatedContent = [];
      for (const content of message.content) {
        if (content.type === "text" || content.type === "thinking") {
          accumulatedContent.push(content);
        } else if (content.type === "tool_call") {
          if (accumulatedContent.length > 0) {
            const textMessage = {
              ...message,
              content: accumulatedContent
            };
            const textComponent = new AssistantMessageComponent(
              textMessage,
              state.hideThinkingBlock,
              chunkWOKNPWRC_cjs.getMarkdownTheme()
            );
            state.chatContainer.addChild(textComponent);
            accumulatedContent = [];
          }
          const toolResult = message.content.find((c) => c.type === "tool_result" && c.id === content.id);
          if (content.name === "subagent") {
            const subArgs = content.args;
            const rawResult = toolResult?.type === "tool_result" ? formatToolResult(toolResult.result) : void 0;
            const isErr = toolResult?.type === "tool_result" && toolResult.isError;
            const meta = rawResult ? harness.parseSubagentMeta(rawResult) : null;
            const resultText = meta?.text ?? rawResult;
            const modelId = meta?.modelId ?? subArgs?.modelId;
            const durationMs = meta?.durationMs ?? 0;
            const subComponent = new SubagentExecutionComponent(
              subArgs?.agentType ?? "unknown",
              subArgs?.task ?? "",
              state.ui,
              modelId,
              { collapseOnComplete: state.quietMode }
            );
            if (meta?.toolCalls) {
              for (const tc of meta.toolCalls) {
                subComponent.addToolStart(tc.name, {});
                subComponent.addToolEnd(tc.name, "", tc.isError);
              }
            }
            subComponent.finish(isErr ?? false, durationMs, resultText);
            state.chatContainer.addChild(subComponent);
            state.allToolComponents.push(subComponent);
            continue;
          }
          if (content.name === "ask_user" && toolResult?.type === "tool_result") {
            const askArgs = content.args;
            const answer = typeof toolResult.result === "string" ? toolResult.result : formatToolResult(toolResult.result);
            const cancelled = answer === "(skipped)";
            if (askArgs?.question) {
              const askComponent = AskQuestionInlineComponent.fromHistory(
                askArgs.question,
                askArgs.options,
                answer,
                cancelled
              );
              state.chatContainer.addChild(askComponent);
              continue;
            }
          }
          const toolComponent = new ToolExecutionComponentEnhanced(
            content.name,
            content.args,
            {
              showImages: false,
              collapsedByDefault: !state.toolOutputExpanded
            },
            state.ui
          );
          if (toolResult && toolResult.type === "tool_result") {
            toolComponent.updateResult(
              {
                content: [
                  {
                    type: "text",
                    text: formatToolResult(toolResult.result)
                  }
                ],
                isError: toolResult.isError
              },
              false
            );
          }
          let replacedWithInline = false;
          if (content.name === "task_write" && toolResult?.type === "tool_result" && !toolResult.isError) {
            const args = content.args;
            const tasks = args?.tasks;
            if (tasks && tasks.length > 0 && tasks.every((t) => t.status === "completed")) {
              renderCompletedTasksInline(state, tasks);
              replacedWithInline = true;
            } else if (!tasks || tasks.length === 0) {
              if (previousTasksAcc.length > 0) {
                renderClearedTasksInline(state, previousTasksAcc);
                previousTasksAcc = [];
                replacedWithInline = true;
              }
            } else {
              previousTasksAcc = [...tasks];
            }
          }
          if (content.name === "submit_plan" && toolResult?.type === "tool_result") {
            const args = content.args;
            let resultText = "";
            if (typeof toolResult.result === "string") {
              resultText = toolResult.result;
            } else if (typeof toolResult.result === "object" && toolResult.result !== null && "content" in toolResult.result && typeof toolResult.result.content === "string") {
              resultText = toolResult.result.content;
            }
            const isApproved = resultText.toLowerCase().includes("approved");
            let feedback;
            if (!isApproved && resultText.includes("Feedback:")) {
              const feedbackMatch = resultText.match(/Feedback:\s*(.+)/);
              feedback = feedbackMatch?.[1];
            }
            if (args?.title && args?.plan) {
              const planResult = new PlanResultComponent({
                title: args.title,
                plan: args.plan,
                isApproved,
                feedback
              });
              state.chatContainer.addChild(planResult);
              replacedWithInline = true;
            }
          }
          if (!replacedWithInline) {
            state.chatContainer.addChild(toolComponent);
            state.allToolComponents.push(toolComponent);
          }
        } else if (content.type === "om_observation_start" || content.type === "om_observation_end" || content.type === "om_observation_failed") {
          if (content.type === "om_observation_start") continue;
          if (accumulatedContent.length > 0) {
            const textMessage = {
              ...message,
              content: accumulatedContent
            };
            const textComponent = new AssistantMessageComponent(
              textMessage,
              state.hideThinkingBlock,
              chunkWOKNPWRC_cjs.getMarkdownTheme()
            );
            state.chatContainer.addChild(textComponent);
            accumulatedContent = [];
          }
          if (content.type === "om_observation_end") {
            const isReflection = content.operationType === "reflection";
            const outputComponent = new OMOutputComponent({
              type: isReflection ? "reflection" : "observation",
              observations: content.observations ?? "",
              currentTask: content.currentTask,
              suggestedResponse: content.suggestedResponse,
              durationMs: content.durationMs,
              tokensObserved: content.tokensObserved,
              observationTokens: content.observationTokens,
              compressedTokens: isReflection ? content.observationTokens : void 0
            });
            state.chatContainer.addChild(outputComponent);
          } else {
            state.chatContainer.addChild(new OMMarkerComponent(content));
          }
        } else if (content.type === "om_thread_title_updated") {
          state.chatContainer.addChild(
            new OMMarkerComponent({
              type: "om_thread_title_updated",
              newTitle: content.newTitle,
              oldTitle: content.oldTitle
            })
          );
        }
      }
      if (accumulatedContent.length > 0) {
        const textMessage = {
          ...message,
          content: accumulatedContent
        };
        const textComponent = new AssistantMessageComponent(textMessage, state.hideThinkingBlock, chunkWOKNPWRC_cjs.getMarkdownTheme());
        state.chatContainer.addChild(textComponent);
      }
    }
  }
  if (previousTasksAcc.length > 0 && state.taskProgress) {
    state.taskProgress.updateTasks(previousTasksAcc);
  }
  state.ui.requestRender();
}
async function parseCommandFile(filePath, baseDir) {
  try {
    const content = await fs2.promises.readFile(filePath, "utf-8");
    const trimmedContent = content.trim();
    if (!trimmedContent.startsWith("---")) {
      const name2 = baseDir ? extractCommandName(filePath, baseDir) : path6__namespace.basename(filePath, ".md");
      return {
        name: name2,
        description: "",
        template: content,
        sourcePath: filePath
      };
    }
    const parts = content.split("---");
    if (parts.length < 3) {
      return null;
    }
    const frontmatter = parts[1].trim();
    const template = parts.slice(2).join("---").trim();
    const metadata = yaml.parse(frontmatter);
    let name;
    if (metadata?.name) {
      name = metadata.name;
    } else if (baseDir) {
      name = extractCommandName(filePath, baseDir);
    } else {
      name = path6__namespace.basename(filePath, ".md");
    }
    return {
      name,
      description: metadata?.description || "",
      template,
      sourcePath: filePath,
      namespace: metadata?.namespace
    };
  } catch (error) {
    console.error(`Error parsing command file ${filePath}:`, error);
    return null;
  }
}
function extractCommandName(filePath, baseDir) {
  const relativePath = path6__namespace.relative(baseDir, filePath);
  const dirName = path6__namespace.dirname(relativePath);
  const baseName = path6__namespace.basename(relativePath, ".md");
  if (dirName === "." || dirName === "") {
    return baseName;
  }
  const namespace = dirName.replace(/[\\/]/g, ":");
  return `${namespace}:${baseName}`;
}
async function scanCommandDirectory(dirPath, rootDir) {
  const baseDir = rootDir ?? dirPath;
  const commands = [];
  try {
    const entries = await fs2.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path6__namespace.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subCommands = await scanCommandDirectory(fullPath, baseDir);
        commands.push(...subCommands);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const command = await parseCommandFile(fullPath, baseDir);
        if (command) {
          commands.push(command);
        }
      }
    }
  } catch {
  }
  return commands;
}
async function loadCustomCommands(projectDir) {
  const commandMap = /* @__PURE__ */ new Map();
  const addCommands = (newCommands) => {
    for (const cmd of newCommands) {
      commandMap.set(cmd.name, cmd);
    }
  };
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (homeDir) {
    const opencodeUserDir = path6__namespace.join(homeDir, ".opencode", "command");
    const opencodeUserCommands = await scanCommandDirectory(opencodeUserDir);
    addCommands(opencodeUserCommands);
  }
  if (homeDir) {
    const claudeUserDir = path6__namespace.join(homeDir, ".claude", "commands");
    const claudeUserCommands = await scanCommandDirectory(claudeUserDir);
    addCommands(claudeUserCommands);
  }
  if (homeDir) {
    const mastraUserDir = path6__namespace.join(homeDir, ".mastracode", "commands");
    const mastraUserCommands = await scanCommandDirectory(mastraUserDir);
    addCommands(mastraUserCommands);
  }
  if (projectDir) {
    const opencodeProjectDir = path6__namespace.join(projectDir, ".opencode", "command");
    const opencodeProjectCommands = await scanCommandDirectory(opencodeProjectDir);
    addCommands(opencodeProjectCommands);
  }
  if (projectDir) {
    const claudeProjectDir = path6__namespace.join(projectDir, ".claude", "commands");
    const claudeProjectCommands = await scanCommandDirectory(claudeProjectDir);
    addCommands(claudeProjectCommands);
  }
  if (projectDir) {
    const mastraProjectDir = path6__namespace.join(projectDir, ".mastracode", "commands");
    const mastraProjectCommands = await scanCommandDirectory(mastraProjectDir);
    addCommands(mastraProjectCommands);
  }
  return Array.from(commandMap.values());
}
var GRADIENT_STOPS = ["#085314", "#0d8020", "#16c858", "#62f69d", "#a1fac7"];
var FULL_ART = [
  "\u2588\u2580\u2584\u2580\u2588 \u2584\u2580\u2588 \u2588\u2580 \u2580\u2588\u2580 \u2588\u2580\u2588 \u2584\u2580\u2588   \u2588\u2580\u2580 \u2588\u2580\u2588 \u2588\u2580\u2584 \u2588\u2580\u2580",
  "\u2588 \u2580 \u2588 \u2588\u2580\u2588 \u2580\u2588  \u2588  \u2588\u2580\u2584 \u2588\u2580\u2588   \u2588   \u2588 \u2588 \u2588 \u2588 \u2588\u2580\u2580",
  "\u2580   \u2580 \u2580 \u2580 \u2580\u2580  \u2580  \u2580 \u2580 \u2580 \u2580   \u2580\u2580\u2580 \u2580\u2580\u2580 \u2580\u2580  \u2580\u2580\u2580"
];
var SHORT_ART = ["\u2588\u2580\u2584\u2580\u2588 \u2584\u2580\u2588 \u2588\u2580 \u2580\u2588\u2580 \u2588\u2580\u2588 \u2584\u2580\u2588", "\u2588 \u2580 \u2588 \u2588\u2580\u2588 \u2580\u2588  \u2588  \u2588\u2580\u2584 \u2588\u2580\u2588", "\u2580   \u2580 \u2580 \u2580 \u2580\u2580  \u2580  \u2580 \u2580 \u2580 \u2580"];
function lerpColor(hex1, hex2, t) {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  return [Math.round(r1 + (r2 - r1) * t), Math.round(g1 + (g2 - g1) * t), Math.round(b1 + (b2 - b1) * t)];
}
function gradientChar(ch, colIdx, totalCols) {
  if (ch === " ") return " ";
  const t = totalCols <= 1 ? 0.5 : colIdx / (totalCols - 1);
  const segmentCount = GRADIENT_STOPS.length - 1;
  const segment = Math.min(Math.floor(t * segmentCount), segmentCount - 1);
  const frac = t * segmentCount - segment;
  const [r, g, b] = lerpColor(GRADIENT_STOPS[segment], GRADIENT_STOPS[segment + 1], frac);
  return chalk8__default.default.rgb(r, g, b)(ch);
}
function colorLine(line) {
  const chars = [...line];
  return chars.map((ch, i) => gradientChar(ch, i, chars.length)).join("");
}
function renderBanner(version, appName) {
  const name = appName;
  if (name !== "Mastra Code") {
    return chunkWOKNPWRC_cjs.theme.fg("accent", "\u25C6") + " " + chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", name)) + chunkWOKNPWRC_cjs.theme.fg("dim", ` v${version}`);
  }
  const cols = process.stdout.columns || 80;
  if (cols < 30) {
    return chunkWOKNPWRC_cjs.theme.fg("accent", "\u25C6") + " " + chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "Mastra Code")) + chunkWOKNPWRC_cjs.theme.fg("dim", ` v${version}`);
  }
  const art = cols >= 50 ? FULL_ART : SHORT_ART;
  const coloredLines = art.map((line) => colorLine(line));
  coloredLines.push(chunkWOKNPWRC_cjs.theme.fg("dim", `v${version}`));
  return coloredLines.join("\n");
}
var TaskProgressComponent = class extends piTui.Container {
  tasks = [];
  constructor() {
    super();
  }
  /**
   * Replace the entire task list and re-render.
   */
  updateTasks(tasks) {
    this.tasks = tasks;
    this.rebuildDisplay();
  }
  /**
   * Get the current task list (read-only copy).
   */
  getTasks() {
    return [...this.tasks];
  }
  rebuildDisplay() {
    this.clear();
    if (this.tasks.length === 0) return;
    const completed = this.tasks.filter((t) => t.status === "completed").length;
    const total = this.tasks.length;
    if (completed === total) return;
    const headerText = "  " + chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", "Tasks")) + chunkWOKNPWRC_cjs.theme.fg("dim", ` [${completed}/${total} completed]`);
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(headerText, 0, 0));
    for (const task of this.tasks) {
      this.addChild(new piTui.Text(this.formatTaskLine(task), 0, 0));
    }
  }
  formatTaskLine(task) {
    const indent = "    ";
    switch (task.status) {
      case "completed": {
        const icon = chunkWOKNPWRC_cjs.theme.fg("success", "\u2713");
        const text = chalk8__default.default.hex(chunkWOKNPWRC_cjs.theme.getTheme().success).strikethrough(task.content);
        return `${indent}${icon} ${text}`;
      }
      case "in_progress": {
        const icon = chunkWOKNPWRC_cjs.theme.fg("warning", "\u25B6");
        const text = chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("warning", task.activeForm));
        return `${indent}${icon} ${text}`;
      }
      case "pending": {
        const icon = chunkWOKNPWRC_cjs.theme.fg("dim", "\u25CB");
        const text = chunkWOKNPWRC_cjs.theme.fg("dim", task.content);
        return `${indent}${icon} ${text}`;
      }
    }
  }
};

// src/tui/setup.ts
function setupKeyboardShortcuts(state, callbacks) {
  state.editor.onAction("clear", () => {
    const now = Date.now();
    if (now - state.lastCtrlCTime < callbacks.doubleCtrlCMs) {
      callbacks.stop();
      process.exit(0);
    }
    state.lastCtrlCTime = now;
    if (state.pendingApprovalDismiss) {
      state.pendingApprovalDismiss();
      state.activeInlinePlanApproval = void 0;
      state.activeInlineQuestion = void 0;
      state.pendingInlineQuestions.length = 0;
      state.userInitiatedAbort = true;
      state.harness.abort();
    } else if (state.harness.isRunning()) {
      state.activeInlinePlanApproval = void 0;
      state.activeInlineQuestion = void 0;
      state.pendingInlineQuestions.length = 0;
      state.userInitiatedAbort = true;
      state.harness.abort();
    } else {
      const current = state.editor.getText();
      if (current.length > 0) {
        state.lastClearedText = current;
      }
      state.editor.setText("");
      state.ui.requestRender();
    }
  });
  state.editor.onAction("suspend", () => {
    if (process.platform === "win32") {
      showInfo(state, "Suspend is not supported on Windows");
      return;
    }
    state.ui.stop();
    const onContinue = () => {
      state.ui.start();
      state.ui.requestRender();
    };
    process.once("SIGCONT", onContinue);
    try {
      process.kill(process.pid, "SIGTSTP");
    } catch {
      process.off("SIGCONT", onContinue);
      state.ui.start();
      state.ui.requestRender();
      showError(state, "Unable to suspend in the current terminal");
    }
  });
  state.editor.onAction("undo", () => {
    if (state.lastClearedText && state.editor.getText().length === 0) {
      state.editor.setText(state.lastClearedText);
      state.lastClearedText = "";
      state.ui.requestRender();
    }
  });
  state.editor.onCtrlD = () => {
    callbacks.stop();
    process.exit(0);
  };
  state.editor.onAction("toggleThinking", () => {
    if (state.activeTeamId) {
      const team = state.pendingTeams.get(state.activeTeamId);
      if (team) {
        team.focusNextMember();
        state.ui.requestRender();
        return;
      }
    }
    state.hideThinkingBlock = !state.hideThinkingBlock;
    state.ui.requestRender();
  });
  state.editor.onAction("expandTools", () => {
    state.toolOutputExpanded = !state.toolOutputExpanded;
    for (const tool of state.allToolComponents) {
      tool.setExpanded(state.toolOutputExpanded);
    }
    for (const sc of state.allSlashCommandComponents) {
      sc.setExpanded(state.toolOutputExpanded);
    }
    for (const reminder of state.allSystemReminderComponents) {
      reminder.setExpanded(state.toolOutputExpanded);
    }
    for (const team of state.pendingTeams.values()) {
      team.setExpanded(state.toolOutputExpanded);
    }
    state.ui.requestRender();
  });
  state.editor.onAction("cycleMode", async () => {
    if (state.activeInlinePlanApproval) {
      showInfo(state, "Resolve the plan approval first");
      return;
    }
    const modes = state.harness.listModes();
    if (modes.length <= 1) return;
    const currentId = state.harness.getCurrentModeId();
    const currentIndex = modes.findIndex((m) => m.id === currentId);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    await state.harness.switchMode({ modeId: nextMode.id });
  });
  state.editor.onAction("toggleYolo", () => {
    const current = state.harness.getState().yolo === true;
    state.harness.setState({ yolo: !current });
    showInfo(state, current ? "YOLO mode off" : "YOLO mode on");
  });
  state.editor.onAction("followUp", () => {
    if (!state.harness.isRunning()) {
      state.editor.onSubmit?.(state.editor.getExpandedText());
      return true;
    }
    const text = state.editor.getExpandedText().trim();
    if (!text) {
      return true;
    }
    state.editor.addToHistory(text);
    state.editor.setText("");
    callbacks.queueFollowUpMessage(text);
    state.ui.requestRender();
    return true;
  });
}
function buildLayout(state, refreshModelAuthStatus) {
  const appName = state.options.appName || "Mastra Code";
  const version = state.options.version || "0.1.0";
  const banner = renderBanner(version, appName);
  const frontmatter = [
    `Project: ${state.projectInfo.name}`,
    `Resource ID: ${state.projectInfo.resourceId}`,
    state.projectInfo.gitBranch ? `Branch: ${state.projectInfo.gitBranch}` : null,
    state.projectInfo.isWorktree ? `Worktree of: ${state.projectInfo.mainRepoPath}` : null,
    `User: ${chunkP2NLJLNZ_cjs.getUserId(state.projectInfo.rootPath)}`
  ].filter(Boolean).map((line) => chunkWOKNPWRC_cjs.theme.fg("muted", line)).join("\n");
  const sep = chunkWOKNPWRC_cjs.theme.fg("dim", " \xB7 ");
  const hintParts = [];
  if (state.harness.listModes().length > 1) {
    hintParts.push(`${chunkWOKNPWRC_cjs.theme.fg("accent", "\u21E7+Tab")} ${chunkWOKNPWRC_cjs.theme.fg("muted", "cycle modes")}`);
  }
  hintParts.push(`${chunkWOKNPWRC_cjs.theme.fg("accent", "/help")} ${chunkWOKNPWRC_cjs.theme.fg("muted", "info & shortcuts")}`);
  const instructions = `  ${hintParts.join(sep)}`;
  state.ui.addChild(new piTui.Spacer(1));
  state.ui.addChild(new piTui.Text(banner, 1, 0));
  state.ui.addChild(new piTui.Text(frontmatter, 1, 0));
  state.ui.addChild(new piTui.Spacer(1));
  state.ui.addChild(new piTui.Text(instructions, 0, 0));
  state.ui.addChild(new piTui.Spacer(1));
  state.ui.addChild(state.chatContainer);
  state.taskProgress = new TaskProgressComponent();
  state.ui.addChild(state.taskProgress);
  state.ui.addChild(state.editorContainer);
  state.editorContainer.addChild(state.editor);
  state.statusLine = new piTui.Text("", 0, 0);
  state.memoryStatusLine = new piTui.Text("", 0, 0);
  state.footer.addChild(state.statusLine);
  state.footer.addChild(state.memoryStatusLine);
  state.ui.addChild(state.footer);
  updateStatusLine(state);
  refreshModelAuthStatus();
  state.ui.setFocus(state.editor);
}
function detectFdPath() {
  const whichCmd = process.platform === "win32" ? "where" : "which";
  for (const bin of ["fd", "fdfind"]) {
    try {
      const resolved = child_process.execFileSync(whichCmd, [bin], { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim().split(/\r?\n/)[0];
      if (resolved) return resolved;
    } catch {
    }
  }
  return null;
}
function setupAutocomplete(state) {
  const slashCommands = [
    { name: "new", description: "Start a new thread" },
    { name: "clone", description: "Clone the current thread" },
    { name: "thread", description: "Show current thread info" },
    { name: "threads", description: "Switch between threads" },
    { name: "models", description: "Switch model pack" },
    { name: "custom-providers", description: "Manage custom providers and models" },
    { name: "subagents", description: "Configure subagent model defaults" },
    { name: "om", description: "Configure Observational Memory models" },
    { name: "think", description: "Set thinking (off|low|medium|high|xhigh|status)" },
    { name: "login", description: "Login with OAuth provider" },
    { name: "skills", description: "List available skills" },
    { name: "cost", description: "Show token usage and estimated costs" },
    { name: "diff", description: "Show modified files or git diff" },
    { name: "name", description: "Rename current thread" },
    {
      name: "resource",
      description: "Show/switch resource ID (tag for sharing)"
    },
    { name: "logout", description: "Logout from OAuth provider" },
    { name: "hooks", description: "Show/reload configured hooks" },
    { name: "mcp", description: "Show/reload MCP server connections" },
    {
      name: "thread:tag-dir",
      description: "Tag current thread with this directory"
    },
    {
      name: "sandbox",
      description: "Manage allowed paths (add/remove directories)"
    },
    {
      name: "permissions",
      description: "View/manage tool approval permissions"
    },
    {
      name: "settings",
      description: "General settings (notifications, YOLO, thinking)"
    },
    {
      name: "yolo",
      description: "Toggle YOLO mode (auto-approve all tools)"
    },
    { name: "review", description: "Review a GitHub pull request" },
    { name: "report-issue", description: "Open or browse mastracode issues" },
    { name: "setup", description: "Re-run the setup wizard" },
    { name: "theme", description: "Switch color theme (auto/dark/light)" },
    { name: "update", description: "Check for and install updates" },
    { name: "exit", description: "Exit the TUI" },
    { name: "help", description: "Show available commands" }
  ];
  const modes = state.harness.listModes();
  if (modes.length > 1) {
    slashCommands.push({ name: "mode", description: "Switch agent mode" });
  }
  for (const customCmd of state.customSlashCommands) {
    slashCommands.push({
      name: `/${customCmd.name}`,
      description: customCmd.description || `Custom: ${customCmd.name}`
    });
  }
  const fdPath = detectFdPath();
  state.autocompleteProvider = new piTui.CombinedAutocompleteProvider(slashCommands, process.cwd(), fdPath);
  state.editor.setAutocompleteProvider(state.autocompleteProvider);
}
async function loadCustomSlashCommands(state) {
  try {
    const globalCommands = await loadCustomCommands();
    const localCommands = await loadCustomCommands(process.cwd());
    const commandMap = /* @__PURE__ */ new Map();
    for (const cmd of globalCommands) {
      commandMap.set(cmd.name, cmd);
    }
    for (const cmd of localCommands) {
      commandMap.set(cmd.name, cmd);
    }
    state.customSlashCommands = Array.from(commandMap.values());
  } catch {
    state.customSlashCommands = [];
  }
}
function setupKeyHandlers(state, callbacks) {
  process.on("SIGINT", () => {
    const now = Date.now();
    if (now - state.lastCtrlCTime < callbacks.doubleCtrlCMs) {
      callbacks.stop();
      process.exit(0);
    }
    state.lastCtrlCTime = now;
    if (state.pendingApprovalDismiss) {
      state.pendingApprovalDismiss();
    }
    state.activeInlinePlanApproval = void 0;
    state.activeInlineQuestion = void 0;
    state.pendingInlineQuestions.length = 0;
    state.userInitiatedAbort = true;
    state.harness.abort();
  });
  state.ui.onDebug = () => {
  };
}
function subscribeToHarness(state, handleEvent) {
  const listener = async (event) => {
    try {
      await handleEvent(event);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : void 0;
      process.stderr.write(`[event error] ${event.type}: ${msg}
`);
      if (stack) process.stderr.write(stack + "\n");
    }
  };
  state.unsubscribe = state.harness.subscribe(listener);
}
function updateTerminalTitle(state) {
  const appName = state.options.appName || "Mastra Code";
  const cwd = process.cwd().split("/").pop() || "";
  state.ui.terminal.setTitle(`${appName} - ${cwd}`);
}
async function promptForThreadSelection(state) {
  const allThreads = await state.harness.listThreads();
  const currentPath = state.projectInfo.rootPath;
  let dirCreatedAt;
  try {
    const stat = fs2__default.default.statSync(currentPath);
    dirCreatedAt = stat.birthtime;
  } catch {
  }
  const threads = allThreads.filter((t) => {
    const threadPath = t.metadata?.projectPath;
    if (threadPath) return threadPath === currentPath;
    if (dirCreatedAt) return t.createdAt >= dirCreatedAt;
    return true;
  });
  if (threads.length === 0) {
    state.pendingNewThread = true;
    return;
  }
  const sortedThreads = [...threads].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  if (sortedThreads.length === 1) {
    const thread = sortedThreads[0];
    try {
      await state.harness.switchThread({ threadId: thread.id });
      if (!thread.metadata?.projectPath) {
        await state.harness.setThreadSetting({ key: "projectPath", value: currentPath });
      }
      return;
    } catch (error) {
      if (error instanceof chunkWOKNPWRC_cjs.ThreadLockError) {
        state.pendingNewThread = true;
        return;
      }
      throw error;
    }
  }
  for (const thread of sortedThreads) {
    try {
      await state.harness.switchThread({ threadId: thread.id });
      if (!thread.metadata?.projectPath) {
        await state.harness.setThreadSetting({ key: "projectPath", value: currentPath });
      }
      return;
    } catch (error) {
      if (error instanceof chunkWOKNPWRC_cjs.ThreadLockError) {
        continue;
      }
      throw error;
    }
  }
  state.pendingNewThread = true;
}
async function renderExistingTasks(state) {
  try {
    const harnessState = state.harness.getState();
    const tasks = harnessState.tasks || [];
    if (tasks.length > 0 && state.taskProgress) {
      state.taskProgress.updateTasks(tasks);
      state.ui.requestRender();
    }
  } catch {
  }
}
var MAX_LINES = 200;
function truncateAnsi3(str, maxWidth) {
  const plain = stripAnsi__default.default(str);
  if (plain.length <= maxWidth) return str;
  const ansiRegex = /\x1b\[[0-9;]*m|\x1b\]8;[^\x07]*\x07/g;
  let visibleLength = 0;
  let result = "";
  let lastIndex = 0;
  let match;
  while ((match = ansiRegex.exec(str)) !== null) {
    const textBefore = str.slice(lastIndex, match.index);
    const remaining = maxWidth - visibleLength;
    if (textBefore.length <= remaining) {
      result += textBefore;
      visibleLength += textBefore.length;
    } else {
      result += textBefore.slice(0, remaining - 1) + "\u2026";
      result += "\x1B]8;;\x07\x1B[0m";
      return result;
    }
    result += match[0];
    lastIndex = match.index + match[0].length;
  }
  const remainingText = str.slice(lastIndex);
  const spaceLeft = maxWidth - visibleLength;
  if (remainingText.length <= spaceLeft) {
    result += remainingText;
  } else {
    result += remainingText.slice(0, spaceLeft - 1) + "\u2026";
    result += "\x1B]8;;\x07\x1B[0m";
  }
  return result;
}
function formatDuration3(ms) {
  if (ms < 1e3) return `${ms}ms`;
  const seconds = ms / 1e3;
  return seconds < 60 ? `${seconds.toFixed(1)}s` : `${Math.floor(seconds / 60)}m${Math.floor(seconds % 60)}s`;
}
var ShellStreamComponent = class extends piTui.Container {
  command;
  lines = [];
  trailingPartial = "";
  exitCode;
  startTime = Date.now();
  constructor(command) {
    super();
    this.command = command;
    this.rebuild();
  }
  appendOutput(text) {
    const combined = this.trailingPartial + text;
    const parts = combined.split("\n");
    this.trailingPartial = parts.pop();
    this.lines.push(...parts);
    if (this.lines.length > MAX_LINES) {
      this.lines = this.lines.slice(-MAX_LINES);
    }
    this.rebuild();
  }
  finish(exitCode) {
    if (this.trailingPartial) {
      this.lines.push(this.trailingPartial);
      this.trailingPartial = "";
      if (this.lines.length > MAX_LINES) {
        this.lines = this.lines.slice(-MAX_LINES);
      }
    }
    this.exitCode = exitCode;
    this.rebuild();
  }
  rebuild() {
    this.clear();
    this.addChild(new piTui.Spacer(1));
    const border = (char) => chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("accent", char));
    const termWidth = chunkWOKNPWRC_cjs.getTermWidth();
    const maxLineWidth = termWidth - 6;
    const done = this.exitCode !== void 0;
    const statusIcon = done ? this.exitCode === 0 ? chunkWOKNPWRC_cjs.theme.fg("success", " \u2713") : chunkWOKNPWRC_cjs.theme.fg("error", " \u2717") : chunkWOKNPWRC_cjs.theme.fg("muted", " \u22EF");
    const durationStr = done ? chunkWOKNPWRC_cjs.theme.fg("muted", ` ${formatDuration3(Date.now() - this.startTime)}`) : "";
    const footerText = `${chunkWOKNPWRC_cjs.theme.bold(chunkWOKNPWRC_cjs.theme.fg("toolTitle", "$"))} ${chunkWOKNPWRC_cjs.theme.fg("accent", this.command)}${durationStr}${statusIcon}`;
    this.addChild(new piTui.Text(border("\u256D\u2500\u2500"), 0, 0));
    const displayLines = [...this.lines];
    if (this.trailingPartial && !done) {
      displayLines.push(this.trailingPartial);
    }
    while (displayLines.length > 0 && displayLines[0] === "") displayLines.shift();
    if (displayLines.length > 0) {
      const borderedLines = displayLines.map((line) => {
        const truncated = truncateAnsi3(line, maxLineWidth);
        return border("\u2502") + " " + truncated;
      });
      const displayOutput = borderedLines.join("\n");
      if (displayOutput.trim()) {
        this.addChild(new piTui.Text(displayOutput, 0, 0));
      }
    }
    this.addChild(new piTui.Text(`${border("\u2570\u2500\u2500")} ${footerText}`, 0, 0));
    if (done && this.exitCode !== 0) {
      this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("error", `  Exit code: ${this.exitCode}`), 0, 0));
    }
    this.invalidate();
  }
};

// src/tui/shell.ts
async function handleShellPassthrough(state, command) {
  if (!command) {
    showInfo(state, "Usage: !<command> (e.g., !ls -la)");
    return;
  }
  const component = new ShellStreamComponent(command);
  state.chatContainer.addChild(component);
  state.ui.requestRender();
  try {
    const { execa } = await import('execa');
    const subprocess = execa(command, {
      shell: true,
      cwd: process.cwd(),
      reject: false,
      timeout: 3e4,
      env: {
        ...process.env,
        FORCE_COLOR: "1"
      }
    });
    if (subprocess.stdout) {
      subprocess.stdout.setEncoding("utf8");
      subprocess.stdout.on("data", (chunk) => {
        component.appendOutput(chunk);
        state.ui.requestRender();
      });
    }
    if (subprocess.stderr) {
      subprocess.stderr.setEncoding("utf8");
      subprocess.stderr.on("data", (chunk) => {
        component.appendOutput(chunk);
        state.ui.requestRender();
      });
    }
    const result = await subprocess;
    component.finish(result.exitCode ?? 0);
    state.ui.requestRender();
  } catch (error) {
    component.finish(1);
    state.ui.requestRender();
    showError(state, error instanceof Error ? error.message : "Shell command failed");
  }
}
function getClipboardText() {
  try {
    if (process.platform === "darwin") {
      const text = child_process.execSync("pbpaste", {
        encoding: "utf-8",
        timeout: 3e3,
        stdio: ["pipe", "pipe", "pipe"]
      });
      return text.length > 0 ? text : null;
    }
    if (process.platform === "linux") {
      try {
        const text = child_process.execSync("xclip -selection clipboard -o", {
          encoding: "utf-8",
          timeout: 3e3,
          stdio: ["pipe", "pipe", "pipe"]
        });
        return text.length > 0 ? text : null;
      } catch {
        const text = child_process.execSync("wl-paste", {
          encoding: "utf-8",
          timeout: 3e3,
          stdio: ["pipe", "pipe", "pipe"]
        });
        return text.length > 0 ? text : null;
      }
    }
    return null;
  } catch {
    return null;
  }
}
function getClipboardImage() {
  try {
    if (process.platform === "darwin") {
      return getMacClipboardImage();
    }
    if (process.platform === "linux") {
      return getLinuxClipboardImage();
    }
    return null;
  } catch {
    return null;
  }
}
function getMacClipboardImage() {
  return tryReadMacClipboardImage({
    coercion: "\xABclass PNGf\xBB",
    extension: "png",
    mimeType: "image/png"
  }) ?? tryReadMacClipboardImage({
    coercion: "TIFF picture",
    extension: "tiff",
    mimeType: "image/tiff"
  }) ?? tryReadMacClipboardImage({
    coercion: "\xABclass TIFF\xBB",
    extension: "tiff",
    mimeType: "image/tiff"
  });
}
function tryReadMacClipboardImage({
  coercion,
  extension,
  mimeType
}) {
  const tmpFile = path6.join(os.tmpdir(), `mastra-clipboard-${Date.now()}.${extension}`);
  try {
    const script = `
			set theImage to the clipboard as ${coercion}
			set theFile to open for access POSIX file "${tmpFile}" with write permission
			write theImage to theFile
			close access theFile
		`;
    child_process.execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout: 5e3,
      stdio: ["pipe", "pipe", "pipe"]
    });
    const buffer = fs2.readFileSync(tmpFile);
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      return null;
    }
    return {
      data: buffer.toString("base64"),
      mimeType
    };
  } catch {
    return null;
  } finally {
    try {
      fs2.unlinkSync(tmpFile);
    } catch {
    }
  }
}
function getLinuxClipboardImage() {
  return getLinuxClipboardImageXclip() ?? getLinuxClipboardImageWlPaste();
}
function getLinuxClipboardImageXclip() {
  try {
    const targets = child_process.execSync("xclip -selection clipboard -target TARGETS -o", {
      encoding: "utf-8",
      timeout: 3e3,
      stdio: ["pipe", "pipe", "pipe"]
    });
    if (!targets.includes("image/png")) {
      return null;
    }
    const buffer = child_process.execSync("xclip -selection clipboard -target image/png -o", {
      timeout: 5e3,
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 50 * 1024 * 1024
      // 50MB max
    });
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      return null;
    }
    return {
      data: buffer.toString("base64"),
      mimeType: "image/png"
    };
  } catch {
    return null;
  }
}
function getLinuxClipboardImageWlPaste() {
  try {
    const types = child_process.execSync("wl-paste --list-types", {
      encoding: "utf-8",
      timeout: 3e3,
      stdio: ["pipe", "pipe", "pipe"]
    });
    if (!types.includes("image/png")) {
      return null;
    }
    const buffer = child_process.execSync("wl-paste --type image/png", {
      timeout: 5e3,
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 50 * 1024 * 1024
    });
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      return null;
    }
    return {
      data: buffer.toString("base64"),
      mimeType: "image/png"
    };
  } catch {
    return null;
  }
}

// src/tui/components/custom-editor.ts
var PASTE_START = "\x1B[200~";
var PASTE_END = "\x1B[201~";
var IMAGE_MIME_TYPES_BY_EXTENSION = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".heic": "image/heic",
  ".heif": "image/heif"
};
var ANSI_STRIP_RE = /\x1b\[[0-9;]*m/g;
var SLASH_CURSOR_RE = /\x1b\[7m\/\x1b\[0m/;
var AT_CURSOR_RE = /\x1b\[7m@\x1b\[0m/;
function parseHex(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
var DEFAULT_PROMPT_ICON = "\u2022";
var PROMPT_ICON_CHOICES = [
  "\u262F",
  "\u273A",
  "\u263B",
  "\u273F",
  "\u25D2",
  "\u25D3",
  "\u265E",
  "\u2618",
  "\u2638",
  "\u2742",
  "\u2741",
  "\u273D",
  "\u2749",
  "\u2739",
  "\u2768",
  "\u2769",
  "\u271A",
  "\u2689",
  "\u2763",
  "\u2765",
  "\u266B",
  "\u2764"
];
function getRandomPromptIcon(currentIcon) {
  if (Math.random() < 0.99) {
    return DEFAULT_PROMPT_ICON;
  }
  const nextChoices = PROMPT_ICON_CHOICES.filter((icon) => icon !== currentIcon);
  const choices = nextChoices.length > 0 ? nextChoices : PROMPT_ICON_CHOICES;
  return choices[Math.floor(Math.random() * choices.length)];
}
var CustomEditor = class extends piTui.Editor {
  actionHandlers = /* @__PURE__ */ new Map();
  onCtrlD;
  escapeEnabled = true;
  onImagePaste;
  getModeColor;
  getPromptAnimator;
  pendingBracketedPaste = null;
  _cachedModeColorHex;
  _cachedColorFn;
  promptIcon = DEFAULT_PROMPT_ICON;
  lastPromptWasInvisible = false;
  constructor(tui, theme2) {
    super(tui, theme2);
    this.getBestAutocompleteMatchIndex = (items, prefix) => {
      if (!prefix) {
        return -1;
      }
      const normalizeSlashCommandValue = (value) => value.replace(/^\/+/, "");
      const shouldNormalizeSlashCommand = prefix.startsWith("/");
      const normalizedPrefix = shouldNormalizeSlashCommand ? normalizeSlashCommandValue(prefix) : prefix;
      let firstPrefixIndex = -1;
      for (let i = 0; i < items.length; i++) {
        const value = items[i]?.value ?? "";
        const comparableValue = shouldNormalizeSlashCommand ? normalizeSlashCommandValue(value) : value;
        if (comparableValue === normalizedPrefix) {
          return i;
        }
        if (firstPrefixIndex === -1 && comparableValue.startsWith(normalizedPrefix)) {
          firstPrefixIndex = i;
        }
      }
      return firstPrefixIndex;
    };
  }
  onAction(action, handler) {
    this.actionHandlers.set(action, handler);
  }
  render(width) {
    const text = this.getText().trimStart();
    const isSlash = text.startsWith("/");
    const isAt = text.startsWith("@");
    const color = this.getModeColor?.() || chunkWOKNPWRC_cjs.mastra.green;
    const promptAnimator = this.getPromptAnimator?.();
    const shouldAnimatePrompt = !isSlash && !isAt;
    const isPromptAnimated = shouldAnimatePrompt && Boolean(promptAnimator?.isRunning());
    const fadeProgress = isPromptAnimated ? promptAnimator.getFadeProgress() : 1;
    const isTransitioningIn = isPromptAnimated && promptAnimator.isFadingIn();
    const isTransitioningOut = isPromptAnimated && promptAnimator.isFadingOut();
    const promptOffset = isPromptAnimated ? promptAnimator.getOffset() : 0;
    const pulseWave = isPromptAnimated ? (Math.sin(promptOffset * Math.PI * 2) + 1) / 2 : 0;
    const transitionPhase = isTransitioningIn || isTransitioningOut ? 1 - fadeProgress : 1;
    const chevronBrightness = isPromptAnimated ? isTransitioningIn ? transitionPhase < 0.5 ? Math.max(0, 1 - transitionPhase * 2) : 0 : isTransitioningOut ? transitionPhase <= 0.5 ? Math.max(0, 1 - transitionPhase * 2) : 0 : 0 : 1;
    const dotBrightness = isPromptAnimated ? isTransitioningIn ? transitionPhase <= 0.5 ? 0 : Math.max(0, (transitionPhase - 0.5) * 2) : isTransitioningOut ? transitionPhase < 0.5 ? 0 : Math.max(0, (transitionPhase - 0.5) * 2) : pulseWave : 0;
    const isSteadyPulse = isPromptAnimated && !isTransitioningIn && !isTransitioningOut;
    if (!isPromptAnimated) {
      this.promptIcon = DEFAULT_PROMPT_ICON;
      this.lastPromptWasInvisible = false;
    } else if (!isSteadyPulse) {
      this.lastPromptWasInvisible = false;
    }
    const promptIsInvisible = isSteadyPulse && dotBrightness <= 0.05;
    if (promptIsInvisible && !this.lastPromptWasInvisible) {
      this.promptIcon = getRandomPromptIcon(this.promptIcon);
    }
    this.lastPromptWasInvisible = promptIsInvisible;
    const promptChar = isSlash ? "/" : isAt ? "@" : chevronBrightness > 0.05 ? "\u203A" : dotBrightness > 0.05 ? this.promptIcon : " ";
    const promptBrightness = isPromptAnimated ? Math.max(chevronBrightness, dotBrightness) : 1;
    if (this._cachedModeColorHex !== color) {
      this._cachedModeColorHex = color;
      this._cachedColorFn = chalk8__default.default.hex(color);
    }
    const colorFn = this._cachedColorFn;
    const b = colorFn;
    const [r, g, bValue] = parseHex(color);
    const prompt = chalk8__default.default.bold.rgb(
      Math.round(r * promptBrightness),
      Math.round(g * promptBrightness),
      Math.round(bValue * promptBrightness)
    )(promptChar);
    const promptWidth = 4;
    const contentWidth = width - 6;
    const editorLines = super.render(contentWidth);
    const contentLines = [];
    const scrollIndicators = [];
    let isTop = true;
    for (const line of editorLines) {
      const stripped = line.replace(ANSI_STRIP_RE, "");
      if (stripped.length > 0 && stripped[0] === "\u2500") {
        if (isTop) {
          isTop = false;
          continue;
        }
        if (stripped.includes("\u2191") || stripped.includes("\u2193")) {
          scrollIndicators.push(b(stripped));
          continue;
        }
        continue;
      }
      contentLines.push(line);
    }
    if ((isSlash || isAt) && contentLines.length > 0) {
      let l = contentLines[0];
      const char = isSlash ? "/" : "@";
      l = l.replace(isSlash ? SLASH_CURSOR_RE : AT_CURSOR_RE, "");
      const idx = l.indexOf(char);
      if (idx !== -1) {
        l = l.slice(0, idx) + l.slice(idx + 1);
      }
      contentLines[0] = l;
    }
    const result = [];
    const hBarLen = width - 2;
    const top = b("\u256D") + b("\u2500").repeat(hBarLen) + b("\u256E");
    const leftBorder = b("\u2502");
    const rightBorder = b("\u2502");
    const bottom = b("\u2570") + b("\u2500").repeat(hBarLen) + b("\u256F");
    const textColorOpen = `\x1B[38;2;${parseHex(chunkWOKNPWRC_cjs.theme.getTheme().text).join(";")}m`;
    const textColorClose = "\x1B[39m";
    result.push(top);
    for (let i = 0; i < contentLines.length; i++) {
      const line = `${textColorOpen}${contentLines[i]}${textColorClose}`;
      if (i === 0) {
        result.push(`${leftBorder} ${prompt} ${line} ${rightBorder}`);
      } else {
        result.push(`${leftBorder}${" ".repeat(promptWidth - 1)}${line} ${rightBorder}`);
      }
    }
    result.push(bottom);
    for (const ind of scrollIndicators) {
      result.push(ind);
    }
    return result;
  }
  maybeHandleBracketedPaste(data) {
    const pasteStartIndex = this.pendingBracketedPaste ? -1 : data.indexOf(PASTE_START);
    if (!this.pendingBracketedPaste && pasteStartIndex === -1) {
      return false;
    }
    const beforePaste = this.pendingBracketedPaste ? "" : data.slice(0, pasteStartIndex);
    const pasteChunk = this.pendingBracketedPaste ? `${this.pendingBracketedPaste}${data}` : data.slice(pasteStartIndex);
    if (beforePaste) {
      super.handleInput(beforePaste);
    }
    const pasteEndIndex = pasteChunk.indexOf(PASTE_END);
    if (pasteEndIndex === -1) {
      this.pendingBracketedPaste = pasteChunk;
      return true;
    }
    this.pendingBracketedPaste = null;
    const pasteContent = pasteChunk.slice(PASTE_START.length, pasteEndIndex);
    const afterPaste = pasteChunk.slice(pasteEndIndex + PASTE_END.length);
    if (this.shouldPasteClipboardImage(pasteContent)) {
      const clipboardImage = getClipboardImage();
      if (clipboardImage) {
        this.onImagePaste?.(clipboardImage);
        if (afterPaste.length > 0) {
          this.handleInput(afterPaste);
        }
        return true;
      }
    }
    const clipboardImageForRemoteUrl = this.getClipboardImageForPastedRemoteImageUrl(pasteContent);
    if (clipboardImageForRemoteUrl) {
      this.onImagePaste?.(clipboardImageForRemoteUrl);
      if (afterPaste.length > 0) {
        this.handleInput(afterPaste);
      }
      return true;
    }
    const pastedImageSource = this.readPastedImageSource(pasteContent);
    if (pastedImageSource) {
      this.onImagePaste?.(pastedImageSource);
      if (afterPaste.length > 0) {
        this.handleInput(afterPaste);
      }
      return true;
    }
    super.handleInput(`${PASTE_START}${pasteContent}${PASTE_END}`);
    if (afterPaste.length > 0) {
      this.handleInput(afterPaste);
    }
    return true;
  }
  shouldPasteClipboardImage(pasteContent) {
    return Boolean(this.onImagePaste) && pasteContent.trim().length === 0;
  }
  getClipboardImageForPastedRemoteImageUrl(pasteContent) {
    if (!this.onImagePaste) {
      return null;
    }
    if (!this.normalizePastedImageUrl(this.normalizePastedPathLike(pasteContent) ?? "")) {
      return null;
    }
    return getClipboardImage();
  }
  readPastedImageSource(pasteContent) {
    if (!this.onImagePaste) {
      return null;
    }
    const normalizedPaste = this.normalizePastedPathLike(pasteContent);
    if (!normalizedPaste) {
      return null;
    }
    const imageUrl = this.normalizePastedImageUrl(normalizedPaste);
    if (imageUrl) {
      const mimeType2 = this.getImageMimeType(imageUrl);
      return mimeType2 ? {
        data: imageUrl,
        mimeType: mimeType2
      } : null;
    }
    const filePath = this.normalizePastedFilePath(normalizedPaste);
    if (!filePath) {
      return null;
    }
    const mimeType = this.getImageMimeType(filePath);
    if (!mimeType) {
      return null;
    }
    try {
      if (!fs2.statSync(filePath).isFile()) {
        return null;
      }
      return {
        data: fs2.readFileSync(filePath).toString("base64"),
        mimeType
      };
    } catch {
      return null;
    }
  }
  normalizePastedPathLike(pasteContent) {
    const trimmed = pasteContent.trim();
    if (!trimmed || trimmed.includes("\n")) {
      return null;
    }
    const unquoted = trimmed.startsWith('"') && trimmed.endsWith('"') || trimmed.startsWith("'") && trimmed.endsWith("'") ? trimmed.slice(1, -1) : trimmed;
    return unquoted.replace(/\\([ !$&'()\[\]{}])/g, "$1");
  }
  normalizePastedImageUrl(pasteContent) {
    if (!/^https?:\/\//i.test(pasteContent)) {
      return null;
    }
    try {
      const url = new URL(pasteContent);
      return this.getImageMimeType(url.toString()) ? url.toString() : null;
    } catch {
      return null;
    }
  }
  normalizePastedFilePath(pasteContent) {
    if (/^https?:\/\//i.test(pasteContent)) {
      return null;
    }
    if (/^file:\/\//i.test(pasteContent)) {
      try {
        return url.fileURLToPath(pasteContent);
      } catch {
        return null;
      }
    }
    return pasteContent;
  }
  getImageMimeType(pathOrUrl) {
    const extensionSource = /^https?:\/\//i.test(pathOrUrl) ? new URL(pathOrUrl).pathname : pathOrUrl;
    return IMAGE_MIME_TYPES_BY_EXTENSION[path6.extname(extensionSource).toLowerCase()] ?? null;
  }
  handleExplicitPaste() {
    if (this.onImagePaste) {
      const clipboardImage = getClipboardImage();
      if (clipboardImage) {
        this.onImagePaste(clipboardImage);
        return true;
      }
    }
    const clipboardText = getClipboardText();
    if (clipboardText) {
      const syntheticPaste = `${PASTE_START}${clipboardText}${PASTE_END}`;
      super.handleInput(syntheticPaste);
      return true;
    }
    return true;
  }
  handleInput(data) {
    if (this.maybeHandleBracketedPaste(data)) {
      return;
    }
    if (piTui.matchesKey(data, "ctrl+v") || piTui.matchesKey(data, "alt+v")) {
      this.handleExplicitPaste();
      return;
    }
    if (piTui.matchesKey(data, "ctrl+c")) {
      const handler = this.actionHandlers.get("clear");
      if (handler) {
        handler();
        return;
      }
    }
    if (piTui.matchesKey(data, "escape") && this.escapeEnabled) {
      const handler = this.actionHandlers.get("clear");
      if (handler) {
        handler();
        return;
      }
    }
    if (piTui.matchesKey(data, "ctrl+d")) {
      if (this.getText().length === 0) {
        const handler = this.onCtrlD ?? this.actionHandlers.get("exit");
        if (handler) handler();
      }
      return;
    }
    if (piTui.matchesKey(data, "ctrl+z")) {
      const handler = this.actionHandlers.get("suspend");
      if (handler) {
        handler();
        return;
      }
    }
    if (piTui.matchesKey(data, "alt+z")) {
      const handler = this.actionHandlers.get("undo");
      if (handler) {
        handler();
        return;
      }
    }
    if (piTui.matchesKey(data, "ctrl+t")) {
      const handler = this.actionHandlers.get("toggleThinking");
      if (handler) {
        handler();
        return;
      }
    }
    if (piTui.matchesKey(data, "ctrl+e")) {
      const handler = this.actionHandlers.get("expandTools");
      if (handler) {
        handler();
        return;
      }
    }
    if (piTui.matchesKey(data, "enter")) {
      const lines = this.state?.lines;
      const cursorCol = this.state?.cursorCol;
      const currentLine = lines?.[this.state?.cursorLine] || "";
      if (cursorCol > 0 && currentLine[cursorCol - 1] === "\\") {
        super.handleInput(data);
        return;
      }
      const handler = this.actionHandlers.get("followUp");
      if (handler) {
        if (this.isShowingAutocomplete()) {
          super.handleInput("	");
          if (this.getText().trimStart().startsWith("/") && handler() !== false) {
            return;
          }
          return;
        }
        if (handler() !== false) {
          return;
        }
      }
    }
    if (piTui.matchesKey(data, "shift+tab")) {
      const handler = this.actionHandlers.get("cycleMode");
      if (handler) {
        handler();
        return;
      }
    }
    if (piTui.matchesKey(data, "ctrl+y")) {
      const handler = this.actionHandlers.get("toggleYolo");
      if (handler) {
        handler();
        return;
      }
    }
    super.handleInput(data);
  }
};

// src/tui/state.ts
function createTUIState(options) {
  const terminal = new piTui.ProcessTerminal();
  Object.defineProperty(terminal, "columns", {
    get: () => (process.stdout.columns || 80) - chunkWOKNPWRC_cjs.TERM_WIDTH_BUFFER
  });
  const ui = new piTui.TUI(terminal);
  const chatContainer = new piTui.Container();
  const editorContainer = new piTui.Container();
  const footer = new piTui.Container();
  const editor = new CustomEditor(ui, chunkWOKNPWRC_cjs.getEditorTheme());
  editor.getModeColor = () => options.harness.getCurrentMode()?.color;
  const result = {
    // Core dependencies
    harness: options.harness,
    options,
    hookManager: options.hookManager,
    authStorage: options.authStorage,
    mcpManager: options.mcpManager,
    workspace: options.workspace,
    extension: options.extension,
    // TUI framework
    ui,
    chatContainer,
    editorContainer,
    editor,
    footer,
    terminal,
    // Agent / streaming
    isInitialized: false,
    pendingTools: /* @__PURE__ */ new Map(),
    taskWriteInsertIndex: -1,
    seenToolCallIds: /* @__PURE__ */ new Set(),
    subagentToolCallIds: /* @__PURE__ */ new Set(),
    currentRunSystemReminderKeys: /* @__PURE__ */ new Set(),
    allToolComponents: [],
    allSlashCommandComponents: [],
    allSystemReminderComponents: [],
    pendingSubagents: /* @__PURE__ */ new Map(),
    pendingTeams: /* @__PURE__ */ new Map(),
    toolOutputExpanded: false,
    hideThinkingBlock: true,
    quietMode: false,
    // Thread / conversation
    pendingNewThread: false,
    currentThreadTitle: void 0,
    threadPreviewCache: /* @__PURE__ */ new Map(),
    attemptedThreadPreviewIds: /* @__PURE__ */ new Set(),
    // Inline interaction
    lastClearedText: "",
    pendingAskUserComponents: /* @__PURE__ */ new Map(),
    pendingInlineQuestions: [],
    pendingFollowUpMessages: [],
    pendingQueuedActions: [],
    followUpComponents: [],
    pendingSlashCommands: [],
    pendingApprovalDismiss: null,
    // Status line
    projectInfo: chunkP2NLJLNZ_cjs.detectProject(process.cwd()),
    modelAuthStatus: { hasAuth: true },
    // Input
    customSlashCommands: [],
    pendingImages: [],
    // Abort tracking
    lastCtrlCTime: 0,
    userInitiatedAbort: false
  };
  return result;
}

// src/tui/mastra-tui.ts
var UPDATE_RECHECK_INTERVAL_MS = 45 * 60 * 1e3;
var IMAGE_PLACEHOLDER_PATTERN = /\[image\]\s*/g;
var CAFFEINATE_ARGS = ["-i", "-m"];
function shouldUseCaffeinate() {
  return process.platform === "darwin" && process.env.MASTRACODE_DISABLE_CAFFEINATE !== "1";
}
function consumePendingImages(text, pendingImages) {
  const imageMarkerCount = text.match(/\[image\]/g)?.length ?? 0;
  const images = imageMarkerCount > 0 ? pendingImages.slice(0, imageMarkerCount) : void 0;
  return {
    content: text.replace(IMAGE_PLACEHOLDER_PATTERN, "").trim(),
    images: images && images.length > 0 ? images : void 0
  };
}
var MastraTUI = class _MastraTUI {
  state;
  updateCheckTimer = null;
  hasShownUpdateBanner = false;
  caffeinateProcess = null;
  static DOUBLE_CTRL_C_MS = 500;
  constructor(options) {
    this.state = createTUIState(options);
    const savedSettings = chunkWOKNPWRC_cjs.loadSettings();
    this.state.quietMode = savedSettings.preferences.quietMode;
    const originalHandleInput = this.state.editor.handleInput.bind(this.state.editor);
    this.state.editor.handleInput = (data) => {
      if (this.state.activeInlinePlanApproval) {
        this.state.activeInlinePlanApproval.handleInput(data);
        return;
      }
      if (this.state.activeInlineQuestion) {
        this.state.activeInlineQuestion.handleInput(data);
        return;
      }
      if (this.state.activeOnboarding) {
        if (data === "") {
          this.state.activeOnboarding.cancel();
          this.state.activeOnboarding = void 0;
        } else {
          this.state.activeOnboarding.handleInput(data);
          return;
        }
      }
      originalHandleInput(data);
    };
    this.state.editor.onImagePaste = (image) => {
      this.state.pendingImages.push(image);
      this.state.editor.insertTextAtCursor?.("[image] ");
      this.state.ui.requestRender();
    };
    this.state.editor.getPromptAnimator = () => this.state.gradientAnimator;
    setupKeyboardShortcuts(this.state, {
      stop: () => this.stop(),
      doubleCtrlCMs: _MastraTUI.DOUBLE_CTRL_C_MS,
      queueFollowUpMessage: (text) => this.queueFollowUpMessage(text)
    });
  }
  // ===========================================================================
  // Public API
  // ===========================================================================
  /**
   * Run the TUI. This is the main entry point.
   */
  async run() {
    await this.init();
    const hookMgr = this.state.hookManager;
    if (hookMgr) {
      hookMgr.runSessionStart().catch(() => {
      });
    }
    if (this.state.options.initialMessage) {
      this.fireMessage(this.state.options.initialMessage);
    }
    while (true) {
      const userInput = await this.getUserInput();
      if (!userInput.trim()) continue;
      try {
        if (userInput.startsWith("/")) {
          const handled = await this.handleSlashCommand(userInput);
          if (handled) continue;
        }
        if (userInput.startsWith("!")) {
          await handleShellPassthrough(this.state, userInput.slice(1).trim());
          continue;
        }
        if (this.state.pendingNewThread) {
          await this.state.harness.createThread();
          this.state.pendingNewThread = false;
        }
        if (!this.state.harness.hasModelSelected()) {
          showInfo(this.state, "No model selected. Use /models to select a model, or /login to authenticate.");
          continue;
        }
        const allowed = await this.runUserPromptHook(userInput);
        if (!allowed) {
          continue;
        }
        const { content, images } = consumePendingImages(userInput, this.state.pendingImages);
        this.state.pendingImages = [];
        addUserMessage(this.state, {
          content: [
            { type: "text", text: content },
            ...images?.map((img) => ({
              type: "image",
              data: img.data,
              mimeType: img.mimeType
            })) ?? []
          ]});
        this.state.ui.requestRender();
        this.fireMessage(content, images);
      } catch (error) {
        showError(this.state, error instanceof Error ? error.message : "Unknown error");
      }
    }
  }
  /**
   * Fire off a message without blocking the main loop.
   * Errors are handled via harness events.
   */
  fireMessage(content, images) {
    const files = images?.map((img) => ({ data: img.data, mediaType: img.mimeType }));
    this.state.extension.harnessAdapter.sendMessage(this.state.harness, { content, files }).catch((error) => {
      showError(this.state, error instanceof Error ? error.message : "Unknown error");
    });
  }
  queueFollowUpMessage(text) {
    if (text.startsWith("/")) {
      this.state.pendingSlashCommands.push(text);
      this.state.pendingQueuedActions.push("slash");
      updateStatusLine(this.state);
      this.state.ui.requestRender();
      return;
    }
    const { content, images } = consumePendingImages(text, this.state.pendingImages);
    this.state.pendingImages = [];
    this.state.pendingFollowUpMessages.push({ content, images });
    this.state.pendingQueuedActions.push("message");
    updateStatusLine(this.state);
    this.state.ui.requestRender();
  }
  /**
   * Stop the TUI and clean up.
   */
  stop() {
    this.stopCaffeinate();
    const hookMgr = this.state.hookManager;
    if (hookMgr) {
      hookMgr.runSessionEnd().catch(() => {
      });
    }
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.updateCheckTimer = null;
    }
    if (this.state.unsubscribe) {
      this.state.unsubscribe();
    }
    this.state.ui.stop();
  }
  // ===========================================================================
  // Initialization
  // ===========================================================================
  async init() {
    if (this.state.isInitialized) return;
    await this.state.extension.harnessAdapter.initHarness(this.state.harness);
    await promptForThreadSelection(this.state);
    await loadCustomSlashCommands(this.state);
    setupAutocomplete(this.state);
    buildLayout(this.state, () => this.refreshModelAuthStatus());
    setupKeyHandlers(this.state, {
      stop: () => this.stop(),
      doubleCtrlCMs: _MastraTUI.DOUBLE_CTRL_C_MS
    });
    subscribeToHarness(this.state, (event) => this.handleEvent(event));
    const escState = this.state.harness.getState();
    if (escState?.escapeAsCancel === false) {
      this.state.editor.escapeEnabled = false;
    }
    await this.state.harness.loadOMProgress();
    const initThreadId = this.state.harness.getCurrentThreadId();
    if (initThreadId) {
      const initThreads = await this.state.harness.listThreads();
      const initThread = initThreads.find((t) => t.id === initThreadId);
      if (initThread?.title) {
        this.state.currentThreadTitle = initThread.title;
      }
    }
    this.state.ui.start();
    this.state.isInitialized = true;
    if (this.state.mcpManager?.hasServers()) {
      const serverCount = Object.keys(this.state.mcpManager.getConfig().mcpServers ?? {}).length;
      showInfo(this.state, `MCP: Connecting to ${serverCount} server(s)...`);
      this.state.mcpManager.initInBackground().then((result) => {
        if (result.connected.length > 0) {
          showInfo(this.state, `MCP: ${result.connected.length} server(s) connected, ${result.totalTools} tool(s)`);
        }
        for (const s of result.failed) {
          showInfo(this.state, `MCP: Failed to connect to "${s.name}": ${s.error}`);
        }
        for (const s of result.skipped) {
          showInfo(this.state, `MCP: Skipped "${s.name}": ${s.reason}`);
        }
      }).catch((error) => {
        showInfo(this.state, `MCP: Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      });
    }
    updateTerminalTitle(this.state);
    await renderExistingMessages(this.state);
    await renderExistingTasks(this.state);
    if (this.shouldShowOnboarding()) {
      await this.showOnboarding();
    }
    await this.checkForUpdate();
    this.updateCheckTimer = setInterval(() => {
      void this.checkForUpdate(
        /* passive */
        true
      );
    }, UPDATE_RECHECK_INTERVAL_MS);
  }
  async refreshModelAuthStatus() {
    this.state.modelAuthStatus = await this.state.harness.getCurrentModelAuthStatus();
    updateStatusLine(this.state);
  }
  // ===========================================================================
  // Event Handling
  // ===========================================================================
  /** Cached event context – built once, reused for every event. */
  _ectx;
  getEventContext() {
    if (!this._ectx) {
      this._ectx = this.buildEventContext();
    }
    return this._ectx;
  }
  async handleEvent(event) {
    if (event.type === "agent_start") {
      this.startCaffeinate();
    }
    try {
      await dispatchEvent(event, this.getEventContext(), this.state);
      if (event.type === "thread_created") {
        await this.syncThreadActivePackMetadata(event.thread);
      } else if (event.type === "thread_changed") {
        await this.syncThreadActivePackMetadata();
      }
      if (event.type === "agent_end") {
        const stopReason = event.reason === "aborted" ? "aborted" : event.reason === "error" ? "error" : "complete";
        await this.runStopHook(stopReason);
      }
    } finally {
      if (event.type === "agent_end") {
        this.stopCaffeinate();
      }
    }
  }
  startCaffeinate() {
    if (!shouldUseCaffeinate() || this.caffeinateProcess) {
      return;
    }
    try {
      const child = child_process.spawn("caffeinate", CAFFEINATE_ARGS, {
        stdio: "ignore"
      });
      child.once("error", () => {
        if (this.caffeinateProcess === child) {
          this.caffeinateProcess = null;
        }
      });
      child.once("exit", () => {
        if (this.caffeinateProcess === child) {
          this.caffeinateProcess = null;
        }
      });
      this.caffeinateProcess = child;
    } catch {
      this.caffeinateProcess = null;
    }
  }
  stopCaffeinate() {
    const child = this.caffeinateProcess;
    if (!child) {
      return;
    }
    this.caffeinateProcess = null;
    child.kill();
  }
  async buildProviderAccess() {
    const models = await this.state.harness.listAvailableModels();
    const hasEnv = (provider) => models.some((m) => m.provider === provider && m.hasApiKey);
    const accessLevel = (storageProviderId) => {
      const cred = this.state.authStorage?.get(storageProviderId);
      if (cred?.type === "oauth") return "oauth";
      if (cred?.type === "api_key" && cred.key.trim().length > 0) return "apikey";
      return false;
    };
    const access = {
      anthropic: accessLevel("anthropic"),
      openai: accessLevel("openai-codex"),
      cerebras: hasEnv("cerebras") ? "apikey" : false,
      google: hasEnv("google") ? "apikey" : false,
      deepseek: hasEnv("deepseek") ? "apikey" : false
    };
    const mgKey = this.state.authStorage?.getStoredApiKey(chunkWOKNPWRC_cjs.MEMORY_GATEWAY_PROVIDER) ?? process.env["MASTRA_GATEWAY_API_KEY"];
    if (mgKey) {
      if (!access.anthropic) access.anthropic = "apikey";
      if (!access.openai) access.openai = "apikey";
    }
    const seen = new Set(Object.keys(access));
    for (const m of models) {
      if (!seen.has(m.provider) && m.hasApiKey) {
        access[m.provider] = "apikey";
        seen.add(m.provider);
      }
    }
    return access;
  }
  async syncThreadActivePackMetadata(thread) {
    const settings = chunkWOKNPWRC_cjs.loadSettings();
    const currentThreadId = this.state.harness.getCurrentThreadId();
    if (!currentThreadId) return;
    const resolvedThread = thread?.id === currentThreadId ? thread : (await this.state.harness.listThreads()).find((t) => t.id === currentThreadId);
    const access = await this.buildProviderAccess();
    const packs = chunkWOKNPWRC_cjs.getAvailableModePacks(access, settings.customModelPacks).filter((p) => p.id !== "custom");
    const resolvedPackId = chunkWOKNPWRC_cjs.resolveThreadActiveModelPackId(
      settings,
      packs,
      resolvedThread?.metadata
    );
    if (resolvedPackId && settings.models.activeModelPackId !== resolvedPackId) {
      const fresh = chunkWOKNPWRC_cjs.loadSettings();
      if (fresh.models.activeModelPackId !== resolvedPackId) {
        fresh.models.activeModelPackId = resolvedPackId;
        chunkWOKNPWRC_cjs.saveSettings(fresh);
      }
    }
  }
  showHookWarnings(event, warnings) {
    for (const warning of warnings) {
      showInfo(this.state, `[${event}] ${warning}`);
    }
  }
  async runStopHook(stopReason) {
    const hookMgr = this.state.hookManager;
    if (!hookMgr) return;
    try {
      const result = await hookMgr.runStop(void 0, stopReason);
      this.showHookWarnings("Stop", result.warnings);
      if (!result.allowed && result.blockReason) {
        showError(this.state, `Stop hook blocked: ${result.blockReason}`);
      }
    } catch (error) {
      showError(this.state, `Stop hook failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async runUserPromptHook(userInput) {
    const hookMgr = this.state.hookManager;
    if (!hookMgr) return true;
    try {
      const result = await hookMgr.runUserPromptSubmit(userInput);
      this.showHookWarnings("UserPromptSubmit", result.warnings);
      if (!result.allowed) {
        showError(this.state, result.blockReason || "Blocked by UserPromptSubmit hook");
        return false;
      }
      return true;
    } catch (error) {
      showError(this.state, `UserPromptSubmit hook failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  // ===========================================================================
  /**
   * Insert a child into the chat container before any follow-up user messages.
   * If no follow-ups are pending, appends to end.
   */
  addChildBeforeFollowUps(child) {
    if (this.state.followUpComponents.length > 0) {
      const firstFollowUp = this.state.followUpComponents[0];
      const idx = this.state.chatContainer.children.indexOf(firstFollowUp);
      if (idx >= 0) {
        this.state.chatContainer.children.splice(idx, 0, child);
        this.state.chatContainer.invalidate();
        return;
      }
    }
    this.state.chatContainer.addChild(child);
  }
  // ===========================================================================
  // User Input
  // ===========================================================================
  getUserInput() {
    return new Promise((resolve3) => {
      this.state.editor.onSubmit = (text) => {
        if (text.trim()) {
          this.state.editor.addToHistory(text);
        }
        this.state.editor.setText("");
        if (this.state.harness.isRunning()) {
          this.queueFollowUpMessage(text);
          return;
        }
        resolve3(text);
      };
    });
  }
  /**
   * Get the workspace, preferring harness-owned workspace over the direct option.
   */
  getResolvedWorkspace() {
    return this.state.harness.getWorkspace() ?? this.state.workspace;
  }
  // ===========================================================================
  // Observational Memory Settings
  // ===========================================================================
  // ===========================================================================
  // Login Selector
  // ===========================================================================
  // ===========================================================================
  // Slash Commands
  // ===========================================================================
  buildCommandContext() {
    return {
      state: this.state,
      harness: this.state.harness,
      hookManager: this.state.hookManager,
      mcpManager: this.state.mcpManager,
      authStorage: this.state.authStorage,
      customSlashCommands: this.state.customSlashCommands,
      extension: this.state.extension,
      showInfo: (msg) => showInfo(this.state, msg),
      showError: (msg) => showError(this.state, msg),
      updateStatusLine: () => updateStatusLine(this.state),
      stop: () => this.stop(),
      getResolvedWorkspace: () => this.getResolvedWorkspace(),
      addUserMessage: (msg) => addUserMessage(this.state, msg),
      renderExistingMessages: () => renderExistingMessages(this.state),
      showOnboarding: () => this.showOnboarding()
    };
  }
  buildEventContext() {
    return {
      state: this.state,
      showInfo: (msg) => showInfo(this.state, msg),
      showError: (msg) => showError(this.state, msg),
      showFormattedError: (event) => showFormattedError(this.state, event),
      updateStatusLine: () => updateStatusLine(this.state),
      notify: (reason, message) => notify(this.state, reason, message),
      handleSlashCommand: (input) => this.handleSlashCommand(input),
      addUserMessage: (msg) => addUserMessage(this.state, msg),
      addChildBeforeFollowUps: (child) => this.addChildBeforeFollowUps(child),
      fireMessage: (content, images) => this.fireMessage(content, images),
      queueFollowUpMessage: (content) => this.queueFollowUpMessage(content),
      renderExistingMessages: () => renderExistingMessages(this.state),
      renderCompletedTasksInline: (tasks, insertIndex, collapsed) => renderCompletedTasksInline(this.state, tasks, insertIndex, collapsed),
      renderClearedTasksInline: (clearedTasks, insertIndex) => renderClearedTasksInline(this.state, clearedTasks, insertIndex),
      refreshModelAuthStatus: () => this.refreshModelAuthStatus()
    };
  }
  async handleSlashCommand(input) {
    return dispatchSlashCommand(input, this.state, () => this.buildCommandContext());
  }
  // ===========================================================================
  // Login (used by onboarding)
  // ===========================================================================
  async performLogin(providerId) {
    const provider = chunkP2NLJLNZ_cjs.getOAuthProviders().find((p) => p.id === providerId);
    const providerName = provider?.name || providerId;
    if (!this.state.authStorage) {
      showError(this.state, "Auth storage not configured");
      return;
    }
    return new Promise((resolve3) => {
      const dialog = new LoginDialogComponent(this.state.ui, providerId, (success, message) => {
        this.state.ui.hideOverlay();
        if (success) {
          showInfo(this.state, `Successfully logged in to ${providerName}`);
        } else if (message) {
          showInfo(this.state, message);
        }
        resolve3();
      });
      this.state.ui.showOverlay(dialog, {
        width: "80%",
        maxHeight: "60%",
        anchor: "center"
      });
      dialog.focused = true;
      this.state.authStorage.login(providerId, {
        onAuth: (info) => {
          dialog.showAuth(info.url, info.instructions);
        },
        onPrompt: async (prompt) => {
          return dialog.showPrompt(prompt.message, prompt.placeholder);
        },
        onProgress: (message) => {
          dialog.showProgress(message);
        },
        signal: dialog.signal
      }).then(async () => {
        this.state.ui.hideOverlay();
        const { PROVIDER_DEFAULT_MODELS: PROVIDER_DEFAULT_MODELS2 } = await import('./storage-FHIJ2CJ5.cjs');
        const defaultModel = PROVIDER_DEFAULT_MODELS2[providerId];
        if (defaultModel) {
          await this.state.harness.switchModel({ modelId: defaultModel });
          showInfo(this.state, `Logged in to ${providerName} - switched to ${defaultModel}`);
        } else {
          showInfo(this.state, `Successfully logged in to ${providerName}`);
        }
        resolve3();
      }).catch((error) => {
        this.state.ui.hideOverlay();
        if (error.message !== "Login cancelled") {
          showError(this.state, `Failed to login: ${error.message}`);
        }
        resolve3();
      });
    });
  }
  // ===========================================================================
  // Onboarding
  // ===========================================================================
  async showOnboarding() {
    const allProviders = chunkP2NLJLNZ_cjs.getOAuthProviders();
    const authProviders = allProviders.map((p) => ({
      label: p.name,
      value: p.id,
      loggedIn: this.state.authStorage?.isLoggedIn(p.id) ?? false
    }));
    const access = await this.buildProviderAccess();
    const hasProviderAccess = Object.values(access).some(Boolean);
    const savedSettings = chunkWOKNPWRC_cjs.loadSettings();
    const modePacks = chunkWOKNPWRC_cjs.getAvailableModePacks(access, savedSettings.customModelPacks);
    const omPacks = chunkWOKNPWRC_cjs.getAvailableOmPacks(access);
    let prevModePackId = savedSettings.onboarding.modePackId;
    if (prevModePackId === "custom" && savedSettings.models.activeModelPackId?.startsWith("custom:")) {
      prevModePackId = savedSettings.models.activeModelPackId;
    }
    const previous = savedSettings.onboarding.completedAt ? {
      modePackId: prevModePackId,
      omPackId: savedSettings.onboarding.omPackId,
      yolo: savedSettings.preferences.yolo
    } : void 0;
    return new Promise((resolve3) => {
      const component = new OnboardingInlineComponent({
        tui: this.state.ui,
        authProviders,
        modePacks,
        omPacks,
        hasProviderAccess,
        previous,
        onComplete: async (result) => {
          this.state.activeOnboarding = void 0;
          await this.applyOnboardingResult(result);
          resolve3();
        },
        onCancel: () => {
          this.state.activeOnboarding = void 0;
          const settings = chunkWOKNPWRC_cjs.loadSettings();
          if (!settings.onboarding.completedAt) {
            settings.onboarding.skippedAt = (/* @__PURE__ */ new Date()).toISOString();
            settings.onboarding.version = chunkWOKNPWRC_cjs.ONBOARDING_VERSION;
            chunkWOKNPWRC_cjs.saveSettings(settings);
          }
          resolve3();
        },
        onLogin: (providerId, done) => {
          this.performLogin(providerId).then(async () => {
            try {
              const updatedAccess = await this.buildProviderAccess();
              const updatedHasAccess = Object.values(updatedAccess).some(Boolean);
              component.updateModePacks(chunkWOKNPWRC_cjs.getAvailableModePacks(updatedAccess, savedSettings.customModelPacks));
              component.updateOmPacks(chunkWOKNPWRC_cjs.getAvailableOmPacks(updatedAccess));
              component.updateHasProviderAccess(updatedHasAccess);
            } catch (err) {
              console.error("Failed to refresh provider access after login:", err);
            } finally {
              done();
            }
          });
        },
        onSelectModel: async (title, modeColor) => {
          const availableModels = await this.state.harness.listAvailableModels();
          if (availableModels.length === 0) return void 0;
          return new Promise((resolveModel) => {
            const selector = new ModelSelectorComponent({
              tui: this.state.ui,
              models: availableModels,
              currentModelId: void 0,
              title,
              titleColor: modeColor,
              onSelect: async (model) => {
                this.state.ui.hideOverlay();
                await promptForApiKeyIfNeeded(this.state.ui, model, this.state.authStorage);
                resolveModel(model.id);
              },
              onCancel: () => {
                this.state.ui.hideOverlay();
                resolveModel(void 0);
              }
            });
            this.state.ui.showOverlay(selector, {
              width: "80%",
              maxHeight: "60%",
              anchor: "center"
            });
            selector.focused = true;
          });
        }
      });
      this.state.activeOnboarding = component;
      this.state.chatContainer.addChild(new piTui.Spacer(1));
      this.state.chatContainer.addChild(component);
      this.state.chatContainer.addChild(new piTui.Spacer(1));
      this.state.ui.requestRender();
      this.state.chatContainer.invalidate();
    });
  }
  async applyOnboardingResult(result) {
    const harness = this.state.harness;
    const modePack = result.modePack;
    const modes = harness.listModes();
    for (const mode of modes) {
      const modelId = modePack.models[mode.id];
      if (modelId) {
        mode.defaultModelId = modelId;
        await harness.setThreadSetting({
          key: `modeModelId_${mode.id}`,
          value: modelId
        });
      }
    }
    const currentModeId = harness.getCurrentModeId();
    const currentModeModel = modePack.models[currentModeId];
    if (currentModeModel) {
      await harness.switchModel({ modelId: currentModeModel });
    }
    const subagentModeMap = { explore: "fast", plan: "plan", execute: "build" };
    for (const [agentType, modeId] of Object.entries(subagentModeMap)) {
      const saModelId = modePack.models[modeId];
      if (saModelId) {
        await harness.setSubagentModelId({ modelId: saModelId, agentType });
      }
    }
    const omPack = result.omPack;
    harness.setState({ observerModelId: omPack.modelId, reflectorModelId: omPack.modelId });
    harness.setState({ yolo: result.yolo });
    const settings = chunkWOKNPWRC_cjs.loadSettings();
    settings.onboarding.completedAt = (/* @__PURE__ */ new Date()).toISOString();
    settings.onboarding.skippedAt = null;
    settings.onboarding.version = chunkWOKNPWRC_cjs.ONBOARDING_VERSION;
    settings.onboarding.omPackId = omPack.id;
    const modeDefaults = {};
    for (const mode of modes) {
      const modelId = modePack.models[mode.id];
      if (modelId) modeDefaults[mode.id] = modelId;
    }
    let activeModePackId = modePack.id;
    if (modePack.id === "custom" || modePack.id.startsWith("custom:")) {
      const customName = modePack.id === "custom" ? modePack.name?.trim() || "Custom" : modePack.id.slice("custom:".length) || "Custom";
      activeModePackId = `custom:${customName}`;
      const entry = { name: customName, models: modeDefaults, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
      const idx = settings.customModelPacks.findIndex((p) => p.name === customName);
      if (idx >= 0) {
        settings.customModelPacks[idx] = entry;
      } else {
        settings.customModelPacks.push(entry);
      }
      settings.models.modeDefaults = modeDefaults;
    } else {
      settings.models.modeDefaults = {};
    }
    settings.onboarding.modePackId = activeModePackId;
    settings.models.activeModelPackId = activeModePackId;
    if (harness.getCurrentThreadId()) {
      await harness.setThreadSetting({ key: chunkWOKNPWRC_cjs.THREAD_ACTIVE_MODEL_PACK_ID_KEY, value: activeModePackId });
    }
    settings.models.activeOmPackId = omPack.id;
    settings.models.omModelOverride = omPack.id === "custom" ? omPack.modelId : null;
    settings.preferences.yolo = result.yolo;
    settings.models.subagentModels = {};
    chunkWOKNPWRC_cjs.saveSettings(settings);
    updateStatusLine(this.state);
    await this.refreshModelAuthStatus();
  }
  shouldShowOnboarding() {
    const settings = chunkWOKNPWRC_cjs.loadSettings();
    const ob = settings.onboarding;
    if (ob.completedAt || ob.skippedAt) {
      return ob.version < chunkWOKNPWRC_cjs.ONBOARDING_VERSION;
    }
    return true;
  }
  // ===========================================================================
  // Auto-Update
  // ===========================================================================
  /**
   * Check npm for a newer version and prompt the user to update.
   * - If the user previously dismissed this version, show a passive note instead.
   * - If the fetch fails or we're already up-to-date, silently return.
   * @param passive When true, only show an info message (used for periodic rechecks).
   */
  async checkForUpdate(passive = false) {
    const currentVersion = this.state.options.version;
    if (!currentVersion) return;
    const latestVersion = await fetchLatestVersion();
    if (!latestVersion || !isNewerVersion(currentVersion, latestVersion)) return;
    if (passive) {
      if (!this.hasShownUpdateBanner) {
        this.hasShownUpdateBanner = true;
        showInfo(
          this.state,
          `Update available: v${latestVersion} (current: v${currentVersion}). Run /update to update.`
        );
      }
      return;
    }
    const settings = chunkWOKNPWRC_cjs.loadSettings();
    if (settings.updateDismissedVersion && !isNewerVersion(settings.updateDismissedVersion, latestVersion)) {
      if (!this.hasShownUpdateBanner) {
        this.hasShownUpdateBanner = true;
        showInfo(
          this.state,
          `Update available: v${latestVersion} (current: v${currentVersion}). Run /update to update.`
        );
      }
      return;
    }
    const pm = await detectPackageManager();
    this.hasShownUpdateBanner = true;
    await this.showUpdatePrompt(currentVersion, latestVersion, pm);
  }
  /**
   * Show an inline Y/N prompt offering to auto-update.
   */
  showUpdatePrompt(currentVersion, latestVersion, pm) {
    return new Promise((resolve3) => {
      const questionComponent = new AskQuestionInlineComponent(
        {
          question: `A new version of Mastra Code is available: v${latestVersion} (current: v${currentVersion}). Would you like to update now?`,
          options: [
            { label: "Yes", description: "Update and restart" },
            { label: "No", description: "Skip this version" }
          ],
          formatResult: (answer) => answer === "Yes" ? "Updating\u2026" : "Update skipped.",
          onSubmit: async (answer) => {
            this.state.activeInlineQuestion = void 0;
            if (answer === "Yes") {
              showInfo(this.state, `Updating to v${latestVersion}\u2026`);
              const ok = await runUpdate(pm, latestVersion);
              if (ok) {
                showInfo(this.state, `Updated to v${latestVersion}. Please restart Mastra Code.`);
                this.stop();
                process.exit(0);
              } else {
                const cmd = getInstallCommand(pm, latestVersion);
                showError(this.state, `Auto-update failed. Run \`${cmd}\` manually.`);
              }
            } else {
              const settings = chunkWOKNPWRC_cjs.loadSettings();
              settings.updateDismissedVersion = latestVersion;
              chunkWOKNPWRC_cjs.saveSettings(settings);
              showInfo(this.state, `Update skipped. Run /update to update later.`);
            }
            resolve3();
          },
          onCancel: () => {
            this.state.activeInlineQuestion = void 0;
            const settings = chunkWOKNPWRC_cjs.loadSettings();
            settings.updateDismissedVersion = latestVersion;
            chunkWOKNPWRC_cjs.saveSettings(settings);
            resolve3();
          }
        },
        this.state.ui
      );
      this.state.activeInlineQuestion = questionComponent;
      this.state.chatContainer.addChild(questionComponent);
      this.state.chatContainer.addChild(new piTui.Spacer(1));
      this.state.ui.requestRender();
      this.state.chatContainer.invalidate();
    });
  }
};
var LoginSelectorComponent = class extends piTui.Box {
  listContainer;
  allProviders = [];
  selectedIndex = 0;
  mode;
  authSource;
  onSelectCallback;
  onCancelCallback;
  constructor(mode, authSource, onSelect, onCancel) {
    super(2, 1, (text) => chunkWOKNPWRC_cjs.theme.bg("overlayBg", text));
    this.mode = mode;
    this.authSource = authSource;
    this.onSelectCallback = onSelect;
    this.onCancelCallback = onCancel;
    this.loadProviders();
    const title = mode === "login" ? "Select provider to login:" : "Select provider to logout:";
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("text", title)));
    this.addChild(new piTui.Spacer(1));
    this.listContainer = new piTui.Container();
    this.addChild(this.listContainer);
    this.addChild(new piTui.Spacer(1));
    this.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", "Press Enter to select, Escape to cancel")));
    this.updateList();
  }
  loadProviders() {
    this.allProviders = this.authSource.getOAuthProviders().map((p) => ({ id: p.id, name: p.name }));
  }
  updateList() {
    this.listContainer.clear();
    for (let i = 0; i < this.allProviders.length; i++) {
      const provider = this.allProviders[i];
      if (!provider) continue;
      const isSelected = i === this.selectedIndex;
      const isLoggedIn = this.authSource.isLoggedIn(provider.id);
      const statusIndicator = isLoggedIn ? chunkWOKNPWRC_cjs.theme.fg("success", " \u2713 logged in") : "";
      let line = "";
      if (isSelected) {
        line = chunkWOKNPWRC_cjs.theme.fg("accent", "\u2192 " + provider.name) + statusIndicator;
      } else {
        line = "  " + provider.name + statusIndicator;
      }
      this.listContainer.addChild(new piTui.Text(line));
    }
    if (this.allProviders.length === 0) {
      const message = this.mode === "login" ? "No OAuth providers available" : "No OAuth providers logged in. Use /login first.";
      this.listContainer.addChild(new piTui.Text(chunkWOKNPWRC_cjs.theme.fg("muted", message)));
    }
  }
  handleInput(keyData) {
    const kb = piTui.getEditorKeybindings();
    if (kb.matches(keyData, "selectUp")) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateList();
    } else if (kb.matches(keyData, "selectDown")) {
      this.selectedIndex = Math.min(this.allProviders.length - 1, this.selectedIndex + 1);
      this.updateList();
    } else if (kb.matches(keyData, "selectConfirm")) {
      const selectedProvider = this.allProviders[this.selectedIndex];
      if (selectedProvider) {
        this.onSelectCallback(selectedProvider.id);
      }
    } else if (kb.matches(keyData, "selectCancel")) {
      this.onCancelCallback();
    }
  }
};

exports.AssistantMessageComponent = AssistantMessageComponent;
exports.LoginDialogComponent = LoginDialogComponent;
exports.LoginSelectorComponent = LoginSelectorComponent;
exports.MastraTUI = MastraTUI;
exports.ModelSelectorComponent = ModelSelectorComponent;
exports.OMProgressComponent = OMProgressComponent;
exports.ToolExecutionComponentEnhanced = ToolExecutionComponentEnhanced;
exports.UserMessageComponent = UserMessageComponent;
exports.createTUIState = createTUIState;
exports.detectTerminalTheme = detectTerminalTheme;
exports.formatOMStatus = formatOMStatus;
exports.getCurrentVersion = getCurrentVersion;
//# sourceMappingURL=chunk-V56WSTKE.cjs.map
//# sourceMappingURL=chunk-V56WSTKE.cjs.map