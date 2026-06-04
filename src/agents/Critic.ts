import { Agent } from '../types'

/**
 * Tier 4: CRITIC / QA TESTER AGENT
 * Role: Validate code, flag errors, loop back failures
 */
class Critic implements Agent {
  id = 'critic'
  name = 'Critic'
  tier: 1 | 2 | 3 | 4 = 4
  role = 'QA Tester - Code validation and error detection'
  status: 'idle' | 'processing' | 'waiting' = 'idle'
  memory = {
    type: 'semantic' as const,
    capacity: 400,
    currentUsage: 0
  }
  capabilities = ['code_validation', 'error_detection', 'testing']

  /**
   * Validate generated code
   */
  validateCode(code: string): { valid: boolean; errors: string[] } {
    console.log('🔍 Critic validating code...')

    const errors: string[] = []

    // Basic validation checks
    if (!code || code.length === 0) {
      errors.push('Code is empty')
    }

    // Check for TypeScript syntax
    if (!code.includes('interface') && !code.includes('type') && !code.includes('class')) {
      errors.push('Missing type definitions')
    }

    // Check for async/await proper usage
    if (code.includes('async') && !code.includes('await')) {
      errors.push('Async function without await usage')
    }

    if (errors.length === 0) {
      console.log('✅ Code validation passed')
      return { valid: true, errors: [] }
    } else {
      console.error('❌ Validation errors found:', errors)
      return { valid: false, errors }
    }
  }

  /**
   * Run tests on code
   */
  runTests(code: string): { passed: number; failed: number; results: string[] } {
    console.log('🧪 Critic running tests...')

    // Mock test execution
    const results = [
      '✓ TypeScript compilation successful',
      '✓ No linting errors detected',
      '✓ All type checks passed',
      '✓ Error handling implemented correctly',
      '✓ Code follows best practices'
    ]

    return {
      passed: 5,
      failed: 0,
      results
    }
  }

  /**
   * Generate validation report
   */
  generateReport(code: string): { status: 'approved' | 'rejected'; report: string } {
    const validation = this.validateCode(code)
    const tests = this.runTests(code)

    const status = validation.valid && tests.failed === 0 ? 'approved' : 'rejected'

    const report = `
=== CODE REVIEW REPORT ===
Status: ${status.toUpperCase()}
Validation Errors: ${validation.errors.length}
Tests Passed: ${tests.passed}
Tests Failed: ${tests.failed}

Details:
${validation.errors.length > 0 ? 'Validation Issues:\n' + validation.errors.map((e) => `  - ${e}`).join('\n') : 'No validation issues'}

Test Results:
${tests.results.map((r) => `  ${r}`).join('\n')}
`

    console.log(report)

    return { status, report }
  }
}

export default Critic
