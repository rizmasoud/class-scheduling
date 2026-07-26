import os

use_cases = []
for root, dirs, files in os.walk("src/application/use-cases/"):
    for file in files:
        if file.endswith(".use-case.ts"):
            path = os.path.join(root, file)
            with open(path, "r") as f:
                content = f.read()
            # find class name
            import re
            match = re.search(r'export class ([A-Za-z0-9_]+)', content)
            if match:
                class_name = match.group(1)
                
                # find constructor params to know which repos it needs
                # e.g. constructor(private readonly bookRepository: IBookRepository)
                params_match = re.search(r'constructor\((.*?)\)', content, re.DOTALL)
                params = []
                if params_match:
                    params_str = params_match.group(1)
                    param_lines = params_str.split(',')
                    for line in param_lines:
                        line = line.strip()
                        if not line: continue
                        # e.g. private readonly bookRepository: IBookRepository
                        name_type = line.split(':')
                        if len(name_type) > 1:
                            repo_type = name_type[1].strip()
                            # simplify repo_type
                            if repo_type.startswith('I'):
                                repo_name = repo_type[1].lower() + repo_type[2:]
                                repo_name = repo_name[0].lower() + repo_name[1:]
                                params.append(repo_name)
                
                # relative import path from src/app/container.ts
                # path is src/application/use-cases/books/create-book.use-case.ts
                rel_path = path.replace('src/', '@/')[:-3]
                use_cases.append((class_name, rel_path, params))

repositories = [
    ("BookRepository", "@/infrastructure/repositories/book.repository"),
    ("ClassRepository", "@/infrastructure/repositories/class.repository"),
    ("ExamRepository", "@/infrastructure/repositories/exam.repository"),
    ("ProposalRepository", "@/infrastructure/repositories/proposal.repository"),
    ("StudentRepository", "@/infrastructure/repositories/student.repository"),
    ("TeacherRepository", "@/infrastructure/repositories/teacher.repository"),
]

with open('src/app/container.ts', 'w') as f:
    f.write("import { getDatabase } from '@/core/database';\n")
    for repo, path in repositories:
        f.write(f"import {{ {repo} }} from '{path}';\n")
    
    for uc, path, params in use_cases:
        f.write(f"import {{ {uc} }} from '{path}';\n")
        
    f.write("\n")
    f.write("export interface AppContainer {\n")
    for uc, path, params in use_cases:
        uc_camel = uc[0].lower() + uc[1:]
        f.write(f"  {uc_camel}: {uc};\n")
    f.write("}\n\n")
    
    f.write("let containerInstance: AppContainer | null = null;\n\n")
    f.write("export const initContainer = async (): Promise<AppContainer> => {\n")
    f.write("  if (containerInstance) return containerInstance;\n\n")
    
    f.write("  const db = await getDatabase();\n\n")
    f.write("  // Repositories\n")
    for repo, path in repositories:
        repo_camel = repo[0].lower() + repo[1:]
        f.write(f"  const {repo_camel} = new {repo}(db);\n")
        
    f.write("\n  // Use Cases\n")
    for uc, path, params in use_cases:
        uc_camel = uc[0].lower() + uc[1:]
        args = ", ".join(params)
        f.write(f"  const {uc_camel} = new {uc}({args});\n")
        
    f.write("\n  containerInstance = {\n")
    for uc, path, params in use_cases:
        uc_camel = uc[0].lower() + uc[1:]
        f.write(f"    {uc_camel},\n")
    f.write("  };\n\n")
    
    f.write("  return containerInstance;\n")
    f.write("};\n\n")
    
    f.write("export const getContainer = (): AppContainer => {\n")
    f.write("  if (!containerInstance) {\n")
    f.write("    throw new Error('Container not initialized. Call initContainer first.');\n")
    f.write("  }\n")
    f.write("  return containerInstance;\n")
    f.write("};\n")
