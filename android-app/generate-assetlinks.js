const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const projectDir = __dirname;
const secrets = Object.fromEntries(
  fs
    .readFileSync(path.join(projectDir, "signing-secrets.properties"), "utf8")
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);
const bubblewrapConfig = JSON.parse(
  fs.readFileSync(
    path.join(process.env.USERPROFILE || "", ".bubblewrap", "config.json"),
    "utf8",
  ),
);
const keytool = path.join(bubblewrapConfig.jdkPath, "bin", "keytool.exe");
const temporaryKeyStorePath = path.join(
  os.tmpdir(),
  `apso-fingerprint-${crypto.randomUUID()}.keystore`,
);

fs.copyFileSync(path.join(projectDir, "android.keystore"), temporaryKeyStorePath);
try {
  const result = spawnSync(
    keytool,
    [
      "-list",
      "-v",
      "-keystore",
      temporaryKeyStorePath,
      "-alias",
      secrets.keyAlias,
      "-storepass",
      secrets.storePassword,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Could not read signing key.");
  }
  const fingerprint = result.stdout.match(/SHA256:\s*([0-9A-F:]+)/i)?.[1];
  if (!fingerprint) throw new Error("SHA-256 fingerprint was not found.");

  const assetLinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "vn.apso.app",
        sha256_cert_fingerprints: [fingerprint.toUpperCase()],
      },
    },
  ];
  fs.writeFileSync(
    path.join(projectDir, "assetlinks.json"),
    `${JSON.stringify(assetLinks, null, 2)}\n`,
    "utf8",
  );
  console.log(`Generated assetlinks.json for vn.apso.app (${fingerprint.toUpperCase()}).`);
} finally {
  fs.rmSync(temporaryKeyStorePath, { force: true });
}

