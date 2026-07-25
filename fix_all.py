import os
import re

for root, dirs, files in os.walk("src/application/use-cases/"):
    for file in files:
        if file.endswith(".test.ts"):
            path = os.path.join(root, file)
            with open(path, "r") as f:
                content = f.read()

            # Remove all exact saveMany: vi.fn(), lines
            content = content.replace("saveMany: vi.fn(),\n", "")
            content = content.replace("saveMany: vi.fn().mockImplementation((cs) => Promise.resolve(cs)),\n", "")
            # Clean any extra spaces if needed
            content = re.sub(r' +saveMany: vi.fn\(\),\n', '', content)
            
            # Now we add it specifically ONLY to IClassRepository mocks.
            # We can find `const mockClassRepo: IClassRepository = {`
            # and insert `saveMany: vi.fn(),` inside.
            # easiest way: replace `save: vi.fn(),` with `save: vi.fn(),\n      saveMany: vi.fn(),` ONLY for ClassRepo.
            # but wait, `save: vi.fn().mockImplementation(...)` is also there.
            
            # Let's just fix the IClassRepository type errors by ensuring `saveMany` is present
            
            with open(path, "w") as f:
                f.write(content)

