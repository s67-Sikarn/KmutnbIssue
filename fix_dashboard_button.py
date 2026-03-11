import re

with open('Issue/templates/dashboard.html', 'r') as f:
    content = f.read()

# Make sure we didn't accidentally replace the wrong paragraph
content = content.replace(
    '</span>\n                    </div>\n                    <div class="mt-3 flex justify-end">',
    '</span>\n                    </div>\n                    <div class="mt-3 flex justify-end">'
)

with open('Issue/templates/dashboard.html', 'w') as f:
    f.write(content)
