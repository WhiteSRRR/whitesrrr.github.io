path = r"D:\工作文档\Codex Work\日程安排\calendar\index.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove voice button HTML
old_voice_btn = "\n      <button class=\"action-btn\" id=\"aiVoiceBtn\" onclick=\"startVoiceInput()\" title=\"语音输入\" style=\"flex-shrink:0;height:80px;width:44px;justify-content:center;font-size:1.2rem\">\u{1f3a4}</button>"
content = content.replace(old_voice_btn, "", 1)
# Remove the flex wrapper - change back to plain textarea
old_wrapper = '<div style="display:flex;gap:8px;align-items:flex-start">\n      <textarea id="aiInput"'
new_wrapper = '<textarea id="aiInput"'
content = content.replace(old_wrapper, new_wrapper, 1)
# Close the extra </div>
old_close_div = '</textarea>\n      </div>\n      <button class="action-btn"'
# Just remove the orphaned </div> and button
old_close_div2 = '</div>\n      </div>'
new_close_div2 = '</div>'
content = content.replace(old_close_div2, new_close_div2, 1)

# Remove voice JS - find the block
old_voice_js_start = "\n// ===== VOICE INPUT ====="
old_voice_js_end = "showToast('\u{1f3a4} 正在聆听...');\n}"
# Find and remove the whole voice block
start_idx = content.find(old_voice_js_start)
if start_idx >= 0:
    end_idx = content.find("}", content.find("showToast('\u{1f3a4}", start_idx)) + 1
    content = content[:start_idx] + content[end_idx+1:]
    print("Voice JS removed")
else:
    print("Voice JS block not found at expected position")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print(f"Done: {len(content)} chars")
