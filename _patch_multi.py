path = r"D:\工作文档\Codex Work\日程安排\index.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Update AI system prompt (in the Worker URL call, add instruction for array)
# Actually the system prompt is in the Worker, not in the HTML.
# I need to tell the user to update the Worker code.
# For the HTML side, I need to update parseAiInput to handle arrays.

# Replace the AI parse function
old_parse = """    // Extract JSON from DeepSeek response
    var content = result.choices && result.choices[0] && result.choices[0].message 
      ? result.choices[0].message.content : '';
    
    if(!content){
      preview.innerHTML = '<div style="color:var(--danger)">AI 未返回结果，请重试</div>';
      preview.classList.add('show');
      return;
    }
    
    // Clean up: remove markdown code fences if present
    content = content.replace('```json','').replace('```','').trim();
    var parsed = JSON.parse(content);
    
    // Map category name to ID
    var catMap = {'工作':'cat_work','个人':'cat_personal','学习':'cat_study','重要':'cat_important'};
    var catName = parsed.category || '工作';
    var catId = catMap[catName] || 'cat_work';
    
    _aiParsedTask = {
      date: parsed.date || '',
      endDate: parsed.endDate || '',
      time: parsed.time || '',
      title: parsed.title || input,
      category: catId,
      note: parsed.note || ''
    };
    
    var cat = getCategory(catId) || appData.categories[0];
    
    preview.innerHTML = 
      '<div class="ai-preview-item"><span class="ai-label">📅 日期</span><span class="ai-value">' + (_aiParsedTask.date || '待办') + '</span></div>' +
      (_aiParsedTask.endDate ? '<div class="ai-preview-item"><span class="ai-label">📅 结束</span><span class="ai-value">' + _aiParsedTask.endDate + '</span></div>' : '') +
      (_aiParsedTask.time ? '<div class="ai-preview-item"><span class="ai-label">⏰ 时间</span><span class="ai-value">' + _aiParsedTask.time + '</span></div>' : '') +
      '<div class="ai-preview-item"><span class="ai-label">📝 标题</span><span class="ai-value">' + escHtml(_aiParsedTask.title) + '</span></div>' +
      '<div class="ai-preview-item"><span class="ai-label">🏷 分类</span><span class="ai-value" style="color:' + cat.color + ';font-weight:600">' + catName + '</span></div>' +
      (_aiParsedTask.note ? '<div class="ai-preview-item"><span class="ai-label">💬 备注</span><span class="ai-value">' + escHtml(_aiParsedTask.note) + '</span></div>' : '');
    
    preview.classList.add('show');
    confirmBtn.style.display = 'inline-flex';"""

new_parse = """    // Extract JSON from DeepSeek response
    var msgContent = result.choices && result.choices[0] && result.choices[0].message 
      ? result.choices[0].message.content : '';
    
    if(!msgContent){
      preview.innerHTML = '<div style="color:var(--danger)">AI 未返回结果，请重试</div>';
      preview.classList.add('show');
      return;
    }
    
    // Clean up: remove markdown code fences if present
    msgContent = msgContent.replace('```json','').replace('```','').trim();
    var parsed = JSON.parse(msgContent);
    
    // Normalize to array
    var taskList = Array.isArray(parsed) ? parsed : [parsed];
    
    var catMap = {'工作':'cat_work','个人':'cat_personal','学习':'cat_study','重要':'cat_important'};
    
    _aiParsedTasks = [];
    var html = '';
    for(var i = 0; i < taskList.length; i++){
      var t = taskList[i];
      var catName = t.category || '工作';
      var catId = catMap[catName] || 'cat_work';
      var cat = getCategory(catId) || appData.categories[0];
      
      var task = {
        date: t.date || '',
        endDate: t.endDate || '',
        time: t.time || '',
        title: t.title || ('任务' + (i+1)),
        category: catId,
        note: t.note || ''
      };
      _aiParsedTasks.push(task);
      
      var isLast = (i === taskList.length - 1);
      html += '<div class="ai-preview-item" style="padding:8px 0;' + (isLast ? '' : 'border-bottom:1px solid var(--border-light)') + '">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">';
      html += '<span style="font-weight:700;color:var(--accent);min-width:20px">#' + (i+1) + '</span>';
      html += '<span style="font-weight:600">' + escHtml(task.title) + '</span>';
      html += '<span style="font-size:.7rem;color:#fff;background:' + cat.color + ';padding:1px 7px;border-radius:8px">' + catName + '</span>';
      html += '</div>';
      html += '<div style="font-size:.75rem;color:var(--text-muted);padding-left:28px">';
      html += (task.date ? '📅 ' + task.date : '📥 待办') + ' ';
      html += (task.time ? '⏰ ' + task.time + ' ' : '');
      html += (task.endDate ? '→ ' + task.endDate + ' ' : '');
      html += (task.note ? '💬 ' + escHtml(task.note) : '');
      html += '</div></div>';
    }
    
    preview.innerHTML = html;
    preview.classList.add('show');
    confirmBtn.style.display = 'inline-flex';
    confirmBtn.textContent = '✅ 确认添加 (' + taskList.length + '项)';"""

content = content.replace(old_parse, new_parse, 1)
print("parseAiInput updated for multi-task")

# Update confirmAiTask to handle array
old_confirm = """function confirmAiTask(){
  if(!_aiParsedTask) return;
  appData.tasks.push({
    id: 't' + Date.now(),
    date: _aiParsedTask.date,
    endDate: _aiParsedTask.endDate,
    time: _aiParsedTask.time,
    title: _aiParsedTask.title,
    category: _aiParsedTask.category,
    done: false,
    location: '',
    description: _aiParsedTask.note || ''
  });
  saveData();
  closeAiModal();
  renderCalendar();
  if(typeof renderInbox === 'function') renderInbox();
  showToast('已添加：' + _aiParsedTask.title);
}"""

new_confirm = """function confirmAiTask(){
  var tasks = _aiParsedTasks;
  if(!tasks || !tasks.length) return;
  for(var i = 0; i < tasks.length; i++){
    var t = tasks[i];
    appData.tasks.push({
      id: 't' + Date.now() + '_' + i,
      date: t.date,
      endDate: t.endDate,
      time: t.time,
      title: t.title,
      category: t.category,
      done: false,
      location: '',
      description: t.note || ''
    });
  }
  saveData();
  closeAiModal();
  renderCalendar();
  if(typeof renderInbox === 'function') renderInbox();
  showToast('已添加 ' + tasks.length + ' 项任务');
}"""

content = content.replace(old_confirm, new_confirm, 1)
print("confirmAiTask updated for multi-task")

# Update _aiParsedTask to _aiParsedTasks in closeAiModal reset
old_reset = "_aiParsedTask = null;"
new_reset = "_aiParsedTasks = null;"
content = content.replace("  _aiParsedTask = null;" + "\n" + "}", "  _aiParsedTasks = null;" + "\n" + "}", 1)
# Also in the open function
content = content.replace("  _aiParsedTask = null;" + "\n" + "}", "  _aiParsedTasks = null;" + "\n" + "}", 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print(f"Done: {len(content)} chars")
