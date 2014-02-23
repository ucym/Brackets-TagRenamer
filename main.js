/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, _, window, $, CodeMirror */
define(function (require, exports, module) {
    "use strict";
    
    var CommandManager  = brackets.getModule("command/CommandManager"),
        Menus           = brackets.getModule("command/Menus"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        HTMLUtils       = brackets.getModule("language/HTMLUtils"),
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        ModalBar        = brackets.getModule('widgets/ModalBar').ModalBar,
    
        CMDID           = "0674272bac.html-tagrename",
        
        editMenu        = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    
    var markOption = {clearOnEnter: true, className: "tagrenamer-match"};
    
    function startRename() {
        var editor = EditorManager.getFocusedEditor(),
            cm = editor._codeMirror,
            pos = editor.getCursorPos(),
            tagInfo = HTMLUtils.getTagInfo(editor, pos),
            matches = CodeMirror.findMatchingTag(cm, pos);
        var tagName, tagOpen, tagClose, openMark, closeMark, start, close;
        
        // get tagInfo, position
        tagName = tagInfo.tagName;
        
        tagOpen = {};
        tagOpen.start = {
            line: matches.open.from.line,
            ch: matches.open.from.ch + 1 // <
        };
        tagOpen.end = {
            line: tagOpen.start.line,
            ch: tagOpen.start.ch + tagName.length
        };
        
        if (matches.close) {
            tagClose = {};
            tagClose.start = {
                line: matches.close.from.line,
                ch: matches.close.from.ch + 2 // </
            };
            tagClose.end = {
                line: tagClose.start.line,
                ch: tagClose.start.ch + tagName.length
            };
        }
        
        // openMark = cm.markText(tagOpen.start, tagOpen.end, markOption);
        // closeMark = cm.markText(tagClose.start, tagClose.end, markOption);
        
        // Create modal bar
        var bar = new ModalBar("'" + tagName + "' change to <input type='text' value='" + tagName + "' style='width:8em'>", true, false);
        
        // Replace tag name
        bar.getRoot().keydown(function (ev) {
            if (ev.keyCode !== 13) { return; }
            bar.close();
            
            var newTagName = $("input", bar.getRoot()).val();
            
            if (tagClose) {
                editor.document.replaceRange(newTagName, tagClose.start, tagClose.end, "*" + CMDID);
            }
            editor.document.replaceRange(newTagName, tagOpen.start, tagOpen.end, "*" + CMDID);
        });
    }
    
    // Register command
    CommandManager.register("Rename tag name", CMDID, function () {
        console.log("run");
        
        var editor = EditorManager.getFocusedEditor();
        if (!editor || editor.getModeForSelection() !== "html") { return; }
        
        var pos = editor.getCursorPos();
        var tagInfo = HTMLUtils.getTagInfo(editor, pos);
        var tokenType = tagInfo.position.tokenType;
        
        if (tokenType !== HTMLUtils.CLOSING_TAG &&
                tokenType !== HTMLUtils.TAG_NAME) { return; }
        if (!CodeMirror.findMatchingTag(editor._codeMirror, pos)) { return; }
        
        startRename();
    });
    
    
    var keys = [
        {key: "Ctrl-Shift-R", platform: "mac"},
        {key: "Ctrl-Shift-R", platform: "win"},
        {key: "Ctrl-Shift-R", platform: "linux"}
    ];
    
    editMenu.addMenuItem(CMDID, keys, Menus.LAST_IN_SECTION,
         Menus.MenuSection.EDIT_REPLACE_COMMANDS);
});