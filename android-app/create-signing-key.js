const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const projectDir = __dirname;
const keyStorePath = path.join(projectDir, "android.keystore");
const secretPath = path.join(projectDir, "signing-secrets.properties");

if (fs.existsSync(keyStorePath) || fs.existsSync(secretPath)) {
  console.error("Signing material already exists. Nothing was overwritten.");
  process.exit(1);
}

const bubblewrapConfigPath = path.join(
  process.env.USERPROFILE || "",
  ".bubblewrap",
  "config.json",
);
const bubblewrapConfig = JSON.parse(fs.readFileSync(bubblewrapConfigPath, "utf8"));
const keytool = path.join(bubblewrapConfig.jdkPath, "bin", "keytool.exe");
const password = crypto.randomBytes(24).toString("base64url");
const temporaryKeyStorePath = path.join(
  os.tmpdir(),
  `apso-android-${crypto.randomUUID()}.keystore`,
);

const result = spawnSync(
  keytool,
  [
    "-genkeypair",
    "-v",
    "-keystore",
    temporaryKeyStorePath,
    "-alias",
    "apso",
    "-keyalg",
    "RSA",
    "-keysize",
    "2048",
    "-validity",
    "10000",
    "-storepass",
    password,
    "-keypass",
    password,
    "-dname",
    "CN=APSO, OU=Phat trien, O=APSO, L=Viet Nam, ST=Viet Nam, C=VN",
  ],
  { encoding: "utf8" },
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "Could not create signing key.");
  process.exit(result.status || 1);
}

fs.copyFileSync(temporaryKeyStorePath, keyStorePath, fs.constants.COPYFILE_EXCL);
fs.unlinkSync(temporaryKeyStorePath);

fs.writeFileSync(
  secretPath,
  `storePassword=${password}\nkeyPassword=${password}\nkeyAlias=apso\n`,
  { encoding: "utf8", flag: "wx" },
);

console.log("Created the APSO Android signing key and its local secret file.");
