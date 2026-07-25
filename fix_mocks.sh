FILES=$(grep -rn "const mockClassRepo: IClassRepository = {" src/application/use-cases/ | cut -d: -f1)
for FILE in $FILES; do
  sed -i 's/archive: vi.fn(),/saveMany: vi.fn(),\n      archive: vi.fn(),/g' $FILE
done
