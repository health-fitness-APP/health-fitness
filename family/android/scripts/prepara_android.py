"""Prepara il progetto Android di FamilyManager: permesso fotocamera, icone, versione e firma."""
import os, re, shutil, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AND = os.path.join(ROOT, "android")
build = int(sys.argv[1]) if len(sys.argv) > 1 else 1
mf = os.path.join(AND, "app/src/main/AndroidManifest.xml")
m = open(mf, encoding="utf-8").read()
if "android.permission.CAMERA" not in m:
    m = m.replace('<uses-permission android:name="android.permission.INTERNET" />',
                  '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />')
open(mf, "w", encoding="utf-8").write(m)
bg = os.path.join(AND, "app/build.gradle")
g = open(bg, encoding="utf-8").read()
g = re.sub(r"versionCode \d+", f"versionCode {build}", g)
g = re.sub(r'versionName "[^"]*"', f'versionName "1.{build}"', g)
if "signingConfigs" not in g:
    g = g.replace("    buildTypes {", """    signingConfigs {
        release {
            storeFile file(System.getenv('FM_KEYSTORE'))
            storePassword System.getenv('FM_KEYPASS')
            keyAlias 'familymanager'
            keyPassword System.getenv('FM_KEYPASS')
            storeType 'pkcs12'
        }
    }
    buildTypes {""", 1)
    g = g.replace("            minifyEnabled false", "            minifyEnabled false\n            signingConfig signingConfigs.release", 1)
if "checkReleaseBuilds" not in g:
    g = g.replace("android {", "android {\n    lint { checkReleaseBuilds false; abortOnError false }", 1)
open(bg, "w", encoding="utf-8").write(g)
res = os.path.join(AND, "app/src/main/res")
shutil.rmtree(os.path.join(res, "mipmap-anydpi-v26"), ignore_errors=True)
icons = os.path.join(ROOT, "icons")
for d in os.listdir(icons):
    for name in os.listdir(os.path.join(icons, d)):
        os.makedirs(os.path.join(res, d), exist_ok=True)
        shutil.copy(os.path.join(icons, d, name), os.path.join(res, d, name))
print(f"Progetto pronto: versione 1.{build}")
