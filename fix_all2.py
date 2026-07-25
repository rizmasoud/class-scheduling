import os
import re

for root, dirs, files in os.walk("src/application/use-cases/"):
    for file in files:
        if file.endswith(".test.ts"):
            path = os.path.join(root, file)
            with open(path, "r") as f:
                content = f.read()

            def replacer(match):
                block = match.group(0)
                if 'saveMany:' not in block:
                    # just insert it after save:
                    return re.sub(r'(save:\s*vi\.fn\(\)(?:\.mock[A-Za-z]+\([^)]+\))?,)', r'\1\n      saveMany: vi.fn(),', block)
                return block
                
            content = re.sub(r'IClassRepository = \{.*?\};', replacer, content, flags=re.DOTALL)

            with open(path, "w") as f:
                f.write(content)

