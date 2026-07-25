import os
import re

for root, dirs, files in os.walk("src/application/use-cases/proposals/__tests__/"):
    for file in files:
        if file.endswith(".test.ts"):
            path = os.path.join(root, file)
            with open(path, "r") as f:
                content = f.read()

            def replacer(match):
                block = match.group(0)
                if 'saveWithClasses:' not in block:
                    return re.sub(r'(save:\s*vi\.fn\(\)(?:\.mock[A-Za-z]+\([^)]+\))?,)', r'\1\n      saveWithClasses: vi.fn(),', block)
                return block
                
            content = re.sub(r'IProposalRepository = \{.*?\};', replacer, content, flags=re.DOTALL)

            with open(path, "w") as f:
                f.write(content)

