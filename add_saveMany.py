import os
import re

for root, dirs, files in os.walk("src/application/use-cases/"):
    for file in files:
        if file.endswith(".test.ts"):
            path = os.path.join(root, file)
            with open(path, "r") as f:
                content = f.read()

            # We want to replace `const mockClassRepo: IClassRepository = {`
            # or `mockClassRepo: IClassRepository = {`
            
            # Let's do a regex replacement. We match IClassRepository = { ... archive: vi.fn()
            
            def replacer(match):
                block = match.group(0)
                if 'saveMany:' not in block:
                    return block.replace('archive: vi.fn(),', 'saveMany: vi.fn(),\n      archive: vi.fn(),')
                return block
                
            content = re.sub(r'IClassRepository = \{.*?\};', replacer, content, flags=re.DOTALL)

            with open(path, "w") as f:
                f.write(content)

