import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const keystoreProps = resolve(root, 'android', 'keystore.properties');
const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(keystoreProps)) {
  console.error('Missing android/keystore.properties. Run: npm run android:keystore');
  process.exit(1);
}

run('npm', ['run', 'build:prod']);
run('npm', ['run', 'mobile:assets']);
run('npx', ['cap', 'sync', 'android']);
run(gradleCmd, ['clean', 'bundleRelease', 'assembleRelease'], resolve(root, 'android'));

console.log('\nRelease build complete.');
console.log('AAB: android/app/build/outputs/bundle/release/app-release.aab');
console.log('APK: android/app/build/outputs/apk/release/app-release.apk');
