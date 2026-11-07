local function add_quiz_assets()
  quarto.doc.add_html_dependency({
    name = "freecampus-quiz",
    version = "0.1.0",
    scripts = {{path = "quiz.js", attribs = {defer = "defer"}}},
    stylesheets = {"quiz.css"}
  })
end

local function attribute(attributes, name)
  local pattern = "%s" .. name .. "%s*=%s*"
  return attributes:match(pattern .. '"([^"]*)"') or
    attributes:match(pattern .. "'([^']*)'")
end

local function register_raw_quiz(block)
  if block.format ~= "html" or not quarto.doc.is_format("html:js") then
    return
  end
  for attributes in block.text:gmatch("<script(%s[^>]*)>") do
    local classes = " " .. (attribute(attributes, "class") or "") .. " "
    if attribute(attributes, "type") == "application/json" and (
      classes:match("%sfcpython%-ojs%-quiz%-config%s") or
      classes:match("%sfreecampus%-quiz%-config%s")
    ) then
      add_quiz_assets()
      return
    end
  end
end

local function static_quiz(quiz)
  local blocks = {pandoc.Para({pandoc.Strong({pandoc.Str(quiz.title)})})}
  if type(quiz.instructions) == "string" and quiz.instructions ~= "" then
    blocks[#blocks + 1] = pandoc.Para({pandoc.Str(quiz.instructions)})
  end
  local questions = {}
  for _, question in ipairs(quiz.questions) do
    if type(question) ~= "table" or type(question.prompt) ~= "string" or
      type(question.options) ~= "table" or #question.options < 2 then
      error("Each freecampus-quiz question needs a prompt and at least two options.")
    end
    local options = {}
    for _, option in ipairs(question.options) do
      if type(option) ~= "string" then
        error("Each freecampus-quiz option must be a string.")
      end
      options[#options + 1] = {pandoc.Plain({pandoc.Str(option)})}
    end
    questions[#questions + 1] = {
      pandoc.Para({pandoc.Str(question.prompt)}),
      pandoc.BulletList(options)
    }
  end
  blocks[#blocks + 1] = pandoc.OrderedList(questions)
  return pandoc.Div(blocks)
end

local function render_quiz_block(block)
  if not block.classes:includes("freecampus-quiz") then
    return
  end
  local ok, quiz = pcall(quarto.json.decode, block.text)
  if not ok then
    error("Invalid JSON in freecampus-quiz block: " .. tostring(quiz))
  end
  if type(quiz) ~= "table" or type(quiz.title) ~= "string" or
    type(quiz.questions) ~= "table" or #quiz.questions == 0 then
    error("A freecampus-quiz block needs a title and at least one question.")
  end
  if not quarto.doc.is_format("html:js") then
    return static_quiz(quiz)
  end

  add_quiz_assets()
  -- An HTML script element ends at a literal closing tag, even inside JSON strings.
  local payload = block.text:gsub("<", "\\u003c")
  return pandoc.RawBlock("html",
    '<script type="application/json" class="freecampus-quiz-config">' .. payload .. '</script>')
end

return {
  RawBlock = register_raw_quiz,
  CodeBlock = render_quiz_block
}
