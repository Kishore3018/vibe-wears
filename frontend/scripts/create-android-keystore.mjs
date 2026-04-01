import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const keystoreDir = resolve(root, 'android', 'keystore');
const keystorePath = resolve(keystoreDir, 'vibewears-upload.keystore');
const propsPath = resolve(root, 'android', 'keystore.properties');
const alias = process.env.VW_KEY_ALIAS || 'vibewearsupload';
const storePassword = process.env.VW_STORE_PASSWORD || randomBytes(12).toString('base64url');
const keyPassword = process.env.VW_KEY_PASSWORD || storePassword;
const dname = process.env.VW_KEY_DNAME || 'CN=Vibe Wears, OU=Mobile, O=Vibe Wears, L=Karur, S=Tamil Nadu, C=IN';

function resolveKeytool() {
  const directCandidates = [
    process.env.JAVA_HOME ? resolve(process.env.JAVA_HOME, 'bin', 'keytool') : null,
    process.env.JAVA_HOME ? resolve(process.env.JAVA_HOME, 'bin', 'keytool.exe') : null,
    'C:/Program Files/Java/jdk-24/bin/keytool.exe',
    'C:/Program Files/Java/jdk-21/bin/keytool.exe',
    'C:/Program Files/Java/jdk-17/bin/keytool.exe'
  ].filter(Boolean);

  for (const candidate of directCandidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  const locator = process.platform === 'win32' ? 'where' : 'which';
  const keytoolLookup = spawnSync(locator, ['keytool'], {
    encoding: 'utf8',
    shell: false
  });

  if (keytoolLookup.status === 0 && keytoolLookup.stdout) {
    const firstMatch = keytoolLookup.stdout.split(/\r?\n/).find((line) => line.trim().length > 0);
    if (firstMatch) {
      return firstMatch.trim();
    }
  }

  return 'keytool';
}

const keytool = resolveKeytool();

if (!existsSync(keystoreDir)) {
  mkdirSync(keystoreDir, { recursive: true });
}

if (!existsSync(keystorePath)) {
  const args = [
    '-genkeypair',
    '-v',
    '-storetype',
    'JKS',
    '-keystore',
    keystorePath,
    '-alias',
    alias,
    '-keyalg',
    'RSA',
    '-keysize',
    '2048',
    '-validity',
    '10000',
    '-storepass',
    storePassword,
    '-keypass',
    keyPassword,
    '-dname',
    dname
  ];

  const result = spawnSync(keytool, args, {
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const properties = [
  `storeFile=keystore/vibewears-upload.keystore`,
  `storePassword=${storePassword}`,
  `keyAlias=${alias}`,
  `keyPassword=${keyPassword}`
].join('\n');

writeFileSync(propsPath, `${properties}\n`, { encoding: 'utf8' });

console.log('\nAndroid signing files are ready.');
console.log(`Keystore: ${keystorePath}`);
console.log(`Properties: ${propsPath}`);
console.log('Keep these passwords secret and backed up:');
console.log(`storePassword=${storePassword}`);
console.log(`keyAlias=${alias}`);
console.log(`keyPassword=${keyPassword}`);
