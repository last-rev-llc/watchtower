/**
 * Build Integrity Health Check
 * Verifies environment variables, build artifacts, and runtime
 */

import type { Check, StatusNode, BuildCheckConfig, Status } from '../core/types';
import {
  createStatusNode,
  aggregateStatus,
  getStatusMessage,
  measureTime
} from '../core/aggregator';
import fs from 'fs';
import path from 'path';

/**
 * Create a build integrity health check
 */
export function createBuildCheck(config: BuildCheckConfig): Check {
  return {
    id: 'build',
    name: 'Build Integrity',
    async run(): Promise<StatusNode> {
      const checks: StatusNode[] = [];

      try {
        // 1. Node.js version check
        const { result: nodeCheck } = await measureTime(async () => {
          const version = process.version;
          return createStatusNode(
            'node_version',
            'Node.js Version',
            'Up',
            `Node.js ${version}`,
            undefined,
            { duration: 0, version }
          );
        });
        checks.push(nodeCheck);

        // 2. Package.json check
        if (config.checkPackageJson !== false) {
          const { result: pkgCheck } = await measureTime(async () => {
            try {
              const pkgPath = path.join(process.cwd(), 'package.json');
              const exists = fs.existsSync(pkgPath);
              if (exists) {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                return createStatusNode(
                  'package_json',
                  'Package.json',
                  'Up',
                  'Valid package.json',
                  undefined,
                  { duration: 0, valid: true, name: pkg.name, version: pkg.version }
                );
              }
              return createStatusNode(
                'package_json',
                'Package.json',
                'Down',
                'Package.json not found',
                undefined,
                { duration: 0, valid: false }
              );
            } catch (error) {
              return createStatusNode(
                'package_json',
                'Package.json',
                'Partial',
                `Error reading package.json: ${(error as Error).message}`,
                undefined,
                { duration: 0, valid: false }
              );
            }
          });
          checks.push(pkgCheck);
        }

        // 3. Critical environment variables check
        if (config.criticalEnv && config.criticalEnv.length > 0) {
          const { result: criticalEnvCheck } = await measureTime(async () => {
            const missing: string[] = [];
            const present: string[] = [];

            for (const varName of config.criticalEnv!) {
              if (process.env[varName]) {
                present.push(varName);
              } else {
                missing.push(varName);
              }
            }

            let status: Status = 'Up';
            let message = `All ${present.length} critical vars present`;

            if (missing.length > 0) {
              status = 'Down';
              message = `Missing ${missing.length} critical vars`;
            }

            return createStatusNode(
              'critical_env_vars',
              'Critical Environment Variables',
              status,
              message,
              undefined,
              { duration: 0, present: present.length, missing: missing.length }
            );
          });
          checks.push(criticalEnvCheck);
        }

        // 4. Optional environment variables check
        if (config.optionalEnv && config.optionalEnv.length > 0) {
          const { result: optionalEnvCheck } = await measureTime(async () => {
            const missing: string[] = [];
            const present: string[] = [];

            for (const varName of config.optionalEnv!) {
              if (process.env[varName]) {
                present.push(varName);
              } else {
                missing.push(varName);
              }
            }

            const total = present.length + missing.length;
            return createStatusNode(
              'optional_env_vars',
              'Optional Environment Variables',
              'Up',
              `${present.length}/${total} present`,
              undefined,
              { duration: 0, present: present.length, missing: missing.length, total }
            );
          });
          checks.push(optionalEnvCheck);
        }

        const overallStatus = aggregateStatus(checks);

        return createStatusNode(
          'build',
          'Build Integrity',
          overallStatus,
          getStatusMessage(overallStatus, 'Build Integrity'),
          checks,
          { duration: 0 }
        );
      } catch (error) {
        return createStatusNode(
          'build',
          'Build Integrity',
          'Unknown',
          `Build check failed: ${(error as Error).message}`,
          undefined
        );
      }
    }
  };
}
