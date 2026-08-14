const fs = require('fs');
let path = 'src/domain/services/scheduling-engine/pipeline/candidate-generator.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `            candidates.push(this.generateCandidate(book, teacher, chunk, slot));
          }
        }
      }
    }

    return candidates;`,
  `            candidates.push(this.generateCandidate(book, teacher, chunk, slot));
            generatedCount++;
          }
        }
        if (generatedCount === 0) {
          recordReason(chunk, 'NO_MUTUAL_AVAILABILITY');
        }
      }
    }
    }

    return { candidates, rejectionReasons };`
);

fs.writeFileSync(path, code);
console.log('fixed candidate-generator.ts');
